import { escapeHtml } from './escapeHtml.js';

export function safeUrl(value, fallback = '') {
  try {
    const url = new URL(value, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    return escapeHtml(url.href).replace(/[()]/g, (character) => character === '(' ? '%28' : '%29');
  } catch {
    return fallback;
  }
}
