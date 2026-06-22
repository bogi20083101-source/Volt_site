import { getState, setState } from './store.js';
import { findUserByEmail, saveUser, updateUser } from './api.js';
let TEACHER_EMAIL = 'liubovsheyda@gmail.com';
export let validators = {
  name: function(value) {
    if (!value || value.trim().length < 2) {
      return 'Имя должно быть не короче 2 символов';
    }
    return '';
  },
  email: function(value) {
    if (!value) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email';
    return '';
  },
  password: function(value) {
    if (!value) return 'Введите пароль';
    if (value.length < 6) return 'Пароль должен быть не короче 6 символов';
    return '';
  }
};
export function initAuth() {
  let existing = findUserByEmail(TEACHER_EMAIL);
  if (!existing) {
    saveUser({
      id: 'u_teacher',
      name: 'Преподаватель',
      email: TEACHER_EMAIL,
      password: 'Teacher_2026',
      phone: '',
      address: 'Не указан',
      bonuses: 0,
    });
  }
}
export function login(credentials) {
  let user = findUserByEmail(credentials.email);
  if (!user) {
    return { ok: false, error: 'Пользователь не найден' };
  }
  if (user.password !== credentials.password) {
    return { ok: false, error: 'Неверный пароль' };
  }
  setState({ user: user, token: makeToken(user) });
  return { ok: true };
}
export function register(data) {
  if (findUserByEmail(data.email)) {
    return { ok: false, error: 'Email уже зарегистрирован' };
  }
  let user = {
    id: 'u_' + Date.now(),
    name: data.name,
    email: data.email,
    password: data.password,
    phone: '',
    address: 'Не указан',
    bonuses: 0,
  };
  saveUser(user);
  setState({ user: user, token: makeToken(user) });
  return { ok: true };
}
export function logout() {
  setState({ user: null, token: null });
}
export function currentUser() {
  return getState().user;
}
export function isLoggedIn() {
  return !!getState().user;
}
export function updateProfile(patch) {
  let user = getState().user;
  if (!user) return;
  let updated = {};
  for (let key in user) {
    updated[key] = user[key];
  }
  for (let key in patch) {
    updated[key] = patch[key];
  }
  updateUser(updated);
  setState({ user: updated });
}
function makeToken(user) {
  let payload = {
    id: user.id,
    email: user.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  return btoa(JSON.stringify(payload));
}
