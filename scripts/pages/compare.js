
import { get, compare as compareStore } from '../store.js';
import { loadCatalog } from '../api.js';
import { formatPrice, escapeHtml } from '../utils.js';
import { toast } from '../ui.js';
export async function renderCompare() {
  let app = document.getElementById('app');
  let ids = get('compare');
  if (ids.length === 0) {
    app.innerHTML = `
      <div class="container section empty-state">
        <span class="emoji">⚖️</span>
        <h2>Список сравнения пуст</h2>
        <p>Добавляйте товары к сравнению кнопкой ⚖️ в каталоге или карточке товара.</p>
        <a href="#/catalog" class="btn" style="margin-top:20px">В каталог</a>
      </div>`;
    return;
  }
  let { products, categories } = await loadCatalog();
  let items = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs"><a href="#/">Главная</a><span class="sep">/</span><span>Сравнение</span></nav>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
        <h1 class="section-title" style="margin:0">Сравнение товаров (${items.length})</h1>
        <button class="btn btn-ghost" id="clear-compare">Очистить</button>
      </div>
      <div class="compare-layout">
        <table class="compare-table">
          <thead>
            <tr>
              <th style="text-align:left;background:var(--surface-2);width:160px">Характеристика</th>
              ${items.map((p) => `
                <th>
                  <a href="#/product?id=${p.id}"><img src="${p.image}" alt="${escapeHtml(p.title)}" /></a>
                  <div style="font-size:.85rem;margin:8px 0"><a href="#/product?id=${p.id}" style="color:var(--text)">${escapeHtml(p.title)}</a></div>
                  <div style="font-weight:800;color:var(--accent)">${formatPrice(p.price)}</div>
                  <button class="btn btn-sm btn-ghost" data-remove="${p.id}" style="margin-top:6px">Удалить</button>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${renderRow('Бренд', items, (p) => escapeHtml(p.brand))}
            ${renderRow('Категория', items, (p) => {
              const cat = categories.find((c) => c.slug === p.category);
              return cat ? `${cat.icon} ${escapeHtml(cat.name)}` : escapeHtml(p.category);
            })}
            ${renderRow('Цена', items, (p) => formatPrice(p.price))}
            ${renderRow('Старая цена', items, (p) => p.oldPrice ? formatPrice(p.oldPrice) : '—', true)}
            ${renderRow('Скидка', items, (p) => {
              if (!p.oldPrice) return '—';
              const d = Math.round((1 - p.price / p.oldPrice) * 100);
              return `<span class="badge badge-sale">-${d}%</span>`;
            })}
            ${renderRow('Рейтинг', items, (p) => `★ ${p.rating.toFixed(1)}`)}
            ${renderRow('Наличие', items, (p) => p.stock > 0
              ? `<span style="color:var(--success)">В наличии</span>`
              : `<span style="color:var(--danger)">Нет</span>`)}
            ${renderRow('Цвет', items, (p) => p.tags?.color ? escapeHtml(p.tags.color) : '—', true)}
            ${renderRow('Тип', items, (p) => p.tags?.type ? escapeHtml(p.tags.type) : '—', true)}
            ${renderRow('Память', items, (p) => p.tags?.memory ? escapeHtml(p.tags.memory) : '—', true)}
            ${renderRow('Новинка', items, (p) => p.isNew ? '✓ Да' : '—', true)}
          </tbody>
        </table>
      </div>
      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn" id="add-all-to-cart">🛒 Добавить все в корзину</button>
        <a href="#/catalog" class="btn btn-outline">← Вернуться в каталог</a>
      </div>
    </div>
  `;
  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      let id = Number(btn.dataset.remove);
      if (compareStore.has(id)) compareStore.toggle(id);
      toast('Убрано из сравнения', 'info', 1500);
      renderCompare();
    });
  });
  document.getElementById('clear-compare').addEventListener('click', () => {
    items.forEach((p) => { if (compareStore.has(p.id)) compareStore.toggle(p.id); });
    renderCompare();
    toast('Список сравнения очищен', 'info');
  });
  document.getElementById('add-all-to-cart').addEventListener('click', async () => {
    let { cart } = await import('../store.js');
    items.forEach((p) => { if (p.stock > 0) cart.add(p.id, 1); });
    toast('Товары добавлены в корзину', 'success');
  });
}
function renderRow(label, items, getter, skipHighlight = false) {
  let highlightIdx = -1;
  if (!skipHighlight && label === 'Цена') {
    let values = items.map((p) => p.price);
    let min = Math.min(...values);
    highlightIdx = values.indexOf(min);
  }
  if (!skipHighlight && label === 'Рейтинг') {
    let values = items.map((p) => p.rating);
    let max = Math.max(...values);
    highlightIdx = values.indexOf(max);
  }
  return `
    <tr>
      <td style="text-align:left;font-weight:600;background:var(--surface-2)">${label}</td>
      ${items.map((p, i) => `<td style="${i === highlightIdx ? 'background:var(--accent-soft);font-weight:700;color:var(--accent)' : ''}">${getter(p)}</td>`).join('')}
    </tr>
  `;
}
