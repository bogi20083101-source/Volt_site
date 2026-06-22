import { get, cart, favorites, compare, theme } from './store.js';
import { isLoggedIn, currentUser } from './auth.js';
import { formatPrice, escapeHtml, stars } from './utils.js';
import { loadCatalog } from './api.js';
export async function renderHeader() {
  let header = document.getElementById('site-header');
  let cartCount = 0;
  for (let i = 0; i < get('cart').length; i++) {
    cartCount += get('cart')[i].qty;
  }
  let favCount = get('favorites').length;
  let compareCount = get('compare').length;
  let user = currentUser();
  let isVi = get('visuallyImpaired') === 'on';
  let isDark = get('theme') === 'dark';
  let catsHtml = '';
  try {
    let data = await loadCatalog();
    catsHtml = data.categories.map(function(c) {
      return '<a href="#/catalog?category=' + c.slug + '" data-nav>' + c.icon + ' ' + c.name + '</a>';
    }).join('');
  } catch (e) { catsHtml = ''; }
  header.innerHTML = '<div class="container header__inner">' +
    '<a href="#/" class="logo"><span class="logo__mark">⚡</span> ВОЛЬТ</a>' +
    '<form class="search" id="search-form" role="search">' +
      '<span class="search__icon">🔍</span>' +
      '<input type="search" id="search-input" placeholder="Поиск по товарам..." aria-label="Поиск" />' +
    '</form>' +
    '<div class="header__actions">' +
      '<button class="header__action" id="theme-toggle" title="Сменить тему" aria-label="Сменить тему">' +
        '<span class="icon">' + (isDark ? '☀️' : '🌙') + '</span>' +
        '<span>Тема</span>' +
      '</button>' +
      '<button class="header__action" id="vi-toggle" title="Версия для слабовидящих" aria-label="Версия для слабовидящих" style="' + (isVi ? 'color:var(--accent);font-weight:700' : '') + '">' +
        '<span class="icon">👁</span>' +
        '<span>Шрифт</span>' +
      '</button>' +
      '<a class="header__action" href="#/compare" data-nav title="Сравнение">' +
        '<span class="icon">⚖️</span>' +
        '<span>Сравнение</span>' +
        (compareCount ? '<span class="header__count">' + compareCount + '</span>' : '') +
      '</a>' +
      '<a class="header__action" href="#/favorites" data-nav title="Избранное">' +
        '<span class="icon">❤️</span>' +
        '<span>Избранное</span>' +
        (favCount ? '<span class="header__count">' + favCount + '</span>' : '') +
      '</a>' +
      '<a class="header__action" href="#/cart" data-nav title="Корзина">' +
        '<span class="icon">🛒</span>' +
        '<span>Корзина</span>' +
        (cartCount ? '<span class="header__count">' + cartCount + '</span>' : '') +
      '</a>' +
      (isLoggedIn()
        ? '<a class="header__action" href="#/profile" data-nav title="Личный кабинет">' +
            '<span class="icon">👤</span>' +
            '<span>' + escapeHtml(user.name.split(' ')[0]) + '</span>' +
          '</a>'
        : '<a class="header__action" href="#/login" data-nav title="Войти">' +
            '<span class="icon">🔑</span>' +
            '<span>Войти</span>' +
          '</a>') +
    '</div>' +
  '</div>' +
  '<div class="header__sub">' +
    '<div class="container">' +
      '<nav class="header__cats" aria-label="Категории">' +
        '<a href="#/catalog" data-nav>🛍️ Все товары</a>' +
        catsHtml +
        '<a href="#/game" data-nav>🎮 Игра</a>' +
      '</nav>' +
    '</div>' +
  '</div>';
  document.getElementById('theme-toggle').addEventListener('click', function() {
    theme.toggle();
  });
  document.getElementById('vi-toggle').addEventListener('click', function() {
    theme.toggleVisuallyImpaired();
  });
  document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let q = document.getElementById('search-input').value.trim();
    if (q) location.hash = '#/catalog?search=' + encodeURIComponent(q);
  });
}
export function renderFooter() {
  let footer = document.getElementById('site-footer');
  footer.innerHTML = '<div class="container">' +
    '<div class="footer__grid">' +
      '<div class="footer__col footer__about">' +
        '<a href="#/" class="logo"><span class="logo__mark">⚡</span> ВОЛЬТ</a>' +
        '<p>Интернет-магазин электроники. Гаджеты, аудио, ноутбуки и аксессуары по честным ценам. Доставка по всей России.</p>' +
      '</div>' +
      '<div class="footer__col">' +
        '<h4>Каталог</h4>' +
        '<ul>' +
          '<li><a href="#/catalog?category=smartphones">Смартфоны</a></li>' +
          '<li><a href="#/catalog?category=audio">Наушники и аудио</a></li>' +
          '<li><a href="#/catalog?category=laptops">Ноутбуки</a></li>' +
          '<li><a href="#/catalog?category=accessories">Аксессуары</a></li>' +
        '</ul>' +
      '</div>' +
      '<div class="footer__col">' +
        '<h4>Покупателям</h4>' +
        '<ul>' +
          '<li><a href="#/cart">Корзина</a></li>' +
          '<li><a href="#/favorites">Избранное</a></li>' +
          '<li><a href="#/game">Бонусная игра</a></li>' +
          '<li><a href="#/profile">Личный кабинет</a></li>' +
        '</ul>' +
      '</div>' +
      '<div class="footer__col">' +
        '<h4>Контакты</h4>' +
        '<ul>' +
          '<li>📞 8 800 555-35-35</li>' +
          '<li>✉️ help@volt-shop.ru</li>' +
          '<li>📍 Москва, ул. Электронная, 1</li>' +
          '<li>⏰ Пн–Вс, 9:00–21:00</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="footer__bottom">' +
      '© 2025 ВОЛЬТ. Учебный проект. Все права на изображения принадлежат их владельцам.' +
    '</div>' +
  '</div>';
}
export function productCard(p) {
  let isFav = favorites.has(p.id);
  let discount = 0;
  if (p.oldPrice) discount = Math.round((1 - p.price / p.oldPrice) * 100);
  let badge = '';
  if (discount) badge = '<span class="badge badge-sale">-' + discount + '%</span>';
  else if (p.isNew) badge = '<span class="badge badge-new">Новинка</span>';
  else if (p.rating >= 4.7) badge = '<span class="badge badge-hit">Хит</span>';
  return '<article class="product-card" data-id="' + p.id + '">' +
    '<div class="product-card__media">' +
      '<div class="product-card__badges">' + badge + '</div>' +
      '<button class="product-card__fav ' + (isFav ? 'is-active' : '') + '" data-fav="' + p.id + '" aria-label="В избранное" title="В избранное">' +
        (isFav ? '❤️' : '🤍') +
      '</button>' +
      '<a href="#/product?id=' + p.id + '"><img src="' + p.image + '" alt="' + escapeHtml(p.title) + '" loading="lazy" /></a>' +
    '</div>' +
    '<div class="product-card__body">' +
      '<span class="product-card__category">' + escapeHtml(p.brand) + '</span>' +
      '<h3 class="product-card__title"><a href="#/product?id=' + p.id + '">' + escapeHtml(p.title) + '</a></h3>' +
      '<p class="product-card__extra">' + (p.tags && p.tags.color ? 'Цвет: ' + escapeHtml(p.tags.color) + ' · ' : '') + (p.tags && p.tags.type ? p.tags.type : '') + '</p>' +
      '<div class="product-card__rating">' +
        '<span class="stars">' + stars(p.rating) + '</span>' +
        '<span>' + p.rating.toFixed(1) + '</span>' +
        (p.stock === 0 ? '<span style="color:var(--danger);margin-left:auto">Нет в наличии</span>' : '<span style="color:var(--success);margin-left:auto">В наличии</span>') +
      '</div>' +
      '<div class="product-card__price">' +
        '<span class="price-current">' + formatPrice(p.price) + '</span>' +
        (p.oldPrice ? '<span class="price-old">' + formatPrice(p.oldPrice) + '</span>' : '') +
      '</div>' +
      '<div class="product-card__actions">' +
        '<button class="btn btn-sm" data-cart="' + p.id + '" ' + (p.stock === 0 ? 'disabled' : '') + '>🛒 В корзину</button>' +
        '<button class="btn btn-sm btn-ghost" data-compare="' + p.id + '" title="Сравнить">⚖️</button>' +
      '</div>' +
    '</div>' +
  '</article>';
}
