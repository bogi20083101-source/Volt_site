let toastContainer = function() { return document.getElementById('toast-container'); };
export function toast(message, type, timeout) {
  type = type || 'info';
  timeout = timeout || 2800;
  let node = document.createElement('div');
  node.className = 'toast ' + type;
  let icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
  node.innerHTML = '<span class="icon">' + (icons[type] || icons.info) + '</span><span>' + message + '</span>';
  toastContainer().appendChild(node);
  setTimeout(function() {
    node.style.opacity = '0';
    node.style.transform = 'translateY(10px)';
    setTimeout(function() { node.remove(); }, 200);
  }, timeout);
}
export function openModal(opts) {
  return new Promise(function(resolve) {
    let overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + opts.title + '">' +
      '<div class="modal__header">' +
        '<h3 class="modal__title">' + opts.title + '</h3>' +
        '<button class="modal__close" data-close aria-label="Закрыть">×</button>' +
      '</div>' +
      '<div class="modal__body">' + opts.contentHtml + '</div>' +
    '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    function close(result) {
      document.body.style.overflow = '';
      overlay.remove();
      resolve(result);
    }
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target.hasAttribute('data-close')) close(null);
    });
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close(null);
    });
    overlay.addEventListener('click', function(e) {
      let btn = e.target.closest('[data-result]');
      if (btn) close(btn.dataset.result);
    });
    let firstInput = overlay.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
  });
}
export async function confirmDialog(message, confirmText) {
  confirmText = confirmText || 'Подтвердить';
  let contentHtml = '<p style="margin-bottom:20px;">' + message + '</p>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
      '<button class="btn btn-ghost" data-close>Отмена</button>' +
      '<button class="btn btn-danger" data-result="ok">' + confirmText + '</button>' +
    '</div>';
  let result = await openModal({ title: 'Подтверждение', contentHtml: contentHtml });
  return result === 'ok';
}
