
import { getProduct, loadCatalog, queryProducts, getReviews, getAllReviews, addReview, updateReview, deleteReview } from '../api.js';
import { getQueryParam, formatPrice, escapeHtml, stars } from '../utils.js';
import { productCard } from '../components.js';
import { cart, favorites, compare, recentlyViewed } from '../store.js';
import { isLoggedIn, currentUser } from '../auth.js';
import { toast, confirmDialog } from '../ui.js';
export async function renderProduct() {
  let app = document.getElementById('app');
  let id = Number(getQueryParam('id'));
  app.innerHTML = `<div class="container section"><div class="spinner"></div></div>`;
  let product = await getProduct(id);
  if (!product) {
    app.innerHTML = `
      <div class="container section empty-state">
        <span class="emoji">❓</span>
        <h2>Товар не найден</h2>
        <a href="#/catalog" class="btn">В каталог</a>
      </div>`;
    return;
  }
  recentlyViewed.add(id);
  let { products } = await loadCatalog();
  let similar = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);
  
  let similarImgs = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3)
    .map((p) => p.image);
  let gallery = [product.image, ...similarImgs].slice(0, 4);
  let discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  let isFav = favorites.has(id);
  let isCompared = compare.has(id);
  let reviews = getReviews(id);
  let avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : product.rating;
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs">
        <a href="#/">Главная</a><span class="sep">/</span>
        <a href="#/catalog?category=${product.category}">${escapeHtml(product.brand)}</a><span class="sep">/</span>
        <span>${escapeHtml(product.title)}</span>
      </nav>
      <div class="product-detail">
        <div class="product-gallery">
          <div class="product-gallery__main">
            <img id="gallery-main" src="${gallery[0]}" alt="${escapeHtml(product.title)}" />
          </div>
          <div class="product-gallery__thumbs">
            ${gallery.map((src, i) => `
              <div class="product-gallery__thumb ${i === 0 ? 'active' : ''}" data-src="${src}">
                <img src="${src}" alt="${escapeHtml(product.title)} — вид ${i + 1}" />
              </div>`).join('')}
          </div>
        </div>
        <div class="product-info">
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            ${discount ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
            ${product.isNew ? `<span class="badge badge-new">Новинка</span>` : ''}
            ${product.rating >= 4.7 ? `<span class="badge badge-hit">Хит продаж</span>` : ''}
          </div>
          <h1 class="product-info__title">${escapeHtml(product.title)}</h1>
          <div class="product-info__meta">
            <span><span class="stars">${stars(avgRating)}</span> ${avgRating.toFixed(1)} (${reviews.length} отзывов)</span>
            <span class="muted">Бренд: <strong>${escapeHtml(product.brand)}</strong></span>
            ${product.stock > 0
              ? `<span style="color:var(--success)">✓ В наличии: ${product.stock} шт</span>`
              : `<span style="color:var(--danger)">✕ Нет в наличии</span>`}
          </div>
          <div class="product-info__price">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
            ${discount ? `<span class="badge badge-sale">выгода ${formatPrice(product.oldPrice - product.price)}</span>` : ''}
          </div>
          <div class="product-info__buy">
            <div class="qty">
              <button data-qty="-1" aria-label="Меньше">−</button>
              <input id="qty-input" type="number" value="1" min="1" max="${product.stock}" />
              <button data-qty="+1" aria-label="Больше">+</button>
            </div>
            <button class="btn" id="add-to-cart" ${product.stock === 0 ? 'disabled' : ''} style="flex:1">🛒 В корзину</button>
            <button class="btn btn-outline ${isFav ? '' : ''}" id="fav-btn">${isFav ? '❤️' : '🤍'}</button>
            <button class="btn btn-outline" id="compare-btn" title="Сравнить">${isCompared ? '⚖️✓' : '⚖️'}</button>
          </div>
          <div class="product-info__features">
            <h3>Ключевые особенности</h3>
            <dl>
              <dt>Категория</dt><dd>${escapeHtml(product.brand)}</dd>
              ${product.tags?.color ? `<dt>Цвет</dt><dd>${escapeHtml(product.tags.color)}</dd>` : ''}
              ${product.tags?.type ? `<dt>Тип</dt><dd>${escapeHtml(product.tags.type)}</dd>` : ''}
              ${product.tags?.memory ? `<dt>Память</dt><dd>${escapeHtml(product.tags.memory)}</dd>` : ''}
              <dt>Артикул</dt><dd>VLT-${String(product.id).padStart(5, '0')}</dd>
              <dt>Рейтинг</dt><dd>${product.rating.toFixed(1)} из 5</dd>
            </dl>
          </div>
          <div style="margin-top:20px;padding:16px;background:var(--accent-soft);border-radius:var(--radius-sm);font-size:.9rem;">
            🚚 <strong>Доставка:</strong> завтра, бесплатно от 5000 ₽<br>
            🔄 <strong>Возврат:</strong> 14 дней<br>
            🔒 <strong>Гарантия:</strong> 12 месяцев
          </div>
        </div>
      </div>
      <div class="product-tabs">
        <div class="product-tabs__nav">
          <button class="active" data-tab="description">Описание</button>
          <button data-tab="features">Характеристики</button>
          <button data-tab="reviews">Отзывы (${reviews.length})</button>
        </div>
        <div data-tab-content="description">
          <p style="line-height:1.7;max-width:800px">${escapeHtml(product.description)}</p>
          <p style="margin-top:14px;line-height:1.7;max-width:800px" class="muted">
            Этот товар идеально подойдёт для повседневного использования. Мы заботимся о качестве — каждый экземпляр проходит проверку перед отправкой. Если у вас есть вопросы по совместимости или характеристикам, наша поддержка поможет разобраться.
          </p>
        </div>
        <div data-tab-content="features" hidden>
          <div class="product-info__features" style="margin-top:0;max-width:600px">
            <dl>
              <dt>Производитель</dt><dd>${escapeHtml(product.brand)}</dd>
              <dt>Категория</dt><dd>${escapeHtml(product.category)}</dd>
              ${product.tags?.color ? `<dt>Цвет</dt><dd>${escapeHtml(product.tags.color)}</dd>` : ''}
              ${product.tags?.type ? `<dt>Тип</dt><dd>${escapeHtml(product.tags.type)}</dd>` : ''}
              ${product.tags?.memory ? `<dt>Память</dt><dd>${escapeHtml(product.tags.memory)}</dd>` : ''}
              <dt>Гарантия</dt><dd>12 месяцев</dd>
              <dt>Страна</dt><dd>Импортёр: ООО "ВОЛЬТ"</dd>
            </dl>
          </div>
        </div>
        <div data-tab-content="reviews" hidden>
          ${renderReviewsSection(reviews, product)}
        </div>
      </div>
      ${similar.length ? `
        <section style="margin-top:60px">
          <h2 class="section-title">Похожие товары</h2>
          <div class="scroller">${similar.map(productCard).join('')}</div>
        </section>` : ''}
    </div>
  `;
  bindProductPage(product);
}
function renderReviewsSection(reviews, product) {
  if (reviews.length === 0) {
    return `
      <div class="empty-state">
        <span class="emoji">💬</span>
        <h3>Пока нет отзывов</h3>
        <p>Будьте первым, кто оставит отзыв на этот товар!</p>
      </div>
      ${renderReviewForm(product)}
    `;
  }
  let dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  let avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return `
    <div class="reviews__summary">
      <div>
        <div class="reviews__score">${avg.toFixed(1)}</div>
        <div class="stars">${stars(avg)}</div>
        <div class="muted">${reviews.length} отзывов</div>
      </div>
      <div class="reviews__bars">
        ${dist.map((d) => `
          <div class="reviews__bar">
            <span>${d.star}★</span>
            <div class="reviews__bar-track"><div class="reviews__bar-fill" style="width:${(d.count / reviews.length) * 100}%"></div></div>
            <span>${d.count}</span>
          </div>`).join('')}
      </div>
    </div>
    <div id="reviews-list">
      ${reviews.map((r) => renderReviewItem(r)).join('')}
    </div>
    ${renderReviewForm(product)}
  `;
}
function renderReviewItem(r) {
  let user = currentUser();
  let isOwner = user && r.author === user.name;
  return `
    <div class="review-item" data-review="${r.id}">
      <div class="review-item__head">
        <div>
          <div class="review-item__author">${escapeHtml(r.author)}</div>
          <div class="stars">${stars(r.rating)}</div>
        </div>
        <div class="review-item__date">${r.date}</div>
      </div>
      <p class="review-item__text">${escapeHtml(r.text)}</p>
      ${isOwner ? `
        <div class="review-item__actions">
          <button class="btn btn-sm btn-ghost" data-edit-review="${r.id}">✏️ Редактировать</button>
          <button class="btn btn-sm btn-ghost" data-del-review="${r.id}">🗑️ Удалить</button>
        </div>` : ''}
    </div>
  `;
}
function renderReviewForm(product) {
  if (!isLoggedIn()) {
    return `<p class="muted" style="margin-top:20px">Чтобы оставить отзыв, <a href="#/login">войдите</a> в аккаунт.</p>`;
  }
  return `
    <div style="margin-top:30px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px;">
      <h3 style="margin-bottom:14px">Оставить отзыв</h3>
      <form id="review-form">
        <input type="hidden" name="productId" value="${product.id}" />
        <div class="field">
          <label>Ваша оценка</label>
          <div class="rating-input">
            ${[5, 4, 3, 2, 1].map((n) => `
              <input type="radio" name="rating" id="r${n}" value="${n}" ${n === 5 ? 'required' : ''} />
              <label for="r${n}" title="${n} из 5">★</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label for="review-text">Текст отзыва <span class="req">*</span></label>
          <textarea class="textarea" id="review-text" name="text" required minlength="5" maxlength="500" placeholder="Поделитесь впечатлениями о товаре..."></textarea>
        </div>
        <button type="submit" class="btn">Опубликовать отзыв</button>
      </form>
    </div>
  `;
}
function bindProductPage(product) {
  document.querySelectorAll('.product-gallery__thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.product-gallery__thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
      document.getElementById('gallery-main').src = thumb.dataset.src;
    });
  });
  let qtyInput = document.getElementById('qty-input');
  document.querySelectorAll('[data-qty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      let delta = Number(btn.dataset.qty);
      let next = Math.max(1, Math.min(product.stock, Number(qtyInput.value) + delta));
      qtyInput.value = next;
    });
  });
  document.getElementById('add-to-cart').addEventListener('click', () => {
    cart.add(product.id, Number(qtyInput.value));
    toast(`Добавлено в корзину: ${qtyInput.value} шт`, 'success');
  });
  let favBtn = document.getElementById('fav-btn');
  favBtn.addEventListener('click', () => {
    let active = favorites.toggle(product.id);
    favBtn.textContent = active ? '❤️' : '🤍';
    toast(active ? 'В избранном!' : 'Убрано из избранного', active ? 'success' : 'info', 1500);
  });
  let cmpBtn = document.getElementById('compare-btn');
  cmpBtn.addEventListener('click', () => {
    let active = compare.toggle(product.id);
    cmpBtn.textContent = active ? '⚖️✓' : '⚖️';
    toast(active ? 'Добавлено к сравнению' : 'Убрано из сравнения', 'info', 1500);
  });
  document.querySelectorAll('.product-tabs__nav [data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.product-tabs__nav [data-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('[data-tab-content]').forEach((c) => (c.hidden = true));
      document.querySelector(`[data-tab-content="${btn.dataset.tab}"]`).hidden = false;
    });
  });
  bindReviews(product);
}
function refreshReviews(product, editingId = null) {
  let reviews = getReviews(product.id);
  let container = document.querySelector('[data-tab-content="reviews"]');
  if (container) {
    container.innerHTML = renderReviewsSection(reviews, product);
    bindReviews(product, editingId);
  }
}
function bindReviews(product, editingId = null) {
  let form = document.getElementById('review-form');
  if (form) {
    let heading = form.parentElement.querySelector('h3');
    let submitBtn = form.querySelector('button[type=submit]');
    if (editingId) {
      if (heading) heading.textContent = 'Редактировать отзыв';
      if (submitBtn) submitBtn.textContent = 'Сохранить изменения';
      let all = getAllReviews();
      let review = all.find((r) => r.id === editingId);
      if (review) {
        form.querySelector('[name=text]').value = review.text;
        let radio = form.querySelector(`[name=rating][value="${review.rating}"]`);
        if (radio) radio.checked = true;
      }
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let user = currentUser();
      if (!user) { toast('Войдите, чтобы оставить отзыв', 'warning'); return; }
      let fd = new FormData(form);
      let rating = Number(fd.get('rating'));
      let text = String(fd.get('text')).trim();
      if (!rating || text.length < 5) {
        toast('Оценка и текст (от 5 символов) обязательны', 'warning');
        return;
      }
      if (editingId) {
        updateReview(editingId, { rating, text });
        toast('Отзыв обновлён', 'success');
      } else {
        addReview({
          id: 'r' + Date.now(),
          productId: product.id,
          author: user.name,
          rating, text,
          date: new Date().toISOString().slice(0, 10),
        });
        toast('Отзыв опубликован!', 'success');
      }
      refreshReviews(product);
    });
  }
  document.querySelectorAll('[data-del-review]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      let id = btn.dataset.delReview;
      let ok = await confirmDialog('Удалить этот отзыв?');
      if (!ok) return;
      deleteReview(id);
      toast('Отзыв удалён', 'info');
      refreshReviews(product);
    });
  });
  document.querySelectorAll('[data-edit-review]').forEach((btn) => {
    btn.addEventListener('click', () => {
      refreshReviews(product, btn.dataset.editReview);
      let f = document.getElementById('review-form');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}
