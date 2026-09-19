import { contentCard } from '../components/contentCard.js';
import { contentRail } from '../components/contentRail.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { safeUrl } from '../utils/safeUrl.js';

const safe = (value) => escapeHtml(value);
const saved = (state, id) => state.list.includes(id);

export function homePage(catalog, state) {
  const featured = catalog[0];
  const progressFor = (id) => { const item = state.progress.find((entry) => entry.content_id === id); return item?.duration_seconds ? Math.round((item.position_seconds / item.duration_seconds) * 100) : 0; };
  const continueItems = state.progress.map((entry) => catalog.find((item) => item.id === entry.content_id)).filter(Boolean).slice(0, 6);
  return `<section class="hero"><div class="hero-content"><div class="eyebrow">Maliki Original · New this week</div><h1>${safe(featured.title)}</h1><div class="meta"><span>${featured.year}</span><span class="dot"></span><span>${safe(featured.runtime)}</span><span class="dot"></span><span class="rating">★ ${featured.rating}</span></div><p class="hero-copy">${safe(featured.description)}</p><div class="actions"><button class="btn" data-action="play" data-id="${safe(featured.id)}">▶ Play now</button><button class="btn btn-secondary" data-action="details" data-id="${safe(featured.id)}">More info</button></div></div></section><div class="page home-page">${contentRail('Continue watching', continueItems.length ? continueItems : catalog.slice(1, 4), { link: '#/history', isSaved: (id) => saved(state, id), progressFor })}${contentRail('Trending now', catalog.slice(0, 6), { isSaved: (id) => saved(state, id) })}${contentRail('Made for your night', catalog.slice(2, 8), { isSaved: (id) => saved(state, id) })}</div>`;
}

export function browsePage(catalog, state) {
  return `<div class="page"><div class="page-heading"><div><div class="kicker">Explore the collection</div><h1 class="page-title">Find your next favorite.</h1><p>From slow-burn dramas to ideas from the edge of the map.</p></div><div class="filters">${['All', 'Drama', 'Sci-Fi', 'Comedy', 'Adventure'].map((genre, index) => `<button class="filter ${index === 0 ? 'active' : ''}" data-filter="${genre}">${genre}</button>`).join('')}</div></div><div class="grid">${catalog.map((item) => contentCard(item, { isSaved: saved(state, item.id) })).join('')}</div></div>`;
}

export function searchPage(query, results, state) {
  const escapedQuery = safe(query).replaceAll('&quot;', '&quot;');
  return `<div class="page"><div class="page-heading"><div><div class="kicker">Search Maliki</div><h1 class="page-title">What are you in the mood for?</h1></div></div><form class="search-box" id="search-form"><span>⌕</span><input id="search-input" value="${escapedQuery}" placeholder="Search titles, genres, moods..." autocomplete="off"><button type="button" class="icon-btn" data-action="clear-search" aria-label="Clear search">×</button></form>${query ? `<p class="count">${results.length} result${results.length === 1 ? '' : 's'} for “${safe(query)}”</p>${results.length ? `<div class="grid">${results.map((item) => contentCard(item, { isSaved: saved(state, item.id) })).join('')}</div>` : `<div class="empty"><div class="kicker">No matches yet</div><h2>Try a different feeling.</h2><p>Search by title, genre, or the kind of night you want to have.</p><a class="btn" href="#/browse">Browse everything</a></div>`}` : `<div class="empty" style="margin-top:30px"><div class="kicker">Start exploring</div><h2>Stories are waiting.</h2><p>Try “drama”, “sci-fi”, or search a title.</p></div>`}</div>`;
}

export function listPage(catalog, state) {
  const items = catalog.filter((item) => state.list.includes(item.id));
  return `<div class="page"><div class="page-heading"><div><div class="kicker">Your collection</div><h1 class="page-title">My List</h1><p>Keep the stories you want close.</p></div></div>${items.length ? `<div class="grid">${items.map((item) => contentCard(item, { isSaved: true })).join('')}</div>` : `<div class="empty"><div class="kicker">Nothing saved yet</div><h2>Make room for a good story.</h2><p>Save something from Browse and it will live here for your next watch.</p><a class="btn" href="#/browse">Browse titles</a></div>`}</div>`;
}

