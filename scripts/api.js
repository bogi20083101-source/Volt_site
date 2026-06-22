import { getState } from './store.js';
let DATA_URL = './data/products.json';
let _catalog = null;
let _categories = null;
export async function loadCatalog() {
  if (_catalog) return { products: _catalog, categories: _categories };
  let res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Не удалось загрузить каталог');
  let data = await res.json();
  _catalog = data.products;
  _categories = data.categories;
  return { products: _catalog, categories: _categories };
}
export async function getProduct(id) {
  let data = await loadCatalog();
  for (let i = 0; i < data.products.length; i++) {
    if (data.products[i].id === id) return data.products[i];
  }
  return null;
}
export async function queryProducts(params) {
  params = params || {};
  let data = await loadCatalog();
  let list = [];
  for (let i = 0; i < data.products.length; i++) {
    list.push(data.products[i]);
  }
  if (params.search) {
    let q = params.search.toLowerCase().trim();
    list = list.filter(function(p) {
      return p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
  }
  if (params.category && params.category !== 'all') {
    list = list.filter(function(p) { return p.category === params.category; });
  }
  if (params.brands && params.brands.length) {
    list = list.filter(function(p) { return params.brands.includes(p.brand); });
  }
  if (params.minPrice != null) list = list.filter(function(p) { return p.price >= params.minPrice; });
  if (params.maxPrice != null) list = list.filter(function(p) { return p.price <= params.maxPrice; });
  if (params.minRating != null) list = list.filter(function(p) { return p.rating >= params.minRating; });
  if (params.inStockOnly) list = list.filter(function(p) { return p.stock > 0; });
  if (params.onSale) list = list.filter(function(p) { return p.oldPrice; });
  if (params.tags) {
    for (let key in params.tags) {
      let val = params.tags[key];
      if (val) list = list.filter(function(p) { return p.tags && p.tags[key] === val; });
    }
  }
  let sorters = {
    popular: function(a, b) { return b.rating - a.rating; },
    'price-asc': function(a, b) { return a.price - b.price; },
    'price-desc': function(a, b) { return b.price - a.price; },
    'rating-desc': function(a, b) { return b.rating - a.rating; },
    newest: function(a, b) { return b.id - a.id; },
    'discount': function(a, b) { return (b.oldPrice ? b.oldPrice - b.price : 0) - (a.oldPrice ? a.oldPrice - a.price : 0); },
  };
  if (params.sort && sorters[params.sort]) {
    list.sort(sorters[params.sort]);
  }
  return list;
}
let LKEY_ORDERS = 'volt_orders';
let LKEY_REVIEWS = 'volt_reviews';
let LKEY_USERS = 'volt_users';
let LKEY_PROMOS = 'volt_promos';
function getUsers() {
  return JSON.parse(localStorage.getItem(LKEY_USERS) || '[]');
}
export function saveUser(user) {
  let users = getUsers();
  users.push(user);
  localStorage.setItem(LKEY_USERS, JSON.stringify(users));
}
export function findUserByEmail(email) {
  let users = getUsers();
  for (let i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === email.toLowerCase()) return users[i];
  }
  return undefined;
}
export function updateUser(updated) {
  let users = [];
  for (let i = 0; i < getUsers().length; i++) {
    let u = getUsers()[i];
    if (u.id === updated.id) users.push(updated);
    else users.push(u);
  }
  localStorage.setItem(LKEY_USERS, JSON.stringify(users));
}
export function getOrders() {
  return JSON.parse(localStorage.getItem(LKEY_ORDERS) || '[]');
}
export function addOrder(order) {
  let orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(LKEY_ORDERS, JSON.stringify(orders));
}
export function getUserOrders(userId) {
  let orders = getOrders();
  let result = [];
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].userId === userId) result.push(orders[i]);
  }
  return result;
}
let seedReviews = [
  { id: 'r1', productId: 1, author: 'Алексей', rating: 5, text: 'Отличный телефон, пользуюсь полгода — никаких нареканий.', date: '2025-03-12' },
  { id: 'r2', productId: 1, author: 'Марина', rating: 4, text: 'Хорошая модель, но батарея могла бы быть лучше.', date: '2025-04-02' },
  { id: 'r3', productId: 2, author: 'Игорь', rating: 5, text: 'Звук топ, шумодав работает отлично.', date: '2025-05-18' },
  { id: 'r4', productId: 3, author: 'Светлана', rating: 5, text: 'Тонкий, лёгкий, быстрый. Рекомендую!', date: '2025-02-25' },
];
function ensureReviewsSeed() {
  if (!localStorage.getItem(LKEY_REVIEWS)) {
    localStorage.setItem(LKEY_REVIEWS, JSON.stringify(seedReviews));
  }
}
export function getReviews(productId) {
  ensureReviewsSeed();
  let all = JSON.parse(localStorage.getItem(LKEY_REVIEWS) || '[]');
  let result = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].productId === productId) result.push(all[i]);
  }
  return result.sort(function(a, b) { return b.date.localeCompare(a.date); });
}
export function getAllReviews() {
  ensureReviewsSeed();
  return JSON.parse(localStorage.getItem(LKEY_REVIEWS) || '[]');
}
export function addReview(review) {
  let all = getAllReviews();
  all.push(review);
  localStorage.setItem(LKEY_REVIEWS, JSON.stringify(all));
}
export function updateReview(id, patch) {
  let all = getAllReviews();
  for (let i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      for (let key in patch) {
        all[i][key] = patch[key];
      }
    }
  }
  localStorage.setItem(LKEY_REVIEWS, JSON.stringify(all));
}
export function deleteReview(id) {
  let all = [];
  for (let i = 0; i < getAllReviews().length; i++) {
    if (getAllReviews()[i].id !== id) all.push(getAllReviews()[i]);
  }
  localStorage.setItem(LKEY_REVIEWS, JSON.stringify(all));
}
export function getPromos() {
  return JSON.parse(localStorage.getItem(LKEY_PROMOS) || '[]');
}
export function addPromo(promo) {
  let list = getPromos();
  list.unshift(promo);
  localStorage.setItem(LKEY_PROMOS, JSON.stringify(list));
}
export let VALID_PROMOS = {
  'WELCOME10': { type: 'percent', value: 10, label: '-10%' },
  'VOLT500': { type: 'fixed', value: 500, label: '-500₽' },
  'GAME15': { type: 'percent', value: 15, label: '-15%' },
  'FREESHIP': { type: 'shipping', value: 0, label: 'Бесплатная доставка' },
};
export let SHIPPING_COST = 350;
