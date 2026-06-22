let STORAGE_KEY = 'volt_state_v1';
let PERSIST_KEYS = ['cart', 'favorites', 'compare', 'theme', 'visuallyImpaired', 'token', 'user', 'gameAttempts', 'recentlyViewed'];
function defaultState() {
  return {
    cart: [],
    favorites: [],
    compare: [],
    recentlyViewed: [],
    theme: 'light',
    visuallyImpaired: 'off',
    token: null,
    user: null,
    gameAttempts: 3,
  };
}
function loadState() {
  try {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let state = defaultState();
    for (let key in saved) {
      state[key] = saved[key];
    }
    return state;
  } catch (e) {
    return defaultState();
  }
}
let state = loadState();
let listeners = new Set();
function persist() {
  let slice = {};
  PERSIST_KEYS.forEach(function(k) { slice[k] = state[k]; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
}
export function subscribe(fn) {
  listeners.add(fn);
  return function() { listeners.delete(fn); };
}
function emit() {
  persist();
  listeners.forEach(function(fn) { fn(state); });
}
export function getState() { return state; }
export function get(key) { return state[key]; }
export function setState(patch) {
  let next = {};
  for (let key in state) {
    next[key] = state[key];
  }
  for (let key in patch) {
    next[key] = patch[key];
  }
  state = next;
  emit();
}
export let cart = {
  add: function(id, qty) {
    qty = qty || 1;
    let items = [];
    for (let i = 0; i < state.cart.length; i++) {
      items.push(state.cart[i]);
    }
    let found = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id) found = items[i];
    }
    if (found) found.qty += qty;
    else items.push({ id: id, qty: qty });
    setState({ cart: items });
  },
  setQty: function(id, qty) {
    if (qty <= 0) return cart.remove(id);
    let items = [];
    for (let i = 0; i < state.cart.length; i++) {
      items.push(state.cart[i]);
    }
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id) items[i].qty = qty;
    }
    setState({ cart: items });
  },
  remove: function(id) {
    let items = [];
    for (let i = 0; i < state.cart.length; i++) {
      if (state.cart[i].id !== id) items.push(state.cart[i]);
    }
    setState({ cart: items });
  },
  clear: function() {
    setState({ cart: [] });
  },
  count: function() {
    let sum = 0;
    for (let i = 0; i < state.cart.length; i++) {
      sum += state.cart[i].qty;
    }
    return sum;
  },
};
export let favorites = {
  toggle: function(id) {
    let list = [];
    let has = false;
    for (let i = 0; i < state.favorites.length; i++) {
      if (state.favorites[i] === id) has = true;
      else list.push(state.favorites[i]);
    }
    if (!has) list.push(id);
    setState({ favorites: list });
    return list.includes(id);
  },
  has: function(id) {
    return state.favorites.includes(id);
  },
};
export let compare = {
  toggle: function(id) {
    let list = [];
    let has = false;
    for (let i = 0; i < state.compare.length; i++) {
      if (state.compare[i] === id) has = true;
      else list.push(state.compare[i]);
    }
    if (!has) list.push(id);
    setState({ compare: list });
    return list.includes(id);
  },
  has: function(id) {
    return state.compare.includes(id);
  },
};
export let recentlyViewed = {
  add: function(id) {
    let list = [id];
    for (let i = 0; i < state.recentlyViewed.length; i++) {
      if (state.recentlyViewed[i] !== id) list.push(state.recentlyViewed[i]);
    }
    list = list.slice(0, 8);
    setState({ recentlyViewed: list });
  },
};
export let theme = {
  toggle: function() {
    setState({ theme: state.theme === 'light' ? 'dark' : 'light' });
    this.apply();
  },
  toggleVisuallyImpaired: function() {
    setState({ visuallyImpaired: state.visuallyImpaired === 'on' ? 'off' : 'on' });
    this.apply();
  },
  apply: function() {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.dataset.visuallyImpaired = state.visuallyImpaired;
  },
};
export let game = {
  decrementAttempt: function() {
    setState({ gameAttempts: Math.max(0, state.gameAttempts - 1) });
  },
};
