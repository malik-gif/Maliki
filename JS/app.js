import { catalog } from './data/catalog.js';
import { filterContent, getCatalog, getContentById, normalizeContent, searchContent } from './services/contentService.js';
import { getCurrentSession, listenForAuthChanges, requestPasswordReset, signIn, signOut, signUp, updatePassword } from './services/authService.js';
import { attachHls, authorizePlayback } from './services/playbackService.js';
import { addToList, clearHistory, getUserData, recordHistory, removeFromList, removeProgress, saveProgress, updateProfile } from './services/userDataService.js';
import { state, setAuth, setHistory, setList, setProfile, setProgress, setSettings, setUserDataStatus } from './state/appState.js';
import { detailsModal } from './components/modal.js';
import { contentCard } from './components/contentCard.js';
import { showToast } from './components/toast.js';
import { getEditorialImage } from './services/unsplashService.js';
import { escapeHtml } from './utils/escapeHtml.js';
import { safeUrl } from './utils/safeUrl.js';
import { authPage, browsePage, detailPage, historyPage, homePage, listPage, playerPage, profilePage, resetPasswordPage, searchPage, settingsPage } from './pages/pages.js';
import { adminContentFormPage, adminContentPage, adminDashboardPage, adminForbiddenPage } from './pages/adminPages.js';
import { createAdminContent, deleteAdminContent, deleteVideoAsset, getAdminContent, getAdminContentById, getAdminGenres, isAdmin, replaceContentGenres, updateAdminContent, upsertVideoAsset } from './services/adminService.js';

const app = document.querySelector('#app');
let catalogItems = catalog;
let activeHls;

function loadingPage() {
  return '<div class="page"><div class="skeleton-hero"></div><div class="skeleton-grid">'.concat(Array.from({ length: 5 }, () => '<div class="skeleton-card"></div>').join(''), '</div></div>');
}

function errorPage(message) {
  return `<div class="page"><div class="empty"><div class="kicker">Content unavailable</div><h2>We could not load the collection.</h2><p>${escapeHtml(message)}</p><button class="btn" data-action="retry">Try again</button></div></div>`;
}

function isSaved(id) {
  return state.list.includes(id);
}

function closeModal() {
  document.querySelector('#modal-root').innerHTML = '';
}

function setActiveRoute(route) {
  document.querySelectorAll('[data-route]').forEach((link) => link.classList.toggle('active', link.dataset.route === route));
  window.scrollTo(0, 0);
}

function getRoute() {
  const hash = location.hash || '#/';
  if (new URLSearchParams(location.search).get('auth') === 'reset' || hash.includes('access_token=')) return { path: '/reset-password', params: new URLSearchParams(location.search) };
  const [path, queryString = ''] = hash.slice(1).split('?');
  return { path, params: new URLSearchParams(queryString) };
}

function getItem(id) {
  return catalogItems.find((item) => item.id === id) || null;
}

function stopPlayer() {
  if (activeHls) activeHls.destroy();
  activeHls = null;
}