export function historyPage(catalog, state) {
  const items = catalog.filter((item) => state.history.includes(item.id));
  const progressFor = (id) => { const entry = state.progress.find((item) => item.content_id === id); return entry?.duration_seconds ? Math.round((entry.position_seconds / entry.duration_seconds) * 100) : 0; };
  return `<div class="page"><div class="page-heading"><div><div class="kicker">Your viewing trail</div><h1 class="page-title">Watch history</h1><p>Pick up where your last story left off.</p></div><button class="btn btn-secondary" data-action="clear-history">Clear history</button></div>${items.length ? `<div class="grid">${items.map((item) => contentCard(item, { isSaved: saved(state, item.id), progress: progressFor(item.id) })).join('')}</div>` : `<div class="empty"><div class="kicker">A clean slate</div><h2>Your history is empty.</h2><p>Stories you play will show up here so returning is easy.</p><a class="btn" href="#/browse">Find something to watch</a></div>`}</div>`;
}

export function detailPage(item, state, relatedItems) {
  const playAction = item.playable === false ? '<span class="tag">Metadata only · not available to play</span>' : `<button class="btn" data-action="play" data-id="${safe(item.id)}">▶ Play</button>`;
  const poster = safeUrl(item.image);
  return `<section class="detail" style="--detail-image:url('${poster}')"><div class="detail-inner"><img class="detail-poster" src="${poster}" alt="${safe(item.title)} poster"><div><div class="kicker">${safe(item.type)} · Maliki collection</div><h1>${safe(item.title)}</h1><div class="meta"><span>${item.year}</span><span class="dot"></span><span>${safe(item.runtime)}</span><span class="dot"></span><span class="rating">★ ${safe(item.rating)}</span></div><p class="detail-copy">${safe(item.description)}</p><div class="tags"><span class="tag">${safe(item.genre)}</span><span class="tag">${safe(item.genre2 || 'Featured')}</span><span class="tag">English audio</span></div><div class="actions">${playAction}<button class="btn btn-secondary" data-action="toggle-list" data-id="${safe(item.id)}">${saved(state, item.id) ? '✓ In My List' : '+ My List'}</button></div></div></div></section><div class="page">${contentRail('You might also like', relatedItems, { isSaved: (id) => saved(state, id) })}</div>`;
}

export function playerPage(item, progress = 0) {
  return `<div class="player"><div class="player-box"><button class="btn btn-secondary" data-action="back-to-details" data-id="${safe(item.id)}">← Back to details</button><div class="video-screen" style="margin-top:18px"><video id="maliki-video" data-content-id="${safe(item.id)}" data-resume="${progress}" playsinline controls preload="metadata" poster="${safeUrl(item.image)}" aria-label="${safe(item.title)}"></video><div class="player-status" id="player-status" role="status">Authorizing playback...</div></div><div class="player-bar"><span data-player-time>00:00</span><div class="timeline"><span style="width:0" data-player-progress></span></div><span>${safe(item.runtime)}</span><button class="icon-btn" data-action="player-volume" aria-label="Volume">⌁</button><button class="icon-btn" data-action="player-fullscreen" aria-label="Fullscreen">⛶</button></div><h2>${safe(item.title)}</h2><p class="card-meta" data-player-message>Protected Maliki playback · Authorization is required for this title.</p></div></div>`;
}

