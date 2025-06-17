#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const CONFIG = {
    CLOUDFLARE_ACCOUNT_ID: '61f248de47f07bdbf3dd2133a5378e64',
    CLOUDFLARE_IMAGES_URL: 'https://api.cloudflare.com/client/v4/accounts/61f248de47f07bdbf3dd2133a5378e64/images/v1',
    CUSTOM_IMAGES_DOMAIN: 'img.code4history.dev',
    PROJECT_PREFIX: 'jizo_project',
    BATCH_SIZE: 5, // Number of files to process before saving progress
    DELAY_BETWEEN_UPLOADS: 2000, // 2 second delay between uploads
    UPLOAD_TIMEOUT: 120000, // 2 minute timeout for uploads
    MAX_RETRIES: 3, // Maximum retry attempts per file
    PROGRESS_FILE: './upload_progress.json'
};

// Read environment variables
const AUTH_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
if (!AUTH_TOKEN) {
    console.error('Error: CLOUDFLARE_IMAGES_API_TOKEN environment variable is required');
    console.error('Please set it with: export CLOUDFLARE_IMAGES_API_TOKEN=your_token_here');
    process.exit(1);
}

class CloudflareImageUploader {
    constructor() {
        this.progress = {
            completed: new Set(),
            failed: new Set(),
            uploadedFiles: {},
            totalFiles: 0,
            processedCount: 0,
            startTime: null,
            lastSaveTime: null
        };
    }

    async loadProgress() {
        try {
            if (fsSync.existsSync(CONFIG.PROGRESS_FILE)) {
                const data = await fs.readFile(CONFIG.PROGRESS_FILE, 'utf8');
                const savedProgress = JSON.parse(data);
                this.progress.completed = new Set(savedProgress.completed || []);
                this.progress.failed = new Set(savedProgress.failed || []);
                this.progress.uploadedFiles = savedProgress.uploadedFiles || {};
                this.progress.processedCount = savedProgress.processedCount || 0;
                this.progress.startTime = savedProgress.startTime;
                this.progress.lastSaveTime = savedProgress.lastSaveTime;
                
                console.log(`📁 Loaded progress: ${this.progress.completed.size} completed, ${this.progress.failed.size} failed`);
            }
        } catch (error) {
            console.warn('⚠️  Could not load progress file, starting fresh:', error.message);
        }
    }

    async saveProgress() {
        try {
            const progressData = {
                completed: Array.from(this.progress.completed),
                failed: Array.from(this.progress.failed),
                uploadedFiles: this.progress.uploadedFiles,
                processedCount: this.progress.processedCount,
                totalFiles: this.progress.totalFiles,
                startTime: this.progress.startTime,
                lastSaveTime: new Date().toISOString()
            };
            
            await fs.writeFile(CONFIG.PROGRESS_FILE, JSON.stringify(progressData, null, 2));
            this.progress.lastSaveTime = progressData.lastSaveTime;
        } catch (error) {
            console.error('❌ Failed to save progress:', error.message);
        }
    }

    async uploadImageWithRetry(filePath, imageId, attempt = 1) {
        try {
            const fullPath = path.join(__dirname, filePath);
            const fileBuffer = await fs.readFile(fullPath);
            const fileName = path.basename(filePath);
            const fileSizeKB = Math.round(fileBuffer.length / 1024);
            
            console.log(`   📁 File size: ${fileSizeKB}KB, Attempt: ${attempt}/${CONFIG.MAX_RETRIES}`);
            
            const formData = new FormData();
            formData.append('file', fileBuffer, fileName);
            formData.append('id', `${CONFIG.PROJECT_PREFIX}_${imageId}`);

            const response = await axios.post(CONFIG.CLOUDFLARE_IMAGES_URL, formData, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    ...formData.getHeaders()
                },
                timeout: CONFIG.UPLOAD_TIMEOUT,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            const result = response.data;
            
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
            }

            if (!result.success) {
                throw new Error(`Upload failed: ${JSON.stringify(result.errors)}`);
            }

            const imageId_final = result.result.id;
            const variants = result.result.variants || [];
            
            // Generate URLs for different variants
            const urls = {
                public: `https://${CONFIG.CUSTOM_IMAGES_DOMAIN}/${imageId_final}/public`,
                mid: `https://${CONFIG.CUSTOM_IMAGES_DOMAIN}/${imageId_final}/mid`,
                small: `https://${CONFIG.CUSTOM_IMAGES_DOMAIN}/${imageId_final}/small`
            };

            return {
                success: true,
                id: imageId_final,
                urls: urls,
                variants: variants
            };

        } catch (error) {
            console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < CONFIG.MAX_RETRIES) {
                const delay = attempt * 2000; // Exponential backoff
                console.log(`   ⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.uploadImageWithRetry(filePath, imageId, attempt + 1);
            } else {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    async uploadImage(filePath, imageId) {
        return this.uploadImageWithRetry(filePath, imageId);
    }

    async processImages() {
        // Load images.geojson
        const imagesGeojson = JSON.parse(await fs.readFile('images.geojson', 'utf8'));
        const features = imagesGeojson.features;
        
        this.progress.totalFiles = features.length;
        if (!this.progress.startTime) {
            this.progress.startTime = new Date().toISOString();
        }

        console.log(`🚀 Starting upload process for ${this.progress.totalFiles} images`);
        console.log(`📊 Already completed: ${this.progress.completed.size}`);
        console.log(`❌ Previously failed: ${this.progress.failed.size}`);
        console.log(`⏳ Remaining: ${this.progress.totalFiles - this.progress.completed.size}`);

        let batchCount = 0;
        
        for (const feature of features) {
            const fid = feature.properties.fid;
            const filePath = feature.properties.path;
            
            // Skip if already completed
            if (this.progress.completed.has(fid)) {
                continue;
            }

            // Remove leading "./" if present
            const cleanPath = filePath.startsWith('./') ? filePath.substring(2) : filePath;
            
            console.log(`\n📤 Uploading [${this.progress.processedCount + 1}/${this.progress.totalFiles}]: ${cleanPath}`);
            
            // Check if file exists
            const fullPath = path.join(__dirname, cleanPath);
            if (!fsSync.existsSync(fullPath)) {
                console.log(`⚠️  File not found: ${cleanPath}`);
                this.progress.failed.add(fid);
                this.progress.processedCount++;
                continue;
            }

            // Generate unique image ID
            const imageId = `${fid}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            
            // Upload image
            const result = await this.uploadImage(cleanPath, imageId);
            
            if (result.success) {
                console.log(`✅ Uploaded successfully: ${result.id}`);
                this.progress.completed.add(fid);
                this.progress.uploadedFiles[fid] = {
                    originalPath: cleanPath,
                    cloudflareId: result.id,
                    urls: result.urls,
                    uploadTime: new Date().toISOString()
                };
            } else {
                console.log(`❌ Upload failed: ${result.error}`);
                this.progress.failed.add(fid);
            }
            
            this.progress.processedCount++;
            batchCount++;
            
            // Save progress periodically
            if (batchCount >= CONFIG.BATCH_SIZE) {
                await this.saveProgress();
                console.log(`💾 Progress saved (${this.progress.completed.size}/${this.progress.totalFiles} completed)`);
                batchCount = 0;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_UPLOADS));
        }