async function initializePlayer(item) {
  const video = document.querySelector('#maliki-video');
  const status = document.querySelector('#player-status');
  const message = document.querySelector('[data-player-message]');
  if (!video || !state.user) return;
  const saved = state.progress.find((entry) => entry.content_id === item.id);
  let lastReported = 0;
  const reportProgress = async (force = false) => {
    if (!video.duration || !Number.isFinite(video.currentTime) || (!force && video.currentTime - lastReported < 10)) return;
    const duration = item.durationSeconds || video.duration;
    if (video.currentTime >= duration - 3) {
      await removeProgress(state.user.id, item.id);
      setProgress(state.progress.filter((entry) => entry.content_id !== item.id));
      return;
    }
    await saveProgress(state.user.id, item.id, video.currentTime, duration);
    lastReported = video.currentTime;
    setProgress([{ content_id: item.id, position_seconds: video.currentTime, duration_seconds: duration }, ...state.progress.filter((entry) => entry.content_id !== item.id)]);
  };
  try {
    const authorization = await authorizePlayback(item.id);
    activeHls = await attachHls(video, authorization.playbackUrl);
    video.play().catch(() => {});
    video.addEventListener('loadedmetadata', () => {
      const resume = Number(saved?.position_seconds || 0);
      if (resume > 0 && resume < video.duration - 3) video.currentTime = resume;
      status.hidden = true;
    }, { once: true });
    video.addEventListener('timeupdate', () => {
      const percent = video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0;
      document.querySelector('[data-player-progress]')?.style.setProperty('width', `${percent}%`);
      document.querySelector('[data-player-time]').textContent = `${Math.floor(video.currentTime / 60)}:${String(Math.floor(video.currentTime % 60)).padStart(2, '0')}`;
      reportProgress().catch(() => {});
    });
    video.addEventListener('pause', () => reportProgress(true).catch(() => {}));
    video.addEventListener('error', () => { status.hidden = false; status.textContent = 'Playback failed. Check your connection and try again.'; message.textContent = 'The video could not be loaded. Your progress is safe.'; });
    await recordHistory(state.user.id, item.id);
    setHistory([item.id, ...state.history.filter((contentId) => contentId !== item.id)]);
  } catch (error) {
    status.hidden = false;
    status.textContent = error.message || 'Playback authorization failed.';
    message.textContent = 'This title is unavailable for playback right now.';
  }
}

async function hydrateUserData() {
  if (!state.user) return;
  setUserDataStatus({ loading: true });
  try {
    const data = await getUserData(state.user.id);
    setList((data.list || []).map((item) => item.content_id));
    setProgress(data.progress || []);
    setHistory((data.history || []).map((item) => item.content_id));
    setProfile(data.profile);
    setUserDataStatus({ loading: false });
  } catch (error) {
    setUserDataStatus({ loading: false, error: error.message });
    showToast('Could not load your account data.');
  }
}

function renderAuthNav() {
  const root = document.querySelector('#auth-nav');
  if (!root) return;
  const displayName = state.profile?.display_name || state.user?.user_metadata?.display_name || state.user?.email || 'Account';
  const safeDisplayName = escapeHtml(displayName);
  root.innerHTML = state.user
    ? `<button class="icon-btn" data-action="search" aria-label="Search">⌕</button>${isAdmin(state.user) ? '<a class="btn btn-secondary nav-auth-link" href="#/admin">Admin</a>' : ''}<button class="profile-chip" data-action="profile" aria-label="Open profile"><span class="avatar">${safeDisplayName.slice(0, 1).toUpperCase()}</span><span class="profile-name">${safeDisplayName}</span><span class="chevron">⌄</span></button><button class="btn btn-secondary nav-auth-link" data-action="sign-out">Sign out</button>`
    : `<button class="icon-btn" data-action="search" aria-label="Search">⌕</button><a class="btn btn-secondary nav-auth-link" href="#/login">Sign in</a>`;
}

function requiresAuth(path) {
  return ['/my-list', '/history', '/profile', '/settings'].includes(path) || path.startsWith('/watch/') || path.startsWith('/admin');
}

