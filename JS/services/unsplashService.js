const viteEnv = import.meta.env || {};
const runtimeConfig = globalThis.MALIKI_CONFIG || {};
const config = { accessKey: runtimeConfig.unsplashAccessKey || viteEnv.VITE_UNSPLASH_ACCESS_KEY || '' };
const cache = new Map();

export function isConfigured() { return Boolean(config.accessKey); }

export async function searchImages(query, { perPage = 8 } = {}) {
  const key = `${query}:${perPage}`;
  if (cache.has(key)) return cache.get(key);
  if (!isConfigured()) return [];
  const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`, { headers: { Authorization: `Client-ID ${config.accessKey}` } });
  if (!response.ok) throw new Error(`Image service request failed (${response.status}).`);
  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  cache.set(key, results);
  return results;
}

export async function getEditorialImage(query, fallback) {
  try {
    const [image] = await searchImages(query, { perPage: 1 });
    return image?.urls?.regular || fallback;
  } catch {
    return fallback;
  }
}
