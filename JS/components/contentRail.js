import { contentCard } from './contentCard.js';

export function contentRail(title, items, { link = '#/browse', isSaved = () => false, progressFor = () => 0 } = {}) {
  return `<section class="section"><div class="section-head"><h2>${title}</h2><a class="section-link" href="${link}">View all →</a></div><div class="rail">${items.map((item) => contentCard(item, { isSaved: isSaved(item.id), progress: progressFor(item.id) })).join('')}</div></section>`;
}
