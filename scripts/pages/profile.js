
import { isLoggedIn, currentUser, updateProfile, logout } from '../auth.js';
import { getUserOrders, getAllReviews, getPromos, deleteReview } from '../api.js';
import { formatPrice, escapeHtml, stars, getQueryParam } from '../utils.js';
import { toast, confirmDialog } from '../ui.js';
export function renderProfile() {
  let app = document.getElementById('app');
  if (!isLoggedIn()) {
    app.innerHTML = `
      <div class="container section empty-state">
        <span class="emoji">🔑</span>
        <h2>Войдите в аккаунт</h2>
        <p>Личный кабинет доступен только авторизованным пользователям.</p>
        <a href="#/login?redirect=/profile" class="btn" style="margin-top:20px">Войти</a>
      </div>`;
    return;
  }
  let user = currentUser();
  let tab = getQueryParam('tab') || 'profile';
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs"><a href="#/">Главная</a><span class="sep">/</span><span>Личный кабинет</span></nav>
      <div class="profile-layout">
        <aside class="profile-nav">
          <a href="#/profile?tab=profile" data-tab="profile" class="${tab === 'profile' ? 'active' : ''}">👤 Профиль</a>
          <a href="#/profile?tab=orders" data-tab="orders" class="${tab === 'orders' ? 'active' : ''}">📦 Заказы</a>
          <a href="#/profile?tab=favorites" data-tab="favorites" class="${tab === 'favorites' ? 'active' : ''}">❤️ Избранное</a>
          <a href="#/profile?tab=bonus" data-tab="bonus" class="${tab === 'bonus' ? 'active' : ''}">🎁 Бонусы и промокоды</a>
          <a href="#/profile?tab=reviews" data-tab="reviews" class="${tab === 'reviews' ? 'active' : ''}">💬 Мои отзывы</a>
          <a href="#/game" class="">🎡 Сыграть в игру</a>
          <button class="btn btn-ghost btn-block" id="logout-btn" style="margin-top:8px">Выйти</button>
        </aside>
        <div class="profile-content">
          <div class="profile-header">
            <div class="profile-avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div>
            <div>
              <h1 style="font-size:1.4rem">${escapeHtml(user.name)}</h1>
              <p class="muted">${escapeHtml(user.email)}</p>
            </div>
          </div>
          <div id="tab-content">
            ${renderTab(tab, user)}
          </div>
        </div>
      </div>
    </div>
  `;
  bindTab(tab, user);
  document.getElementById('logout-btn').addEventListener('click', async () => {
    let ok = await confirmDialog('Выйти из аккаунта?');
    if (ok) {
      logout();
      location.hash = '#/';
    }
  });
}
function renderTab(tab, user) {
  switch (tab) {
    case 'orders': return renderOrders(user);
    case 'favorites': return renderFavoritesTab();
    case 'bonus': return renderBonus(user);
    case 'reviews': return renderMyReviews(user);
    default: return renderProfileEdit(user);
  }
}
function renderProfileEdit(user) {
  return `
    <h2 style="margin-bottom:20px">Личные данные</h2>
    <form id="profile-form" style="max-width:500px">
      <div class="field">
        <label for="p-name">Имя</label>
        <input class="input" type="text" id="p-name" value="${escapeHtml(user.name)}" />
      </div>
      <div class="field">
        <label for="p-email">Email</label>
        <input class="input" type="email" id="p-email" value="${escapeHtml(user.email)}" />
      </div>
      <div class="field">
        <label for="p-phone">Телефон</label>
        <input class="input" type="tel" id="p-phone" value="${escapeHtml(user.phone || '')}" placeholder="+7 999 000-00-00" />
      </div>
      <div class="field">
        <label for="p-address">Адрес доставки</label>
        <textarea class="textarea" id="p-address" placeholder="Город, улица, дом, квартира">${escapeHtml(user.address || '')}</textarea>
      </div>
      <button type="submit" class="btn">Сохранить изменения</button>
    </form>
  `;
}
function renderOrders(user) {
  let orders = getUserOrders(user.id);
  if (orders.length === 0) {
    return `
      <div class="empty-state">
        <span class="emoji">📦</span>
        <h3>Заказов пока нет</h3>
        <p>Оформите первый заказ — он появится здесь.</p>
        <a href="#/catalog" class="btn" style="margin-top:16px">В каталог</a>
      </div>`;
  }
  return `
    <h2 style="margin-bottom:20px">История заказов (${orders.length})</h2>
    ${orders.map((o) => `
      <div class="order-card">
        <div class="order-card__head">
          <div>
            <strong>Заказ ${escapeHtml(o.id)}</strong>
            <span class="muted" style="margin-left:10px">от ${o.date}</span>
          </div>
          <div style="text-align:right">
            <span class="chip">${escapeHtml(o.status)}</span>
            <div style="font-weight:700;margin-top:4px">${formatPrice(o.total)}</div>
          </div>
        </div>
        <div class="order-card__items">
          ${o.items.map((it) => `
            <a href="#/product?id=${it.id}" class="order-card__thumb" title="${escapeHtml(it.title)}">
              <img src="${it.image}" alt="${escapeHtml(it.title)}" />
            </a>`).join('')}
        </div>
        <div class="muted" style="font-size:.85rem;margin-top:10px">
          ${o.items.length} тов. · Доставка: ${escapeHtml(o.address)}
          ${o.promo ? ` · Промокод: ${escapeHtml(o.promo)}` : ''}
        </div>
      </div>
    `).join('')}
  `;
}
function renderFavoritesTab() {
  return `
    <h2 style="margin-bottom:8px">Избранные товары</h2>
    <p class="muted" style="margin-bottom:20px">Полный список избранных товаров с возможностью переноса в корзину.</p>
    <a href="#/favorites" class="btn">Перейти в избранное →</a>
  `;
}
function renderBonus(user) {
  let promos = getPromos();
  return `
    <div class="bonus-card">
      <div class="bonus-card__label">Ваши бонусы</div>
      <div class="bonus-card__value">${(user.bonuses || 0).toLocaleString('ru-RU')}</div>
      <div style="opacity:.9;font-size:.85rem">1 бонус = 1 ₽ при оплате заказа</div>
    </div>
    <h2 style="margin:20px 0 14px">Мои промокоды</h2>
    ${promos.length === 0 ? `
      <p class="muted">У вас пока нет промокодов. <a href="#/game">Сыграйте в игру</a>, чтобы выиграть бонусы!</p>
    ` : `
      <div style="display:grid;gap:10px">
        ${promos.map((p) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:var(--surface-2);border:1px dashed var(--accent);border-radius:var(--radius-sm)">
            <div>
              <strong style="font-size:1.1rem;letter-spacing:.05em">${escapeHtml(p.code)}</strong>
              <div class="muted" style="font-size:.82rem">${escapeHtml(p.description)} · до ${p.expires}</div>
            </div>
            <button class="btn btn-sm" data-copy="${escapeHtml(p.code)}">Копировать</button>
          </div>
        `).join('')}
      </div>
    `}
  `;
}
function renderMyReviews(user) {
  let all = getAllReviews().filter((r) => r.author === user.name);
  if (all.length === 0) {
    return `
      <div class="empty-state">
        <span class="emoji">💬</span>
        <h3>Вы ещё не оставляли отзывы</h3>
        <p>Поделитесь мнением о товарах — это поможет другим покупателям.</p>
        <a href="#/catalog" class="btn" style="margin-top:16px">Найти товар</a>
      </div>`;
  }
  return `
    <h2 style="margin-bottom:20px">Мои отзывы (${all.length})</h2>
    ${all.map((r) => `
      <div class="review-item" data-review="${r.id}">
        <div class="review-item__head">
          <div>
            <div class="review-item__author">Товар #${r.productId}</div>
            <div class="stars">${stars(r.rating)}</div>
          </div>
          <div class="review-item__date">${r.date}</div>
        </div>
        <p class="review-item__text">${escapeHtml(r.text)}</p>
        <div class="review-item__actions">
          <a class="btn btn-sm btn-ghost" href="#/product?id=${r.productId}">Открыть товар</a>
          <button class="btn btn-sm btn-ghost" data-del-my-review="${r.id}">🗑️ Удалить</button>
        </div>
      </div>
    `).join('')}
  `;
}
function bindTab(tab, user) {
  if (tab === 'profile') bindProfileForm(user);
  if (tab === 'reviews') bindMyReviews();
  if (tab === 'bonus') bindPromoCopy();
}
function bindProfileForm(user) {
  let form = document.getElementById('profile-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let patch = {
      name: document.getElementById('p-name').value.trim(),
      email: document.getElementById('p-email').value.trim(),
      phone: document.getElementById('p-phone').value.trim(),
      address: document.getElementById('p-address').value.trim(),
    };
    if (patch.name.length < 2) { toast('Имя слишком короткое', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) { toast('Некорректный email', 'error'); return; }
    updateProfile(patch);
    setTimeout(() => renderProfile(), 300);
  });
}
function bindMyReviews() {
  document.querySelectorAll('[data-del-my-review]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      let id = btn.dataset.delMyReview;
      let ok = await confirmDialog('Удалить отзыв?');
      if (!ok) return;
      deleteReview(id);
      toast('Отзыв удалён', 'info');
      btn.closest('.review-item').remove();
    });
  });
}
function bindPromoCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast('Промокод скопирован', 'success', 1500);
      } catch {
        toast('Не удалось скопировать', 'error');
      }
    });
  });
}
