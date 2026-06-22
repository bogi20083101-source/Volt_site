import { subscribe, get, cart, favorites, compare, theme } from './store.js';
import { initAuth } from './auth.js';
import { renderHeader, renderFooter } from './components.js';
import { router } from './router.js';
import { toast } from './ui.js';
async function init() {
  theme.apply();
  initAuth();
  await renderHeader();
  renderFooter();
  router();
  subscribe(async function() {
    theme.apply();
    await renderHeader();
  });
  window.addEventListener('hashchange', router);
  document.addEventListener('click', async function(e) {
    let cartBtn = e.target.closest('[data-cart]');
    if (cartBtn) {
      let id = Number(cartBtn.dataset.cart);
      cart.add(id, 1);
      toast('Товар добавлен в корзину', 'success');
      return;
    }
    let favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      let id = Number(favBtn.dataset.fav);
      let active = favorites.toggle(id);
      favBtn.classList.toggle('is-active', active);
      favBtn.textContent = active ? '❤️' : '🤍';
      toast(active ? 'Добавлено в избранное' : 'Убрано из избранного', active ? 'success' : 'info');
      return;
    }
    let cmpBtn = e.target.closest('[data-compare]');
    if (cmpBtn) {
      let id = Number(cmpBtn.dataset.compare);
      let active = compare.toggle(id);
      toast(active ? 'Добавлено к сравнению' : 'Убрано из сравнения', active ? 'success' : 'info');
      return;
    }
  });
}
init().catch(function(err) {
  console.error('Ошибка инициализации приложения:', err);
  document.getElementById('app').innerHTML = '<div class="container section empty-state">' +
    '<span class="emoji">⚠️</span>' +
    '<h2>Не удалось запустить приложение</h2>' +
    '<p>Проверьте, что файл данных доступен. Запускайте через локальный сервер.</p>' +
  '</div>';
});
