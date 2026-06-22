import { renderHome } from './pages/home.js';
import { renderCatalog } from './pages/catalog.js';
import { renderProduct } from './pages/product.js';
import { renderCart } from './pages/cart.js';
import { renderFavorites } from './pages/favorites.js';
import { renderCompare } from './pages/compare.js';
import { renderLogin, renderRegister } from './pages/auth.js';
import { renderProfile } from './pages/profile.js';
import { renderGame } from './pages/game.js';
let routes = {
  '/': renderHome,
  '/catalog': renderCatalog,
  '/product': renderProduct,
  '/cart': renderCart,
  '/favorites': renderFavorites,
  '/compare': renderCompare,
  '/login': renderLogin,
  '/register': renderRegister,
  '/profile': renderProfile,
  '/game': renderGame,
};
export function router() {
  let hash = location.hash.slice(1) || '/';
  let path = hash.split('?')[0];
  let handler = routes[path] || notFound;
  let app = document.getElementById('app');
  window.scrollTo({ top: 0, behavior: 'instant' });
  let html = handler();
  if (typeof html === 'string') app.innerHTML = html;
  document.querySelectorAll('[data-nav]').forEach(function(a) {
    a.classList.toggle('active', a.getAttribute('href') === '#' + path || a.getAttribute('href') === '#' + hash);
  });
}
function notFound() {
  return '<div class="container section empty-state">' +
    '<span class="emoji">🔌</span>' +
    '<h2>404 — Страница не найдена</h2>' +
    '<p>Похоже, эта страница переехала или её никогда не существовало.</p>' +
    '<p style="margin-top:20px"><a href="#/" class="btn">На главную</a></p>' +
  '</div>';
}
export function navigate(path) {
  location.hash = path;
}