async function render() {
  closeModal();
  const { path, params } = getRoute();
  stopPlayer();
  if (requiresAuth(path) && !state.user) {
    location.hash = `#/login?next=${encodeURIComponent(path)}`;
    return;
  }
  if (path.startsWith('/admin') && !isAdmin(state.user)) { app.innerHTML = adminForbiddenPage(); renderAuthNav(); return; }
  if (state.userDataLoading && requiresAuth(path)) { app.innerHTML = loadingPage(); return; }
  if (!catalogItems.length && ['/', '/browse', '/search'].includes(path)) { app.innerHTML = errorPage('Production content is not configured yet.'); renderAuthNav(); return; }
  if (path.startsWith('/admin')) app.innerHTML = loadingPage();
  let html;
  let activeRoute = 'home';

  if (path === '/') html = homePage(catalogItems, state);
  else if (path === '/browse') { html = browsePage(catalogItems, state); activeRoute = 'browse'; }
  else if (path === '/search') { html = searchPage(params.get('q') || '', await searchContent(params.get('q') || ''), state); activeRoute = 'search'; }
  else if (path === '/my-list') { html = listPage(catalogItems, state); activeRoute = 'my-list'; }
  else if (path === '/history') html = historyPage(catalogItems, state);
  else if (path === '/profile' || path === '/settings') { html = path === '/profile' ? profilePage(state) : settingsPage(state); activeRoute = path.slice(1); }
  else if (path === '/admin') { try { html = adminDashboardPage(await getAdminContent()); } catch (error) { html = errorPage(error.message); } activeRoute = 'admin'; }
  else if (path === '/admin/content') { try { html = adminContentPage(await getAdminContent({ search: params.get('q') || '', status: params.get('status') || 'all' }), params.get('q') || '', params.get('status') || 'all'); } catch (error) { html = errorPage(error.message); } activeRoute = 'admin'; }
  else if (path === '/admin/content/new') { try { html = adminContentFormPage({ genres: await getAdminGenres() }); } catch (error) { html = errorPage(error.message); } activeRoute = 'admin'; }
  else if (path.startsWith('/admin/content/')) { try { html = adminContentFormPage({ item: await getAdminContentById(path.split('/')[3]), genres: await getAdminGenres() }); } catch (error) { html = errorPage(error.message); } activeRoute = 'admin'; }
  else if (path === '/login' || path === '/signup' || path === '/forgot-password') html = authPage(path.slice(1));
  else if (path === '/reset-password') html = resetPasswordPage();
  else if (path.startsWith('/movie/') || path.startsWith('/series/')) {
    const item = await getContentById(path.split('/')[2]);
    html = item ? detailPage(item, state, catalogItems.filter((candidate) => candidate.id !== item.id).slice(0, 5)) : errorPage('This title is no longer available.');
  } else if (path.startsWith('/watch/')) {
    const playerItem = getItem(path.split('/')[2]);
    if (!playerItem) html = errorPage('This title is no longer available.');
    else {
      const savedProgress = state.progress.find((entry) => entry.content_id === playerItem.id)?.position_seconds || 0;
      html = playerPage(playerItem, savedProgress);
    }
  } else {
    html = '<div class="page"><div class="empty"><div class="kicker">404</div><h2>This story went off-script.</h2><p>The page you requested does not exist.</p><a class="btn" href="#/">Return home</a></div></div>';
  }

  app.innerHTML = html;
  setActiveRoute(activeRoute);
  renderAuthNav();
  if (path.startsWith('/watch/') && getItem(path.split('/')[2])) initializePlayer(getItem(path.split('/')[2]));
  if (path === '/' && document.querySelector('.hero')) {
    getEditorialImage('cinematic night film', catalogItems[0]?.backdrop || catalogItems[0]?.image).then((url) => {
      const safeImage = safeUrl(url);
      if (safeImage) document.querySelector('.hero').style.backgroundImage = `linear-gradient(90deg,rgba(8,17,15,.98) 0%,rgba(8,17,15,.7) 37%,rgba(8,17,15,.06) 78%),linear-gradient(0deg,var(--ink) 0%,transparent 28%),url("${safeImage}")`;
    });
  }
}

function openDetails(item) {
  document.querySelector('#modal-root').innerHTML = detailsModal(item, isSaved(item.id));
  document.querySelector('.modal-close')?.focus();
}

function toggleList(id) {
  if (!state.user) { location.hash = `#/login?next=${encodeURIComponent(location.hash.slice(1))}`; return; }
  return (isSaved(id) ? removeFromList(state.user.id, id) : addToList(state.user.id, id)).then(() => {
    setList(isSaved(id) ? state.list.filter((itemId) => itemId !== id) : [...state.list, id]);
    closeModal();
    showToast(isSaved(id) ? 'Removed from My List' : 'Added to My List');
    render();
  }).catch(() => showToast('Could not update My List.'));
}

