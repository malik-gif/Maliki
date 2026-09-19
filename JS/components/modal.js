import { escapeHtml } from '../utils/escapeHtml.js';
import { safeUrl } from '../utils/safeUrl.js';

export function detailsModal(item, isSaved) {
  const title = escapeHtml(item.title);
  const id = escapeHtml(item.id);
  const playAction = item.playable === false ? '<span class="tag">Metadata only · not available to play</span>' : `<button class="btn" data-action="play" data-id="${id}">▶ Play</button>`;
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${title} details"><button class="modal-close" data-action="close" aria-label="Close">×</button><div class="modal-visual" style="--modal-image:url('${safeUrl(item.image)}')"></div><div class="modal-body"><div class="kicker">${escapeHtml(item.type)} · ${item.year}</div><h2>${title}</h2><div class="meta"><span>${escapeHtml(item.runtime)}</span><span class="dot"></span><span class="rating">★ ${escapeHtml(item.rating)}</span></div><p class="detail-copy">${escapeHtml(item.description)}</p><div class="actions">${playAction}<button class="btn btn-secondary" data-action="toggle-list" data-id="${id}">${isSaved ? '✓ In My List' : '+ My List'}</button></div></div></section></div>`;
}
