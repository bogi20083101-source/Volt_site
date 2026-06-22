
import { get, favorites as favStore, cart as cartStore } from '../store.js';
import { loadCatalog } from '../api.js';
import { productCard } from '../components.js';
import { toast } from '../ui.js';
export async function renderFavorites() {
  let app = document.getElementById('app');
  let ids = get('favorites');
  if (ids.length === 0) {
    app.innerHTML = `
      <div class="container section empty-state">
        <span class="emoji">❤️</span>
        <h2>В избранном пусто</h2>
        <p>Добавляйте сюда товары, которые понравились — вернуться к ним позже.</p>
        <a href="#/catalog" class="btn" style="margin-top:20px">В каталог</a>
      </div>`;
    return;
  }
  let { products } = await loadCatalog();
  let favProducts = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs"><a href="#/">Главная</a><span class="sep">/</span><span>Избранное</span></nav>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
        <h1 class="section-title" style="margin:0">Избранное (${favProducts.length})</h1>
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline" id="add-all-to-cart">🛒 Перенести всё в корзину</button>
          <button class="btn btn-ghost" id="clear-fav">Очистить</button>
        </div>
      </div>
      <div class="products-grid" data-view="grid" id="fav-grid">
        ${favProducts.map(productCard).join('')}
      </div>
    </div>
  `;
  document.getElementById('add-all-to-cart').addEventListener('click', () => {
    favProducts.forEach((p) => {
      if (p.stock > 0) cartStore.add(p.id, 1);
    });
    toast('Все товары добавлены в корзину', 'success');
  });
  document.getElementById('clear-fav').addEventListener('click', () => {
    favProducts.forEach((p) => {
      if (favStore.has(p.id)) favStore.toggle(p.id);
    });
    renderFavorites();
    toast('Избранное очищено', 'info');
  });
}
