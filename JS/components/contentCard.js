import { escapeHtml } from '../utils/escapeHtml.js';
import { safeUrl } from '../utils/safeUrl.js';

export function contentCard(item, { isSaved = false, progress = 0 } = {}) {
  const title = escapeHtml(item.title);
  const id = escapeHtml(item.id);
  const poster = safeUrl(item.image);
  const canPlay = item.playable !== false;
  return `<article class="card"><div class="card-art"><img src="${poster}" alt="${title} poster" loading="lazy"><div class="card-overlay"><button class="round-btn" data-action="${canPlay ? 'play' : 'details'}" data-id="${id}" aria-label="${canPlay ? 'Play' : 'View details for'} ${title}">${canPlay ? '▶' : 'i'}</button><button class="round-btn ghost" data-action="toggle-list" data-id="${id}" aria-label="${isSaved ? 'Remove from' : 'Add to'} My List">${isSaved ? '✓' : '+'}</button></div>${progress ? `<div class="progress"><span style="width:${progress}%"></span></div>` : ''}</div><button class="card-title" data-action="details" data-id="${id}">${title}</button><div class="card-meta"><span>${item.year}</span><span>•</span><span class="rating">★ ${item.rating}</span></div></article>`;
}
