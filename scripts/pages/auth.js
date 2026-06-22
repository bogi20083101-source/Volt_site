import { login, register, validators } from '../auth.js';
import { getQueryParam } from '../utils.js';
import { toast } from '../ui.js';
export function renderLogin() {
  return renderAuthForm('login');
}
export function renderRegister() {
  return renderAuthForm('register');
}
function renderAuthForm(mode) {
  let app = document.getElementById('app');
  let redirect = getQueryParam('redirect') || '/profile';
  let isLogin = mode === 'login';
  app.innerHTML = '<div class="auth">' +
    '<h1>' + (isLogin ? 'Вход в аккаунт' : 'Регистрация') + '</h1>' +
    '<p class="auth__subtitle">' + (isLogin ? 'Рады видеть вас снова!' : 'Создайте аккаунт за минуту') + '</p>' +
    '<form id="auth-form" novalidate>' +
      (isLogin ? '' :
        '<div class="field">' +
          '<label for="name">Имя <span class="req">*</span></label>' +
          '<input class="input" type="text" id="name" name="name" placeholder="Как к вам обращаться?" autocomplete="name" />' +
          '<span class="field-error" data-error="name"></span>' +
        '</div>') +
      '<div class="field">' +
        '<label for="email">Email <span class="req">*</span></label>' +
        '<input class="input" type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" />' +
        '<span class="field-error" data-error="email"></span>' +
      '</div>' +
      '<div class="field">' +
        '<label for="password">Пароль <span class="req">*</span></label>' +
        '<input class="input" type="password" id="password" name="password" placeholder="Минимум 6 символов" autocomplete="' + (isLogin ? 'current-password' : 'new-password') + '" />' +
        '<span class="field-error" data-error="password"></span>' +
      '</div>' +
      (isLogin ? '' :
        '<div class="field">' +
          '<label for="password2">Повтор пароля <span class="req">*</span></label>' +
          '<input class="input" type="password" id="password2" name="password2" placeholder="Ещё раз" autocomplete="new-password" />' +
          '<span class="field-error" data-error="password2"></span>' +
        '</div>') +
      '<button type="submit" class="btn btn-block" id="auth-submit">' + (isLogin ? 'Войти' : 'Зарегистрироваться') + '</button>' +
    '</form>' +
    '<div class="auth__switch">' +
      (isLogin ? 'Нет аккаунта? <a href="#/register">Зарегистрироваться</a>' : 'Уже есть аккаунт? <a href="#/login">Войти</a>') +
    '</div>' +
    (isLogin ?
      '<div class="auth__demo">' +
        '🔑 <strong>Доступ для преподавателя:</strong><br>' +
        'Логин: liubovsheyda@gmail.com<br>' +
        'Пароль: Teacher_2026' +
      '</div>' : '') +
  '</div>';
  bindForm(mode, redirect);
}
function setError(name, message) {
  let el = document.querySelector('[data-error="' + name + '"]');
  let input = document.getElementById(name);
  if (el) el.textContent = message || '';
  if (input) input.classList.toggle('is-invalid', !!message);
}
function clearErrors() {
  document.querySelectorAll('[data-error]').forEach(function(e) { e.textContent = ''; });
  document.querySelectorAll('.is-invalid').forEach(function(e) { e.classList.remove('is-invalid'); });
}
function bindForm(mode, redirect) {
  let form = document.getElementById('auth-form');
  let isLogin = mode === 'login';
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    let fd = new FormData(form);
    let data = {
      name: (fd.get('name') || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      password: (fd.get('password') || '').toString(),
      password2: (fd.get('password2') || '').toString(),
    };
    let valid = true;
    if (!isLogin) {
      let nameErr = validators.name(data.name);
      if (nameErr) { setError('name', nameErr); valid = false; }
    }
    let emailErr = validators.email(data.email);
    if (emailErr) { setError('email', emailErr); valid = false; }
    let passErr = validators.password(data.password);
    if (passErr) { setError('password', passErr); valid = false; }
    if (!isLogin && data.password !== data.password2) {
      setError('password2', 'Пароли не совпадают');
      valid = false;
    }
    if (!valid) return;
    let submitBtn = document.getElementById('auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Подождите...';
    let result = isLogin
      ? await login({ email: data.email, password: data.password })
      : await register({ name: data.name, email: data.email, password: data.password });
    if (!result.ok) {
      setError('email', result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
      return;
    }
    setTimeout(function() {
      location.hash = redirect.startsWith('/') ? '#' + redirect : '#/';
    }, 600);
  });
  let emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      let err = validators.email(emailInput.value.trim());
      setError('email', err);
    });
  }
}