        // Final save
        await this.saveProgress();
        
        console.log(`\n🎉 Upload process completed!`);
        console.log(`✅ Successfully uploaded: ${this.progress.completed.size}`);
        console.log(`❌ Failed uploads: ${this.progress.failed.size}`);
        console.log(`📊 Total processed: ${this.progress.processedCount}`);
        
        if (this.progress.failed.size > 0) {
            console.log(`\n⚠️  Failed file IDs: ${Array.from(this.progress.failed).join(', ')}`);
        }
    }

    async retryFailed() {
        if (this.progress.failed.size === 0) {
            console.log('No failed uploads to retry');
            return;
        }

        console.log(`🔄 Retrying ${this.progress.failed.size} failed uploads...`);
        
        const failedIds = Array.from(this.progress.failed);
        this.progress.failed.clear();
        
        // Re-add failed IDs to be processed
        failedIds.forEach(fid => {
            this.progress.completed.delete(fid);
        });
        
        await this.saveProgress();
        await this.processImages();
    }

    printStats() {
        // Use constant value for total files in stats command
        const totalFiles = this.progress.totalFiles || 2149;
        
        console.log('\n📈 Upload Statistics:');
        console.log(`Total files: ${totalFiles}`);
        console.log(`Completed: ${this.progress.completed.size}`);
        console.log(`Failed: ${this.progress.failed.size}`);
        console.log(`Success rate: ${((this.progress.completed.size / totalFiles) * 100).toFixed(2)}%`);
        
        if (this.progress.startTime) {
            const startTime = new Date(this.progress.startTime);
            const now = new Date();
            const elapsedMs = now - startTime;
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            console.log(`Elapsed time: ${elapsedMinutes} minutes`);
            
            if (this.progress.completed.size > 0) {
                const avgTimePerFile = elapsedMs / this.progress.completed.size;
                const remainingFiles = this.progress.totalFiles - this.progress.completed.size;
                const estimatedRemainingMs = remainingFiles * avgTimePerFile;
                const estimatedRemainingMinutes = Math.floor(estimatedRemainingMs / 60000);
                console.log(`Estimated time remaining: ${estimatedRemainingMinutes} minutes`);
            }
        }
    }
}

// Main execution
async function main() {
    const command = process.argv[2];
    const uploader = new CloudflareImageUploader();
    
    await uploader.loadProgress();
    
    switch (command) {
        case 'start':
        case undefined:
            await uploader.processImages();
            break;
        case 'retry':
            await uploader.retryFailed();
            break;
        case 'stats':
            uploader.printStats();
            break;
        case 'reset':
            if (fsSync.existsSync(CONFIG.PROGRESS_FILE)) {
                await fs.unlink(CONFIG.PROGRESS_FILE);
                console.log('🗑️  Progress file deleted. Starting fresh on next run.');
            }
            break;
        default:
            console.log('Usage:');
            console.log('  node upload_to_cloudflare.js [start]  - Start/resume upload process');
            console.log('  node upload_to_cloudflare.js retry    - Retry failed uploads');
            console.log('  node upload_to_cloudflare.js stats    - Show current statistics');
            console.log('  node upload_to_cloudflare.js reset    - Reset progress and start over');
            break;
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, saving progress...');
    const uploader = new CloudflareImageUploader();
    await uploader.loadProgress();
    await uploader.saveProgress();
    console.log('💾 Progress saved. You can resume with: node upload_to_cloudflare.js start');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}