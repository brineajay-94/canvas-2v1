function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function showElement(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.style.display = '';
}

function hideElement(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.style.display = 'none';
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const bg = type === 'success' ? '#3fb950' : type === 'error' ? '#f85149' : '#3b82f6';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 18px;border-radius:8px;font-size:13px;font-weight:500;color:#fff;background:' + bg + ';box-shadow:0 4px 16px rgba(0,0,0,0.4);max-width:340px;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showLoader(container) {
  container = typeof container === 'string' ? $(container) : container;
  if (!container) return;
  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.innerHTML = '<div class="spinner"></div>';
  container.appendChild(loader);
  return loader;
}

function hideLoader(loader) {
  if (loader) loader.remove();
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const POSITIONS = ['Principal', 'Founder', 'Teacher', 'Accountant', 'Staff', 'Admin'];

const RESULT_SHEETS = [
  { id: 'class11-management', name: 'Class 11 Management' },
  { id: 'class12-management', name: 'Class 12 Management' },
  { id: 'class11-science', name: 'Class 11 Science' },
  { id: 'class12-science', name: 'Class 12 Science' }
];

const PROGRAMS = [
  { id: 'plus2-management', name: 'Plus 2 (Management)', class: '11/12', faculty: 'Management' },
  { id: 'bba', name: 'BBA (RJU)', class: 'Bachelor', faculty: 'Management' },
  { id: 'bbs', name: 'BBS (TU)', class: 'Bachelor', faculty: 'Management' },
  { id: 'plus2-science', name: 'Plus 2 (Science)', class: '11/12', faculty: 'Science' }
];

const SUBJECTS_BY_PROGRAM = {
  'plus2-management': ['English', 'Nepali', 'Accountancy', 'Math/Social', 'Business Math', 'Hotel Management', 'Computer Science'],
  'plus2-science': ['English', 'Nepali', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Mathematics'],
  'bba': ['Marketing', 'Finance', 'HR', 'Business Law'],
  'bbs': ['Economics', 'Auditing', 'Taxation', 'Business Statistics']
};

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* ── Dirty-Form Confirm ── */
var __formDirty = false;

function trackFormDirty(formId) {
  var form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('input, textarea, select').forEach(function(el) {
    el.addEventListener('input', function() { __formDirty = true; });
    el.addEventListener('change', function() { __formDirty = true; });
  });
}

function closeWithConfirm(modalId) {
  if (__formDirty) {
    showConfirmDialog('You have unsaved changes. Are you sure you want to discard them?', function() {
      __formDirty = false;
      closeModal(modalId);
    });
  } else {
    closeModal(modalId);
  }
}

function resetDirty() { __formDirty = false; }

function preventOverlayClose(modalId, customFn) {
  var el = document.getElementById(modalId);
  if (!el) return;
  el.addEventListener('click', function(e) {
    if (e.target === this) {
      e.stopPropagation();
      if (customFn) customFn();
      else closeWithConfirm(modalId);
    }
  });
}

/* ── Custom Confirm Dialog ── */
function showConfirmDialog(msg, onConfirm, onCancel) {
  var overlay = document.getElementById('confirmOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirmOverlay';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML =
      '<div class="confirm-box">' +
        '<div class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>' +
        '<div class="confirm-msg"></div>' +
        '<div class="confirm-actions">' +
          '<button class="btn btn-secondary confirm-no">Cancel</button>' +
          '<button class="btn btn-danger confirm-yes">Discard</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) hideConfirm();
    });
    overlay.querySelector('.confirm-no').addEventListener('click', hideConfirm);
  }
  overlay.querySelector('.confirm-msg').textContent = msg;
  overlay.querySelector('.confirm-yes').onclick = function() {
    hideConfirm();
    if (onConfirm) onConfirm();
  };
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  function hideConfirm() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (onCancel) onCancel();
  }
}
