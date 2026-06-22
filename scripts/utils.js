export function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
}
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function getQueryParam(name) {
  let hash = location.hash.slice(1);
  let parts = hash.split('?');
  let params = new URLSearchParams(parts[1] || '');
  return params.get(name);
}
export function getPath() {
  let hash = location.hash.slice(1) || '/';
  return hash.split('?')[0];
}
export function stars(rating) {
  let full = Math.floor(rating);
  let half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '<span class="half-star"></span>' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
export function delay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}
export function debounce(fn, ms) {
  ms = ms || 300;
  let timer;
  return function() {
    clearTimeout(timer);
    let args = arguments;
    timer = setTimeout(function() { fn.apply(null, args); }, ms);
  };
}
