// https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent

const createTwitterIntentUrl = (raw) => {
  const formatted = {}

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null) continue;

    switch (key) {
      case "url":
      case "related":
        formatted[key] = encodeURI(value)
        break;

      case "hashtags":
        if (!Array.isArray(value) || value.length === 0) break;
        formatted[key] = encodeURI(raw.hashtags.join(","));

      case "text":
      case "via":
      case "in_reply_to":
        formatted[key] = value;
        break;

      default:
        throw new Error(`unexpected key: ${key}, value: ${value}`)
    }
  }

  const url = new URL("https://twitter.com/intent/tweet");

  for (const [key, value] of Object.entries(formatted)) {
    url.searchParams.set(key, value);
  }

  return url.href;
}