export function profilePage(state) {
  const profile = state.profile || {};
  return `<div class="page"><div class="page-heading"><div><div class="kicker">Your space</div><h1 class="page-title">Good evening, ${safe(profile.display_name || state.user?.user_metadata?.display_name || 'Amina')}.</h1><p>Shape your Maliki experience around the way you watch.</p></div><span class="avatar" style="width:64px;height:64px;font-size:25px">${safe((profile.display_name || state.user?.email || 'A').slice(0, 1).toUpperCase())}</span></div><form class="settings-list profile-form" id="profile-form"><label>Display name<input name="displayName" required minlength="2" value="${safe(profile.display_name || '')}" placeholder="Your name"></label><label>Avatar URL<input name="avatarUrl" type="url" value="${safe(profile.avatar_url || '')}" placeholder="https://..."></label><button class="btn" type="submit" data-submit>Save profile</button></form><div class="settings-list"><a class="setting" href="#/my-list"><span><strong>My List</strong><small>${state.list.length} saved title${state.list.length === 1 ? '' : 's'}</small></span><span>→</span></a><a class="setting" href="#/history"><span><strong>Watch history</strong><small>${state.history.length} recently watched</small></span><span>→</span></a><a class="setting" href="#/settings"><span><strong>Playback & settings</strong><small>Personalize your experience</small></span><span>→</span></a></div></div>`;
}

export function settingsPage(state) {
  return `<div class="page"><div class="page-heading"><div><div class="kicker">Make it yours</div><h1 class="page-title">Settings</h1><p>Small choices for better viewing.</p></div></div><div class="settings-list">${[['autoplay', 'Autoplay', 'Start the next story automatically'], ['notifications', 'Notifications', 'Get updates about new releases'], ['captions', 'Captions', 'Show captions when available']].map(([key, title, description]) => `<div class="setting"><span><strong>${title}</strong><small>${description}</small></span><button class="toggle ${state.settings[key] ? 'on' : ''}" data-setting="${key}" aria-label="Toggle ${title}"><span></span></button></div>`).join('')}<div class="setting"><span><strong>Clear watch history</strong><small>Remove all recently watched titles</small></span><button class="btn btn-secondary" data-action="clear-history">Clear</button></div></div></div>`;
}

export function authPage(mode, message = '') {
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot-password';
  const copy = isSignup ? ['Create your Maliki account', 'Join a better kind of watchlist.', 'Sign up'] : isForgot ? ['Reset your password', 'Enter your email and we will send a secure reset link.', 'Send reset link'] : ['Welcome back', 'Your next good story is closer than you think.', 'Sign in'];
  return `<div class="page"><div class="empty auth-panel" style="max-width:520px;margin:45px auto;text-align:left"><div class="kicker">Maliki account</div><h1 class="page-title">${copy[0]}</h1><p>${copy[1]}</p>${message ? `<p class="form-message" role="alert">${message}</p>` : ''}<form id="auth-form" data-mode="${mode}">${isSignup ? '<label>Display name<input name="displayName" required minlength="2" autocomplete="name" placeholder="Your name"></label>' : ''}<label>Email address<input name="email" required type="email" autocomplete="email" placeholder="you@example.com"></label>${!isForgot ? `<label>Password<input name="password" required type="password" minlength="8" autocomplete="${isSignup ? 'new-password' : 'current-password'}" placeholder="At least 8 characters"></label>${isSignup ? '<label>Confirm password<input name="passwordConfirmation" required type="password" minlength="8" autocomplete="new-password" placeholder="Repeat your password"></label>' : ''}` : ''}<button class="btn" type="submit" data-submit>${copy[2]}</button></form><p class="card-meta">${isForgot ? '<a href="#/login">Back to sign in</a>' : isSignup ? '<a href="#/login">Already have an account? Sign in</a>' : '<a href="#/signup">Create an account</a> · <a href="#/forgot-password">Forgot password?</a>'}</p></div></div>`;
}

export function resetPasswordPage(message = '') {
  return `<div class="page"><div class="empty auth-panel" style="max-width:520px;margin:45px auto;text-align:left"><div class="kicker">Maliki account</div><h1 class="page-title">Choose a new password</h1><p>Set a new password for your Maliki account.</p>${message ? `<p class="form-message" role="alert">${message}</p>` : ''}<form id="reset-form"><label>New password<input name="password" required type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></label><label>Confirm password<input name="passwordConfirmation" required type="password" minlength="8" autocomplete="new-password" placeholder="Repeat your password"></label><button class="btn" type="submit" data-submit>Update password</button></form></div></div>`;
}