async function startPlayback(id) {
  const item = getItem(id);
  if (!item) { showToast('This title could not be found.'); return; }
  if (item.playable === false) { showToast('This title is not available to play yet.'); return; }
  if (!state.user) { location.hash = `#/login?next=${encodeURIComponent(`/watch/${id}`)}`; return; }
  closeModal();
  location.hash = `#/watch/${id}`;
}

async function handleAction(event) {
  const actionElement = event.target.closest?.('[data-action]');
  const action = actionElement?.dataset.action;
  const id = actionElement?.dataset.id;

  if (action === 'toggle-list') await toggleList(id);
  if (action === 'details') openDetails(getItem(id));
  if (action === 'play') await startPlayback(id);
  if (action === 'search') location.hash = '#/search';
  if (action === 'profile') location.hash = '#/profile';
  if (action === 'sign-out') {
    try { await signOut(); showToast('Signed out'); } catch (error) { showToast(error.message); }
  }
  if (action === 'clear-search') location.hash = '#/search';
  if (action === 'back-to-details') location.hash = `#/movie/${id}`;
  if (action === 'clear-history') {
    if (!state.user || !window.confirm('Clear your watch history? This cannot be undone.')) return;
    try { await clearHistory(state.user.id); setHistory([]); showToast('Watch history cleared'); render(); } catch { showToast('Could not clear watch history.'); }
  }
  if (action === 'player-toggle') showToast('Demo playback started');
  if (action === 'player-volume') showToast('Demo volume control');
  if (action === 'player-fullscreen') document.querySelector('.video-screen')?.requestFullscreen?.();
  if (action === 'retry') render();
  if (action === 'admin-unpublish') {
    if (!window.confirm('Unpublish this title? It will disappear from the public catalog.')) return;
    try { await updateAdminContent(id, { status: 'draft' }); showToast('Content unpublished'); location.hash = '#/admin/content'; } catch { showToast('Could not unpublish content.'); }
  }
  if (action === 'admin-delete') {
    if (!window.confirm('Delete this content and its linked assets? This cannot be undone.')) return;
    try { await deleteAdminContent(id); showToast('Content deleted'); location.hash = '#/admin/content'; } catch { showToast('Could not delete content.'); }
  }
  if (event.target.matches('.modal-backdrop') || event.target.closest?.('.modal-close')) closeModal();
}

document.addEventListener('click', async (event) => {
  await handleAction(event);
  const filter = event.target.closest?.('[data-filter]');
  if (filter) {
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.remove('active'));
    filter.classList.add('active');
    const items = await filterContent(filter.dataset.filter);
    document.querySelector('.grid').innerHTML = items.map((item) => contentCard(item, { isSaved: isSaved(item.id) })).join('');
  }

  const setting = event.target.closest?.('[data-setting]')?.dataset.setting;
  if (setting) {
    setSettings({ ...state.settings, [setting]: !state.settings[setting] });
    render();
    showToast('Setting saved');
  }
});

