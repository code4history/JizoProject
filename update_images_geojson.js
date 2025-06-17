#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    PROGRESS_FILE: './upload_progress.json',
    IMAGES_GEOJSON: './images.geojson',
    IMAGES_GEOJSON_BACKUP: './images.geojson.backup',
    CUSTOM_IMAGES_DOMAIN: 'img.code4history.dev'
};

class GeojsonUpdater {
    constructor() {
        this.uploadedFiles = {};
        this.updatedCount = 0;
        this.skippedCount = 0;
    }

    async loadUploadProgress() {
        try {
            if (!fsSync.existsSync(CONFIG.PROGRESS_FILE)) {
                throw new Error('Progress file not found. Please run upload script first.');
            }

            const data = await fs.readFile(CONFIG.PROGRESS_FILE, 'utf8');
            const progress = JSON.parse(data);
            
            this.uploadedFiles = progress.uploadedFiles || {};
            
            console.log(`📁 Loaded upload progress: ${Object.keys(this.uploadedFiles).length} uploaded files`);
            
            if (Object.keys(this.uploadedFiles).length === 0) {
                throw new Error('No uploaded files found in progress. Please complete uploads first.');
            }
            
        } catch (error) {
            console.error('❌ Error loading upload progress:', error.message);
            process.exit(1);
        }
    }

    async createBackup() {
        try {
            await fs.copyFile(CONFIG.IMAGES_GEOJSON, CONFIG.IMAGES_GEOJSON_BACKUP);
            console.log(`💾 Created backup: ${CONFIG.IMAGES_GEOJSON_BACKUP}`);
        } catch (error) {
            console.error('❌ Failed to create backup:', error.message);
            process.exit(1);
        }
    }

    async updateGeojson() {
        try {
            // Load images.geojson
            const geojsonData = JSON.parse(await fs.readFile(CONFIG.IMAGES_GEOJSON, 'utf8'));
            
            console.log(`🔄 Updating ${geojsonData.features.length} features in images.geojson`);
            
            // Update each feature
            for (const feature of geojsonData.features) {
                const fid = feature.properties.fid;
                
                if (this.uploadedFiles[fid]) {
                    const uploadInfo = this.uploadedFiles[fid];
                    
                    // Update the URLs to point to Cloudflare Images
                    feature.properties.path = uploadInfo.urls.public;
                    feature.properties.mid_thumbs = uploadInfo.urls.mid;
                    feature.properties.small_thumbs = uploadInfo.urls.small;
                    
                    // Add metadata about the upload
                    feature.properties.cloudflare_id = uploadInfo.cloudflareId;
                    feature.properties.upload_time = uploadInfo.uploadTime;
                    feature.properties.original_path = uploadInfo.originalPath;
                    
                    this.updatedCount++;
                    console.log(`✅ Updated feature ${fid}: ${uploadInfo.originalPath} -> ${uploadInfo.cloudflareId}`);
                } else {
                    this.skippedCount++;
                    console.log(`⏭️  Skipped feature ${fid}: not uploaded yet`);
                }
            }
            
            // Save updated geojson
            await fs.writeFile(CONFIG.IMAGES_GEOJSON, JSON.stringify(geojsonData, null, 2));
            
            console.log(`\n🎉 Updated images.geojson successfully!`);
            console.log(`✅ Updated features: ${this.updatedCount}`);
            console.log(`⏭️  Skipped features: ${this.skippedCount}`);
            console.log(`📊 Total features: ${geojsonData.features.length}`);
            
        } catch (error) {
            console.error('❌ Error updating geojson:', error.message);
            
            // Try to restore backup
            if (fsSync.existsSync(CONFIG.IMAGES_GEOJSON_BACKUP)) {
                try {
                    await fs.copyFile(CONFIG.IMAGES_GEOJSON_BACKUP, CONFIG.IMAGES_GEOJSON);
                    console.log('🔄 Restored backup due to error');
                } catch (restoreError) {
                    console.error('❌ Failed to restore backup:', restoreError.message);
                }
            }
            
            process.exit(1);
        }
    }

    async showPreview() {
        try {
            const geojsonData = JSON.parse(await fs.readFile(CONFIG.IMAGES_GEOJSON, 'utf8'));
            
            console.log('\n🔍 Preview of updates that will be made:');
            console.log('=====================================');
            
            let previewCount = 0;
            const maxPreview = 5;
            
            for (const feature of geojsonData.features) {
                const fid = feature.properties.fid;
                
                if (this.uploadedFiles[fid] && previewCount < maxPreview) {
                    const uploadInfo = this.uploadedFiles[fid];
                    
                    console.log(`\nFeature ID: ${fid}`);
                    console.log(`  Current path: ${feature.properties.path}`);
                    console.log(`  New path: ${uploadInfo.urls.public}`);
                    console.log(`  Current mid_thumbs: ${feature.properties.mid_thumbs}`);
                    console.log(`  New mid_thumbs: ${uploadInfo.urls.mid}`);
                    console.log(`  Current small_thumbs: ${feature.properties.small_thumbs}`);
                    console.log(`  New small_thumbs: ${uploadInfo.urls.small}`);
                    
                    previewCount++;
                }
            }
            
            if (previewCount === maxPreview) {
                console.log(`\n... and ${Object.keys(this.uploadedFiles).length - maxPreview} more`);
            }
            
            console.log(`\nSummary:`);
            console.log(`📤 Will update: ${Object.keys(this.uploadedFiles).length} features`);
            console.log(`⏭️  Will skip: ${geojsonData.features.length - Object.keys(this.uploadedFiles).length} features`);
            
        } catch (error) {
            console.error('❌ Error showing preview:', error.message);
        }
    }
}

// Main execution
async function main() {
    const command = process.argv[2];
    const updater = new GeojsonUpdater();
    
    await updater.loadUploadProgress();
    
    switch (command) {
        case 'preview':
            await updater.showPreview();
            break;
        case 'update':
            await updater.createBackup();
            await updater.updateGeojson();
            break;
        case 'restore':
            if (fsSync.existsSync(CONFIG.IMAGES_GEOJSON_BACKUP)) {
                await fs.copyFile(CONFIG.IMAGES_GEOJSON_BACKUP, CONFIG.IMAGES_GEOJSON);
                console.log('🔄 Restored images.geojson from backup');
            } else {
                console.log('❌ No backup file found');
            }
            break;
        default:
            console.log('Usage:');
            console.log('  node update_images_geojson.js preview  - Show what changes will be made');
            console.log('  node update_images_geojson.js update   - Update images.geojson with new URLs');
            console.log('  node update_images_geojson.js restore  - Restore from backup');
            console.log('');
            console.log('Note: Run this after completing uploads with upload_to_cloudflare.js');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}