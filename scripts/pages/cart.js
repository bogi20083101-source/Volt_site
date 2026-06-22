
import { get, cart as cartStore } from '../store.js';
import { loadCatalog } from '../api.js';
import { addOrder, VALID_PROMOS, SHIPPING_COST } from '../api.js';
import { formatPrice, escapeHtml } from '../utils.js';
import { isLoggedIn } from '../auth.js';
import { toast } from '../ui.js';
let appliedPromo = null;
export async function renderCart() {
  let app = document.getElementById('app');
  appliedPromo = null; 
  let cartItems = get('cart');
  let { products } = await loadCatalog();
  let lines = cartItems
    .map((item) => {
      let product = products.find((p) => p.id === item.id);
      return product ? { ...product, qty: item.qty } : null;
    })
    .filter(Boolean);
  if (lines.length === 0) {
    app.innerHTML = `
      <div class="container section empty-state">
        <span class="emoji">🛒</span>
        <h2>Ваша корзина пуста</h2>
        <p>Самое время заглянуть в каталог и выбрать что-нибудь полезное!</p>
        <a href="#/catalog" class="btn" style="margin-top:20px">Перейти в каталог</a>
      </div>`;
    return;
  }
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs">
        <a href="#/">Главная</a><span class="sep">/</span><span>Корзина</span>
      </nav>
      <h1 class="section-title">Корзина</h1>
      <div class="cart-layout">
        <div id="cart-items">
          ${lines.map((line) => renderCartItem(line)).join('')}
        </div>
        <aside class="cart-summary" id="cart-summary">
          <h3>Итого по заказу</h3>
          <div id="summary-rows"></div>
          <div class="promo-field">
            <input class="input" type="text" id="promo-input" placeholder="Промокод" />
            <button class="btn btn-outline btn-sm" id="apply-promo">OK</button>
          </div>
          <div id="promo-info" style="font-size:.85rem;margin-bottom:10px;"></div>
          <button class="btn btn-block" id="checkout-btn">Оформить заказ</button>
          <button class="btn btn-ghost btn-block" id="clear-cart" style="margin-top:8px">Очистить корзину</button>
          <p class="muted" style="font-size:.8rem;margin-top:12px;text-align:center">
            💡 Подсказка: попробуйте WELCOME10 или GAME15
          </p>
        </aside>
      </div>
    </div>
  `;
  bindCartActions(lines);
  renderSummary(lines);
}
function renderCartItem(line) {
  return `
    <div class="cart-item" data-cart-item="${line.id}">
      <a href="#/product?id=${line.id}" class="cart-item__img"><img src="${line.image}" alt="${escapeHtml(line.title)}" /></a>
      <div>
        <div class="cart-item__title"><a href="#/product?id=${line.id}">${escapeHtml(line.title)}</a></div>
        <div class="muted" style="font-size:.88rem">${escapeHtml(line.brand)} · Арт. VLT-${String(line.id).padStart(5, '0')}</div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="qty">
            <button data-qty-item="${line.id}" data-delta="-1">−</button>
            <input type="number" value="${line.qty}" min="1" max="${line.stock}" data-qty-input="${line.id}" />
            <button data-qty-item="${line.id}" data-delta="1">+</button>
          </div>
          <span style="font-weight:700">${formatPrice(line.price * line.qty)}</span>
          ${line.oldPrice ? `<span class="muted" style="font-size:.82rem;text-decoration:line-through">${formatPrice(line.oldPrice * line.qty)}</span>` : ''}
        </div>
      </div>
      <button class="cart-item__remove" data-remove="${line.id}" title="Удалить" aria-label="Удалить">✕</button>
    </div>
  `;
}
function renderSummary(lines) {
  let subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let shipping = subtotal >= 5000 ? 0 : SHIPPING_COST;
  let discount = 0;
  let promoInfo = '';
  if (appliedPromo) {
    let promo = VALID_PROMOS[appliedPromo];
    if (promo.type === 'percent') {
      discount = Math.round(subtotal * promo.value / 100);
      promoInfo = `Промокод ${appliedPromo}: −${promo.value}% (${formatPrice(discount)})`;
    } else if (promo.type === 'fixed') {
      discount = Math.min(promo.value, subtotal);
      promoInfo = `Промокод ${appliedPromo}: −${formatPrice(promo.value)}`;
    } else if (promo.type === 'shipping') {
      promoInfo = `Промокод ${appliedPromo}: бесплатная доставка`;
    }
  }
  let effectiveShipping = appliedPromo && VALID_PROMOS[appliedPromo]?.type === 'shipping' ? 0 : shipping;
  let total = subtotal - discount + effectiveShipping;
  document.getElementById('summary-rows').innerHTML = `
    <div class="cart-summary__row"><span>Товары (${lines.reduce((s, l) => s + l.qty, 0)} шт)</span><span>${formatPrice(subtotal)}</span></div>
    ${discount ? `<div class="cart-summary__row" style="color:var(--success)"><span>Скидка</span><span>−${formatPrice(discount)}</span></div>` : ''}
    <div class="cart-summary__row"><span>Доставка</span><span>${effectiveShipping === 0 ? 'Бесплатно' : formatPrice(effectiveShipping)}</span></div>
    <div class="cart-summary__total"><span>К оплате</span><span>${formatPrice(total)}</span></div>
  `;
  document.getElementById('promo-info').innerHTML = promoInfo
    ? `<span style="color:var(--success)">✓ ${promoInfo}</span>`
    : '';
  return total;
}
function bindCartActions(lines) {
  document.querySelectorAll('[data-qty-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      let id = Number(btn.dataset.qtyItem);
      let delta = Number(btn.dataset.delta);
      let line = lines.find((l) => l.id === id);
      if (!line) return;
      let newQty = Math.max(1, Math.min(line.stock, line.qty + delta));
      cartStore.setQty(id, newQty);
      line.qty = newQty;
      document.querySelector(`[data-qty-input="${id}"]`).value = newQty;
      let row = btn.closest('.cart-item');
      row.querySelector('span[style*="font-weight:700"]').textContent = formatPrice(line.price * newQty);
      renderSummary(lines);
    });
  });
  document.querySelectorAll('[data-qty-input]').forEach((input) => {
    input.addEventListener('change', () => {
      let id = Number(input.dataset.qtyInput);
      let line = lines.find((l) => l.id === id);
      let newQty = Math.max(1, Math.min(line.stock, Number(input.value) || 1));
      cartStore.setQty(id, newQty);
      line.qty = newQty;
      input.value = newQty;
      renderSummary(lines);
    });
  });
  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      let id = Number(btn.dataset.remove);
      cartStore.remove(id);
      let idx = lines.findIndex((l) => l.id === id);
      if (idx > -1) lines.splice(idx, 1);
      if (lines.length === 0) {
        renderCart();
      } else {
        btn.closest('.cart-item').remove();
        renderSummary(lines);
      }
      toast('Товар удалён', 'info', 1500);
    });
  });
  document.getElementById('apply-promo').addEventListener('click', () => {
    let code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (!code) return;
    if (VALID_PROMOS[code]) {
      appliedPromo = code;
      renderSummary(lines);
      toast(`Промокод ${code} применён!`, 'success');
    } else {
      toast('Неверный промокод', 'error');
    }
  });
  document.getElementById('clear-cart').addEventListener('click', () => {
    cartStore.clear();
    renderCart();
    toast('Корзина очищена', 'info');
  });
  document.getElementById('checkout-btn').addEventListener('click', () => checkout(lines));
}
async function checkout(lines) {
  if (!isLoggedIn()) {
    toast('Войдите, чтобы оформить заказ', 'warning');
    setTimeout(() => location.hash = '#/login?redirect=/cart', 800);
    return;
  }
  let { currentUser } = await import('../auth.js');
  let user = currentUser();
  let subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let total = renderSummary(lines);
  let order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    userId: user.id,
    items: lines.map((l) => ({ id: l.id, title: l.title, price: l.price, qty: l.qty, image: l.image })),
    total,
    subtotal,
    promo: appliedPromo,
    status: 'Оформлен',
    date: new Date().toISOString().slice(0, 10),
    address: user.address || 'Не указан',
  };
  addOrder(order);
  cartStore.clear();
  toast(`Заказ ${order.id} оформлен! Спасибо!`, 'success', 4000);
  setTimeout(() => location.hash = '#/profile?tab=orders', 1200);
}
