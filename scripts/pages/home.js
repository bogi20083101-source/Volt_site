import { loadCatalog, queryProducts } from '../api.js';
import { productCard } from '../components.js';
import { get } from '../store.js';
export async function renderHome() {
  let app = document.getElementById('app');
  app.innerHTML = `<div class="container section"><div class="spinner"></div></div>`;
  let { categories } = await loadCatalog();
  let popular = await queryProducts({ sort: 'popular' });
  let recent = get('recentlyViewed');
  let recentHtml = '';
  if (recent.length) {
    let { products } = await loadCatalog();
    let recentProducts = recent.map((id) => products.find((p) => p.id === id)).filter(Boolean);
    recentHtml = `
      <section class="section">
        <h2 class="section-title">Вы недавно смотрели</h2>
        <div class="scroller">${recentProducts.map(productCard).join('')}</div>
      </section>`;
  }
  app.innerHTML = `
    <section class="container">
      <div class="hero">
        <div>
          <h1 class="hero__title">Технологии, которые <span style="color:var(--accent)">впечатляют</span></h1>
          <p class="hero__text">Смартфоны, аудио, ноутбуки и гаджеты от ведущих брендов. Бесплатная доставка от 5000 ₽ и бонусы за каждую покупку.</p>
          <a href="#/catalog" class="btn" style="font-size:1.05rem;padding:14px 28px;">Перейти в каталог →</a>
        </div>
        <div class="hero__art">⚡</div>
      </div>
    </section>
    <section class="container">
      <div class="slider" id="promo-slider">
        <div class="slider__viewport">
          <div class="slider__track">
            <div class="slider__slide">
              <div class="slider__slide-content">
                <span class="slider__badge">🔥 Распродажа</span>
                <h3 class="slider__title">До -40% на смартфоны</h3>
                <p class="slider__text">Только до конца месяца — успейте обновить гаджет по суперцене.</p>
                <a href="#/catalog?category=smartphones&onSale=1" class="btn">Смотреть</a>
              </div>
              <div class="slider__slide-art">📱</div>
            </div>
            <div class="slider__slide">
              <div class="slider__slide-content">
                <span class="slider__badge">🎧 Новинка</span>
                <h3 class="slider__title">Беспроводной звук нового поколения</h3>
                <p class="slider__text">TWS-наушники с активным шумоподавлением по спеццене.</p>
                <a href="#/catalog?category=audio" class="btn">Выбрать</a>
              </div>
              <div class="slider__slide-art">🎧</div>
            </div>
            <div class="slider__slide">
              <div class="slider__slide-content">
                <span class="slider__badge">🎮 Игра</span>
                <h3 class="slider__title">Крути колесо — забирай промокод</h3>
                <p class="slider__text">Испытай удачу и получи бонусы до 1000 ₽ на покупки.</p>
                <a href="#/game" class="btn">Играть</a>
              </div>
              <div class="slider__slide-art">🎡</div>
            </div>
            <div class="slider__slide">
              <div class="slider__slide-content">
                <span class="slider__badge">💻 Для учёбы и работы</span>
                <h3 class="slider__title">Ноутбуки со скидкой до 25%</h3>
                <p class="slider__text">Ультрабуки, игровые и офисные модели для любых задач.</p>
                <a href="#/catalog?category=laptops" class="btn">Перейти</a>
              </div>
              <div class="slider__slide-art">💻</div>
            </div>
          </div>
        </div>
        <button class="slider__arrow slider__arrow--prev" data-slider-prev aria-label="Назад">‹</button>
        <button class="slider__arrow slider__arrow--next" data-slider-next aria-label="Вперёд">›</button>
        <div class="slider__nav" id="slider-dots"></div>
      </div>
    </section>
    <section class="container section">
      <h2 class="section-title">Популярные категории</h2>
      <div class="products-grid" data-view="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${categories.map((c) => `
          <a href="#/catalog?category=${c.slug}" class="product-card" style="text-align:center;padding:24px 12px;justify-content:center;align-items:center;">
            <div style="font-size:3rem;margin-bottom:10px;">${c.icon}</div>
            <div style="font-weight:600;color:var(--text)">${c.name}</div>
          </a>`).join('')}
      </div>
    </section>
    <section class="container section">
      <h2 class="section-title">Популярные товары</h2>
      <div class="scroller">${popular.slice(0, 10).map(productCard).join('')}</div>
    </section>
    ${recentHtml}
    <section class="container section">
      <div class="products-grid" data-view="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        <div class="product-card" style="padding:24px;text-align:center;align-items:center;">
          <div style="font-size:2.5rem">🚚</div><h3 style="margin:8px 0 4px">Быстрая доставка</h3>
          <p class="muted">По всей России за 1–3 дня</p>
        </div>
        <div class="product-card" style="padding:24px;text-align:center;align-items:center;">
          <div style="font-size:2.5rem">🔄</div><h3 style="margin:8px 0 4px">Возврат 14 дней</h3>
          <p class="muted">Без вопросов и переплат</p>
        </div>
        <div class="product-card" style="padding:24px;text-align:center;align-items:center;">
          <div style="font-size:2.5rem">🔒</div><h3 style="margin:8px 0 4px">Безопасная оплата</h3>
          <p class="muted">Защищённые платежи</p>
        </div>
        <div class="product-card" style="padding:24px;text-align:center;align-items:center;">
          <div style="font-size:2.5rem">🎁</div><h3 style="margin:8px 0 4px">Бонусы за покупки</h3>
          <p class="muted">Копи и трать на товары</p>
        </div>
      </div>
    </section>
  `;
  initSlider();
}
function initSlider() {
  let slider = document.getElementById('promo-slider');
  if (!slider) return;
  let track = slider.querySelector('.slider__track');
  let slides = slider.querySelectorAll('.slider__slide');
  let dotsContainer = document.getElementById('slider-dots');
  let current = 0;
  let timer;
  slides.forEach((_, i) => {
    let dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Слайд ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });
  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('.slider__dot').forEach((d, i) => d.classList.toggle('active', i === current));
    resetTimer();
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }
  slider.querySelector('[data-slider-next]').addEventListener('click', next);
  slider.querySelector('[data-slider-prev]').addEventListener('click', prev);
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', resetTimer);
  resetTimer();
}
