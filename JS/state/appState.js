import { read, write } from '../services/storageService.js';

export const STORAGE_KEYS = {
  list: 'maliki-list',
  history: 'maliki-history',
  settings: 'maliki-settings'
};

export const state = {
  user: null,
  session: null,
  profile: null,
  list: [],
  progress: [],
  history: [],
  userDataLoading: false,
  userDataError: null,
  settings: read(STORAGE_KEYS.settings, { autoplay: true, notifications: true, captions: false })
};

export function setAuth({ user, session }) {
  state.user = user;
  state.session = session;
  if (!user) { state.profile = null; state.list = []; state.progress = []; state.history = []; }
}

export function setList(list) {
  state.list = list;
}

export function setHistory(history) {
  state.history = history;
}

export function setProgress(progress) { state.progress = progress; }
export function setProfile(profile) { state.profile = profile; }
export function setUserDataStatus({ loading, error = null }) { state.userDataLoading = loading; state.userDataError = error; }

export function setSettings(settings) {
  state.settings = settings;
  write(STORAGE_KEYS.settings, settings);
}
