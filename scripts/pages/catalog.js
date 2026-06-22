
import { loadCatalog, queryProducts } from '../api.js';
import { productCard } from '../components.js';
import { getQueryParam, getPath, debounce } from '../utils.js';
import { toast } from '../ui.js';
let pageState = {
  view: 'grid',          
  page: 1,
  perPage: 9,            
  showAll: false,        
  filters: {
    search: '',
    category: 'all',
    brands: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    inStockOnly: false,
    onSale: false,
    tags: {},
  },
  sort: 'popular',
};
let filtered = [];
export async function renderCatalog() {
  let app = document.getElementById('app');
  app.innerHTML = `<div class="container section"><div class="spinner"></div></div>`;
  let { products, categories } = await loadCatalog();
  let qSearch = getQueryParam('search');
  let qCategory = getQueryParam('category');
  let qOnSale = getQueryParam('onSale');
  if (qSearch) pageState.filters.search = qSearch;
  if (qCategory) pageState.filters.category = qCategory;
  if (qOnSale === '1') pageState.filters.onSale = true;
  pageState.page = 1;
  pageState.showAll = false;
  let brands = [...new Set(products.map((p) => p.brand))].sort();
  let prices = products.map((p) => p.price);
  let minPriceAll = Math.floor(Math.min(...prices) / 1000) * 1000;
  let maxPriceAll = Math.ceil(Math.max(...prices) / 1000) * 1000;
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs">
        <a href="#/">Главная</a><span class="sep">/</span>
        <span>Каталог</span>
      </nav>
      <h1 class="section-title" id="catalog-title">Каталог товаров</h1>
      <div class="catalog-layout">
        <aside class="filters" id="filters" aria-label="Фильтры">
          <button class="btn btn-ghost btn-block filters__reset mobile-filters-toggle" data-close-filters style="margin-bottom:8px;display:none">✕ Закрыть</button>
          <div class="filters__group">
            <div class="filters__title">📁 Категория</div>
            <select class="select" id="f-category">
              <option value="all">Все категории</option>
              ${categories.map((c) => `<option value="${c.slug}" ${pageState.filters.category === c.slug ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="filters__group">
            <div class="filters__title">💲 Цена, ₽</div>
            <div class="range-inputs">
              <input class="input" type="number" id="f-min-price" placeholder="от ${minPriceAll}" min="${minPriceAll}" />
              <span>—</span>
              <input class="input" type="number" id="f-max-price" placeholder="до ${maxPriceAll}" max="${maxPriceAll}" />
            </div>
          </div>
          <div class="filters__group">
            <div class="filters__title">⭐ Минимальный рейтинг</div>
            <div class="filters__options" id="f-rating">
              ${[4.5, 4.0, 3.5].map((r) => `
                <label class="check"><input type="radio" name="rating" value="${r}" ${pageState.filters.minRating === r ? 'checked' : ''}> от ${r} ★</label>
              `).join('')}
              <label class="check"><input type="radio" name="rating" value="" checked> любой</label>
            </div>
          </div>
          <div class="filters__group">
            <div class="filters__title">🏷️ Бренд</div>
            <div class="filters__options" id="f-brands">
              ${brands.map((b) => `<label class="check"><input type="checkbox" value="${b}"> ${b}</label>`).join('')}
            </div>
          </div>
          <div class="filters__group">
            <div class="filters__title">🔍 Дополнительно</div>
            <label class="check"><input type="checkbox" id="f-instock" ${pageState.filters.inStockOnly ? 'checked' : ''}> Только в наличии</label>
            <label class="check"><input type="checkbox" id="f-onsale" ${pageState.filters.onSale ? 'checked' : ''}> Со скидкой</label>
          </div>
          <button class="btn btn-outline btn-block filters__reset" id="reset-filters">Сбросить фильтры</button>
        </aside>
        <div class="catalog-main">
          <div class="catalog-main__bar">
            <span class="catalog-main__count" id="result-count"></span>
            <button class="btn btn-outline btn-sm mobile-filters-toggle" id="open-filters" style="display:none">⚙ Фильтры</button>
            <div class="catalog-main__right">
              <div class="segmented" role="group" aria-label="Вид каталога">
                <button data-view="grid" class="${pageState.view === 'grid' ? 'active' : ''}">▦ Сетка</button>
                <button data-view="list" class="${pageState.view === 'list' ? 'active' : ''}">☰ Список</button>
              </div>
              <select class="select" id="sort-select" style="width:auto">
                <option value="popular">Популярные</option>
                <option value="price-asc">Сначала недорогие</option>
                <option value="price-desc">Сначала дорогие</option>
                <option value="rating-desc">По рейтингу</option>
                <option value="newest">Сначала новинки</option>
                <option value="discount">По размеру скидки</option>
              </select>
            </div>
          </div>
          <div class="products-grid" data-view="${pageState.view}" id="products-container"></div>
          <div id="pagination-area"></div>
        </div>
      </div>
    </div>
  `;
  bindFilters(brands);
  bindControls();
  await applyAndRender();
}
async function applyAndRender() {
  pageState.filters.category = document.getElementById('f-category').value;
  pageState.filters.brands = [...document.querySelectorAll('#f-brands input:checked')].map((c) => c.value);
  let minP = document.getElementById('f-min-price').value;
  let maxP = document.getElementById('f-max-price').value;
  pageState.filters.minPrice = minP ? Number(minP) : null;
  pageState.filters.maxPrice = maxP ? Number(maxP) : null;
  let ratingChecked = document.querySelector('#f-rating input:checked');
  pageState.filters.minRating = ratingChecked && ratingChecked.value ? Number(ratingChecked.value) : null;
  pageState.filters.inStockOnly = document.getElementById('f-instock').checked;
  pageState.filters.onSale = document.getElementById('f-onsale').checked;
  filtered = await queryProducts({
    ...pageState.filters,
    sort: pageState.sort,
  });
  renderProducts();
}
function renderProducts() {
  let container = document.getElementById('products-container');
  let countEl = document.getElementById('result-count');
  let pagArea = document.getElementById('pagination-area');
  countEl.textContent = `Найдено: ${filtered.length}`;
  if (filtered.length === 0) {
    container.innerHTML = '';
    pagArea.innerHTML = `
      <div class="empty-state">
        <span class="emoji">🔍</span>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры фильтра или сбросить их.</p>
      </div>`;
    return;
  }
  let visibleCount = pageState.showAll
    ? Math.min(pageState.page * pageState.perPage, filtered.length)
    : pageState.page * pageState.perPage;
  let visible = filtered.slice(0, visibleCount);
  container.dataset.view = pageState.view;
  container.innerHTML = visible.map(productCard).join('');
  let totalPages = Math.ceil(filtered.length / pageState.perPage);
  let hasMore = visibleCount < filtered.length;
  let pagHtml = '';
  if (hasMore) {
    let remaining = filtered.length - visibleCount;
    pagHtml += `<div class="text-center" style="margin-top:24px">
      <button class="btn btn-outline" id="load-more">Показать ещё ${remaining} из ${filtered.length}</button>
    </div>`;
  }
  if (totalPages > 1) {
    pagHtml += `<div class="pagination">`;
    pagHtml += `<button data-page="${pageState.page - 1}" ${pageState.page === 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - pageState.page) <= 1) {
        pagHtml += `<button data-page="${i}" class="${i === pageState.page ? 'active' : ''}">${i}</button>`;
      } else if (i === 2 || i === totalPages - 1) {
        pagHtml += `<button disabled>…</button>`;
      }
    }
    pagHtml += `<button data-page="${pageState.page + 1}" ${pageState.page === totalPages ? 'disabled' : ''}>›</button>`;
    pagHtml += `</div>`;
  }
  pagArea.innerHTML = pagHtml;
  pagArea.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      let p = Number(btn.dataset.page);
      if (p >= 1 && p <= totalPages) {
        pageState.page = p;
        pageState.showAll = false;
        renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
  let loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      pageState.showAll = true;
      pageState.page = totalPages;
      renderProducts();
      toast('Загружены все товары', 'info', 1500);
    });
  }
}
function bindFilters() {
  let inputs = document.querySelectorAll('#filters input, #filters select');
  inputs.forEach((el) => {
    el.addEventListener('change', () => {
      pageState.page = 1;
      pageState.showAll = false;
      applyAndRender();
    });
  });
  document.getElementById('reset-filters').addEventListener('click', () => {
    document.querySelectorAll('#f-brands input:checked').forEach((c) => (c.checked = false));
    document.getElementById('f-min-price').value = '';
    document.getElementById('f-max-price').value = '';
    document.getElementById('f-category').value = 'all';
    document.querySelector('#f-rating input[value=""]').checked = true;
    document.getElementById('f-instock').checked = false;
    document.getElementById('f-onsale').checked = false;
    pageState.filters.search = '';
    pageState.page = 1;
    pageState.showAll = false;
    applyAndRender();
    toast('Фильтры сброшены', 'info', 1500);
  });
}
function bindControls() {
  document.querySelectorAll('.segmented [data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pageState.view = btn.dataset.view;
      document.querySelectorAll('.segmented [data-view]').forEach((b) => b.classList.toggle('active', b === btn));
      renderProducts();
    });
  });
  document.getElementById('sort-select').value = pageState.sort;
  document.getElementById('sort-select').addEventListener('change', (e) => {
    pageState.sort = e.target.value;
    pageState.page = 1;
    pageState.showAll = false;
    applyAndRender();
  });
  let filtersPanel = document.getElementById('filters');
  document.getElementById('open-filters').addEventListener('click', () => filtersPanel.classList.add('is-open'));
  document.querySelector('[data-close-filters]').addEventListener('click', () => filtersPanel.classList.remove('is-open'));
}
