const memoryStorage = new Map();

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function read(key, fallback) {
  const storage = getStorage();
  try {
    const raw = storage ? storage.getItem(key) : memoryStorage.get(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  const storage = getStorage();
  try {
    if (storage) storage.setItem(key, JSON.stringify(value));
    else memoryStorage.set(key, JSON.stringify(value));
  } catch {
    memoryStorage.set(key, JSON.stringify(value));
  }
}

export function remove(key) {
  const storage = getStorage();
  try {
    if (storage) storage.removeItem(key);
    else memoryStorage.delete(key);
  } catch {
    memoryStorage.delete(key);
  }
}