document.addEventListener('submit', async (event) => {
  if (event.target.id === 'search-form') {
    event.preventDefault();
    const query = document.querySelector('#search-input').value.trim();
    location.hash = `#/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  }

  if (event.target.id === 'auth-form') {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('[data-submit]');
    const mode = form.dataset.mode;
    const formData = new FormData(event.target);
    submit.disabled = true;
    submit.textContent = 'Working...';
    try {
      const payload = Object.fromEntries(formData.entries());
      if (mode === 'signup') await signUp(payload);
      else if (mode === 'forgot-password') {
        await requestPasswordReset(payload.email);
        showToast('Reset link sent. Check your email.');
        return;
      } else await signIn(payload);
      showToast(mode === 'signup' ? 'Account created' : 'Welcome back');
      const next = new URLSearchParams(location.hash.split('?')[1] || '').get('next');
      location.hash = next ? `#${next}` : '#/';
    } catch (error) {
      const message = document.createElement('p');
      message.className = 'form-message';
      message.setAttribute('role', 'alert');
      message.textContent = error.message;
      form.before(message);
    } finally {
      submit.disabled = false;
      submit.textContent = mode === 'signup' ? 'Sign up' : mode === 'forgot-password' ? 'Send reset link' : 'Sign in';
    }
  }

  if (event.target.id === 'reset-form') {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('[data-submit]');
    const payload = Object.fromEntries(new FormData(form).entries());
    submit.disabled = true;
    submit.textContent = 'Working...';
    try {
      await updatePassword(payload.password, payload.passwordConfirmation);
      showToast('Password updated');
      location.hash = '#/';
    } catch (error) {
      const message = document.createElement('p');
      message.className = 'form-message';
      message.setAttribute('role', 'alert');
      message.textContent = error.message;
      form.before(message);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Update password';
    }
  }

  if (event.target.id === 'profile-form') {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('[data-submit]');
    const payload = Object.fromEntries(new FormData(form).entries());
    if (!payload.displayName.trim()) return;
    submit.disabled = true;
    submit.textContent = 'Saving...';
    try { setProfile(await updateProfile(state.user.id, payload)); showToast('Profile updated'); render(); } catch { showToast('Could not update your profile.'); } finally { submit.disabled = false; submit.textContent = 'Save profile'; }
  }

  if (event.target.id === 'admin-content-filter') {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target).entries());
    location.hash = `#/admin/content?q=${encodeURIComponent(values.search || '')}&status=${encodeURIComponent(values.status || 'all')}`;
  }

  if (event.target.id === 'admin-content-form') {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('[data-submit]');
    const values = Object.fromEntries(new FormData(form).entries());
    const genreIds = [...form.querySelectorAll('[name="genre_ids"]:checked')].map((input) => input.value);
    submit.disabled = true;
    submit.textContent = 'Saving...';
    const content = { title: values.title.trim(), slug: values.slug.trim(), content_type: values.content_type, tmdb_id: values.tmdb_id ? Number(values.tmdb_id) : null, description: values.description || null, release_date: values.release_date || null, runtime: values.runtime ? Number(values.runtime) : null, rating: values.rating ? Number(values.rating) : null, poster_url: values.poster_url || null, backdrop_url: values.backdrop_url || null, trailer_url: values.trailer_url || null, language: values.language || 'en', status: values.status, featured: form.querySelector('[name="featured"]').checked };
    try {
      const saved = form.dataset.contentId ? await updateAdminContent(form.dataset.contentId, content) : await createAdminContent(content);
      await replaceContentGenres(saved.id, genreIds);
      if (values.playbackId) await upsertVideoAsset(saved.id, { id: values.video_id, provider: values.provider || 'mux', playbackId: values.playbackId, playbackPolicy: values.playbackPolicy, duration: values.videoDuration, status: values.videoStatus });
      else if (values.video_id) await deleteVideoAsset(values.video_id);
      showToast('Content saved');
      location.hash = `#/admin/content/${saved.id}`;
    } catch (error) { showToast(error.message || 'Could not save content.'); } finally { submit.disabled = false; submit.textContent = 'Save content'; }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    const searchInput = document.querySelector('#search-input');
    if (searchInput) searchInput.focus();
    else location.hash = '#/search';
  }
});

window.addEventListener('hashchange', render);
window.addEventListener('scroll', () => document.querySelector('#topbar')?.classList.toggle('scrolled', scrollY > 25));

app.innerHTML = loadingPage();
Promise.all([getCurrentSession(), getCatalog()]).then(([auth, items]) => {
  setAuth(auth);
  catalogItems = items;
  return hydrateUserData().then(() => { renderAuthNav(); render(); });
}).catch((error) => {
  app.innerHTML = errorPage(error.message);
  renderAuthNav();
});

listenForAuthChanges((auth) => {
  setAuth(auth);
  hydrateUserData().then(() => { renderAuthNav(); render(); });
}).catch(() => {});
