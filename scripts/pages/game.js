
import { isLoggedIn, currentUser, updateProfile } from '../auth.js';
import { addPromo } from '../api.js';
import { toast } from '../ui.js';
import { uid } from '../utils.js';
let SECTORS = [
  { label: '100₽',    value: 100,  type: 'bonus',  color: '#4f46e5' },
  { label: '0',       value: 0,    type: 'none',   color: '#94a3b8' },
  { label: '300₽',    value: 300,  type: 'bonus',  color: '#7c3aed' },
  { label: '-15%',    value: 15,   type: 'promo',  code: 'GAME15', desc: 'Скидка 15%', color: '#db2777' },
  { label: '500₽',    value: 500,  type: 'bonus',  color: '#059669' },
  { label: '0',       value: 0,    type: 'none',   color: '#94a3b8' },
  { label: '1000₽',   value: 1000, type: 'bonus',  color: '#f59e0b' },
  { label: 'FreeShip', value: 0,   type: 'promo',  code: 'FREESHIP', desc: 'Бесплатная доставка', color: '#0891b2' },
];
let ATTEMPTS_PER_USER = 3;
function getAttempts() {
  let user = currentUser();
  let key = user ? 'gameAttempts_' + user.id : 'gameAttempts_guest';
  return Number(localStorage.getItem(key) || ATTEMPTS_PER_USER);
}
function setAttempts(value) {
  let user = currentUser();
  let key = user ? 'gameAttempts_' + user.id : 'gameAttempts_guest';
  localStorage.setItem(key, value);
}
export function renderGame() {
  let app = document.getElementById('app');
  let attempts = getAttempts();
  let loggedIn = isLoggedIn();
  app.innerHTML = `
    <div class="container section">
      <nav class="breadcrumbs"><a href="#/">Главная</a><span class="sep">/</span><span>Игра</span></nav>
      <div class="game">
        <h1 class="section-title" style="justify-content:center">🎡 Колесо Фортуны</h1>
        <p class="muted" style="margin-bottom:8px">Крутите колесо и выигрывайте бонусы или промокоды на покупки!</p>
        <div class="game__attempts" id="attempts-display">🎯 Осталось попыток: ${attempts}</div>
        <div class="game__area">
          <div class="game__wheel-wrap">
            <div id="pointer" style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:26px solid var(--danger);z-index:5;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));"></div>
            <svg class="game__wheel" id="wheel" viewBox="0 0 200 200" style="transform: rotate(0deg); transition: transform 4s cubic-bezier(.17,.67,.32,1.01);">
              ${buildWheelSvg()}
              <circle cx="100" cy="100" r="14" fill="#1b2030" />
              <circle cx="100" cy="100" r="6" fill="#fff" />
            </svg>
          </div>
          <button class="btn" id="spin-btn" style="font-size:1.1rem;padding:14px 36px" ${attempts === 0 ? 'disabled' : ''}>
            ${attempts > 0 ? '🎲 Крутить колесо' : 'Попытки закончились'}
          </button>
        </div>
        <div class="game__prizes">
          <div class="game__prize"><div style="font-size:1.5rem">🎁</div><strong>Бонусы</strong><div class="muted" style="font-size:.8rem">Зачисляем на счёт</div></div>
          <div class="game__prize"><div style="font-size:1.5rem">🏷️</div><strong>Промокоды</strong><div class="muted" style="font-size:.8rem">Скидка на заказ</div></div>
          <div class="game__prize"><div style="font-size:1.5rem">🚚</div><strong>Беспл. доставка</strong><div class="muted" style="font-size:.8rem">Для любого заказа</div></div>
          <div class="game__prize"><div style="font-size:1.5rem">💰</div><strong>До 1000₽</strong><div class="muted" style="font-size:.8rem">Главный приз</div></div>
        </div>
        ${!loggedIn ? `<p class="muted" style="margin-top:16px">⚠️ <a href="#/login?redirect=/game">Войдите</a>, чтобы выигрыши сохранились в личном кабинете.</p>` : ''}
      </div>
    </div>
  `;
  document.getElementById('spin-btn').addEventListener('click', spin);
}
function buildWheelSvg() {
  let cx = 100, cy = 100, r = 90;
  let sectorAngle = 360 / SECTORS.length;
  return SECTORS.map((s, i) => {
    let startAngle = i * sectorAngle - 90; 
    let endAngle = (i + 1) * sectorAngle - 90;
    let startRad = (startAngle * Math.PI) / 180;
    let endRad = (endAngle * Math.PI) / 180;
    let x1 = cx + r * Math.cos(startRad);
    let y1 = cy + r * Math.sin(startRad);
    let x2 = cx + r * Math.cos(endRad);
    let y2 = cy + r * Math.sin(endRad);
    let midAngle = (startAngle + endAngle) / 2;
    let midRad = (midAngle * Math.PI) / 180;
    let tx = cx + (r * 0.6) * Math.cos(midRad);
    let ty = cy + (r * 0.6) * Math.sin(midRad);
    let path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
    return `
      <path d="${path}" fill="${s.color}" stroke="#fff" stroke-width="2" />
      <text x="${tx}" y="${ty}" fill="#fff" font-size="11" font-weight="700"
            text-anchor="middle" dominant-baseline="middle"
            transform="rotate(${midAngle + 90} ${tx} ${ty})">${s.label}</text>
    `;
  }).join('');
}
let spinning = false;
let totalRotation = 0; 
async function spin() {
  if (spinning) return;
  let attempts = getAttempts();
  if (attempts <= 0) {
    toast('Попытки закончились', 'warning');
    return;
  }
  spinning = true;
  attempts -= 1;
  setAttempts(attempts);
  let btn = document.getElementById('spin-btn');
  btn.disabled = true;
  document.getElementById('attempts-display').textContent = `🎯 Осталось попыток: ${attempts}`;
  let winnerIndex = Math.floor(Math.random() * SECTORS.length);
  let sectorAngle = 360 / SECTORS.length;
  let targetInRotation = (360 - (winnerIndex * sectorAngle + sectorAngle / 2));
  let currentMod = ((totalRotation % 360) + 360) % 360;
  let neededMod = ((targetInRotation % 360) + 360) % 360;
  let delta = neededMod - currentMod;
  if (delta < 0) delta += 360;
  totalRotation += 360 * 5 + delta;
  let wheel = document.getElementById('wheel');
  wheel.style.transform = `rotate(${totalRotation}deg)`;
  await new Promise((r) => setTimeout(r, 4200));
  let prize = SECTORS[winnerIndex];
  announcePrize(prize);
  btn.disabled = attempts === 0;
  btn.textContent = attempts > 0 ? '🎲 Крутить ещё раз' : 'Попытки закончились';
  spinning = false;
}
function announcePrize(prize) {
  if (prize.type === 'none') {
    toast('В этот раз не повезло 😅 Попробуйте ещё!', 'info', 3000);
    return;
  }
  if (isLoggedIn()) {
    if (prize.type === 'bonus') {
      let user = currentUser();
      updateProfile({ bonuses: (user.bonuses || 0) + prize.value });
      toast(`🎉 Вы выиграли ${prize.value} бонусов!`, 'success', 3500);
    } else if (prize.type === 'promo') {
      let code = prize.code + '-' + uid().slice(0, 4).toUpperCase();
      addPromo({
        code,
        description: prize.desc,
        expires: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      });
      toast(`🎉 Вы выиграли промокод: ${code}`, 'success', 4000);
    }
  } else {
    toast(`🎉 Вы выиграли: ${prize.label}. Войдите, чтобы сохранить.`, 'warning', 3500);
  }
}
