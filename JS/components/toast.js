export function showToast(message) {
  const root = document.querySelector('#toast-root');
  root.replaceChildren();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  root.append(toast);
  window.setTimeout(() => root.replaceChildren(), 2600);
}
