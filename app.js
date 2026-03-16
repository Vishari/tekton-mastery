/* ============================
   TEKTON ACCOUNT MASTERY — APP
   ============================ */

'use strict';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const MAX_TARGETS = 5;
const STORAGE_KEY = 'tekton_mastery_v1';

const LEVEL_COLORS = ['#5ed45a','#334bd3','#b861e0','#e65064','#e8a020'];
const LEVEL_NAMES  = ['Prospecting','Engaged','Evaluating','Committed','Secured'];

const DEFAULT_LEVELS = [
  {
    name: 'Prospecting',
    description: 'Making first contact',
    milestones: [
      'Initial contact made (call / email / visit)',
      'Key decision-maker(s) identified',
      'Company profile and contacts entered into HubSpot',
    ]
  },
  {
    name: 'Engaged',
    description: 'Relationship building',
    milestones: [
      'Pain points with current supplier identified',
      'Rough annual revenue estimated',
      'In-person meeting or demo scheduled',
    ]
  },
  {
    name: 'Evaluating',
    description: 'Presenting the solution',
    milestones: [
      'Demo completed',
      'Product evaluation debrief',
      'Follow-up call or visit completed',
    ]
  },
  {
    name: 'Committed',
    description: 'Closing the deal',
    milestones: [
      'New Customer Information From completed',
      'First order placed by customer',
      'Update HubSpot customer data',
    ]
  },
  {
    name: 'Secured',
    description: 'Account Secured',
    milestones: [
      'Second order placed by customer',
      'Account onboarded and trained',
      'Exclusive Tekton Customer',
    ]
  }
];

// ─── STATE ────────────────────────────────────────────────────────────────────

let state = {
  targets: Array(MAX_TARGETS).fill(null),  // array of account|null
  bench:   [],
  secured: [],
  levels:  JSON.parse(JSON.stringify(DEFAULT_LEVELS)),
};

// account shape:
// {
//   id: string,
//   company: string,
//   contact: string,
//   location: string,
//   notes: string,
//   level: 0-4 (index),
//   milestones: [ [bool, bool, bool], [bool, ...], ... ] per level
//   createdAt: ISO string,
//   securedAt: ISO string | null,
//   addedToTargets: ISO string | null,
// }

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge carefully — preserve structure
      if (saved.targets) state.targets = saved.targets;
      if (saved.bench)   state.bench   = saved.bench;
      if (saved.secured) state.secured  = saved.secured;
      if (saved.levels)  state.levels   = saved.levels;
    }
  } catch(e) {}
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}
function levelColor(idx) { return LEVEL_COLORS[idx] || LEVEL_COLORS[0]; }
function levelName(idx)  { return state.levels[idx]?.name || LEVEL_NAMES[idx] || ''; }

// milestone completion for an account's current level
function levelMilestonesDone(account) {
  const ms = account.milestones[account.level] || [];
  return ms.filter(Boolean).length;
}
function levelMilestonesTotal(account) {
  return (state.levels[account.level]?.milestones || []).length;
}
function levelComplete(account) {
  const done  = levelMilestonesDone(account);
  const total = levelMilestonesTotal(account);
  return total > 0 && done >= total;
}
function isFullySecured(account) {
  return account.level === 4 && levelComplete(account);
}

// Ensure account milestones array is synced with level config
function normalizeMilestones(account) {
  if (!account.milestones) account.milestones = [];
  for (let l = 0; l < 5; l++) {
    const needed = (state.levels[l]?.milestones || []).length;
    if (!account.milestones[l]) account.milestones[l] = [];
    while (account.milestones[l].length < needed) account.milestones[l].push(false);
  }
}

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────

function makeMasteryDots(account) {
  let html = '<div class="mastery-dots">';
  for (let i = 0; i < 5; i++) {
    const col = levelColor(i);
    let cls = 'mdot';
    if (i < account.level) cls += ' done';
    else if (i === account.level) cls += ' partial';
    const bg = i <= account.level ? col : '';
    const opacity = i < account.level ? '1' : i === account.level ? '0.4' : '';
    html += `<div class="${cls}" style="background:${bg || 'var(--bg4)'};opacity:${opacity || 1}"></div>`;
  }
  html += '</div>';
  return html;
}

function makeLevelBadge(account) {
  const col = levelColor(account.level);
  const name = levelName(account.level);
  return `<div class="level-badge">
    <div class="level-badge-num" style="background:${col}22;color:${col}">L${account.level+1}</div>
    <div class="level-badge-label">${name}</div>
  </div>`;
}

function makeMilestoneBar(account) {
  const done  = levelMilestonesDone(account);
  const total = levelMilestonesTotal(account);
  const pct   = total ? Math.round((done/total)*100) : 0;
  const col   = levelColor(account.level);
  return `<div class="milestone-bar">
    <div class="milestone-fill" style="width:${pct}%;background:${col}"></div>
  </div>`;
}

function renderAccountCard(account, slotIdx) {
  const col = levelColor(account.level);
  const done  = levelMilestonesDone(account);
  const total = levelMilestonesTotal(account);
  return `
    <div class="account-card" data-id="${account.id}" data-slot="${slotIdx}" onclick="openAccount('${account.id}')">
      <div class="card-level-strip" style="background:${col}"></div>
      <div class="card-top">
        <div>
          <div class="card-company">${esc(account.company)}</div>
          ${account.contact ? `<div class="card-contact">${esc(account.contact)}</div>` : ''}
          ${account.location ? `<div class="card-location">${esc(account.location)}</div>` : ''}
        </div>
        ${makeLevelBadge(account)}
      </div>
      ${makeMasteryDots(account)}
      ${makeMilestoneBar(account)}
      <div class="card-footer">
        <div class="card-milestones-done">${done} / ${total} milestones</div>
        <svg class="card-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>`;
}

function renderEmptySlot(slotIdx) {
  return `
    <div class="slot-empty" onclick="addToSlot(${slotIdx})">
      <div class="slot-num">${slotIdx+1}</div>
      <div class="slot-empty-label">Open pursuit slot</div>
      <div class="slot-add-icon">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9 6v6M6 9h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>`;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────

function renderTargets() {
  const el = document.getElementById('targets-list');
  let html = '';
  for (let i = 0; i < MAX_TARGETS; i++) {
    const acc = state.targets[i];
    html += acc ? renderAccountCard(acc, i) : renderEmptySlot(i);
  }
  el.innerHTML = html;
}

function renderBench() {
  const list  = document.getElementById('bench-list');
  const empty = document.getElementById('bench-empty');
  if (!state.bench.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = state.bench.map(a => renderAccountCard(a, -1)).join('');
}

function renderSecured() {
  const list  = document.getElementById('maintenance-list');
  const empty = document.getElementById('maintenance-empty');
  if (!state.secured.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = state.secured.map(renderSecuredCard).join('');
}

function renderSecuredCard(account) {
  return `
    <div class="secured-card" onclick="openSecured('${account.id}')">
      <div class="secured-top">
        <div class="secured-company">${esc(account.company)}</div>
        <div class="secured-star">Secured</div>
      </div>
      <div class="secured-meta">${esc(account.contact)}${account.location ? ' · ' + esc(account.location) : ''}</div>
      <div class="secured-secured-date">Secured ${fmtDate(account.securedAt)}</div>
      ${account.notes ? `<div class="secured-notes">${esc(account.notes)}</div>` : ''}
    </div>`;
}

function renderAll() {
  renderTargets();
  renderBench();
  renderSecured();
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    const view = document.getElementById('view-' + tab.dataset.view);
    if (view) view.classList.add('active');
  });
});

// ─── ADD TO SLOT ──────────────────────────────────────────────────────────────

let pendingSlotIdx = null;

window.addToSlot = function(slotIdx) {
  // Check if there are benched accounts to pick from
  if (state.bench.length > 0) {
    openSlotPicker(slotIdx);
  } else {
    // Just open add form for new account
    openEditModal(null, slotIdx);
  }
};

function openSlotPicker(slotIdx) {
  pendingSlotIdx = slotIdx;
  const listEl = document.getElementById('slot-list');
  let html = '';
  // Option: add a new account
  html += `<div class="slot-option" onclick="newAccountInSlot(${slotIdx})">
    <div>
      <div class="slot-option-label">Add new account</div>
      <div class="slot-option-sub">Create a fresh prospect</div>
    </div>
    <div class="slot-option-arrow">→</div>
  </div>`;
  // Options: benched accounts
  state.bench.forEach(a => {
    html += `<div class="slot-option" onclick="benchToTarget('${a.id}',${slotIdx})">
      <div>
        <div class="slot-option-label">${esc(a.company)}</div>
        <div class="slot-option-sub">L${a.level+1} · ${levelName(a.level)} — from bench</div>
      </div>
      <div class="slot-option-arrow">→</div>
    </div>`;
  });
  listEl.innerHTML = html;
  document.getElementById('modal-slot').classList.remove('hidden');
}

window.newAccountInSlot = function(slotIdx) {
  closeModal('modal-slot');
  openEditModal(null, slotIdx);
};

window.benchToTarget = function(accountId, slotIdx) {
  closeModal('modal-slot');
  const idx = state.bench.findIndex(a => a.id === accountId);
  if (idx === -1) return;
  const account = state.bench.splice(idx, 1)[0];

  // If slot is occupied, swap current target to bench
  if (state.targets[slotIdx]) {
    state.bench.push(state.targets[slotIdx]);
  }
  state.targets[slotIdx] = account;
  saveState();
  renderAll();
};

document.getElementById('slot-cancel').addEventListener('click', () => closeModal('modal-slot'));

// ─── OPEN ACCOUNT DETAIL ──────────────────────────────────────────────────────

window.openAccount = function(accountId) {
  const account = findAccount(accountId);
  if (!account) return;
  normalizeMilestones(account);
  renderAccountDetail(account);
  document.getElementById('modal-account').classList.remove('hidden');
};

function findAccount(id) {
  for (const a of state.targets) { if (a && a.id === id) return a; }
  for (const a of state.bench)   { if (a.id === id) return a; }
  return null;
}

function renderAccountDetail(account) {
  const col  = levelColor(account.level);
  const lvl  = state.levels[account.level];
  const done  = levelMilestonesDone(account);
  const total = levelMilestonesTotal(account);
  const complete = levelComplete(account);
  const isLast = account.level === 4;
  const inTargets = state.targets.some(a => a && a.id === account.id);

  // Level steps bar
  let stepsHtml = '<div class="level-steps">';
  for (let i = 0; i < 5; i++) {
    const c = levelColor(i);
    const cls = i < account.level ? 'lstep done' : i === account.level ? 'lstep current' : 'lstep';
    const bg  = i < account.level ? c : i === account.level ? c : '';
    stepsHtml += `<div class="${cls}" style="${bg ? 'background:'+bg : ''}"></div>`;
  }
  stepsHtml += '</div>';

  // Milestones
  let msHtml = '';
  (lvl?.milestones || []).forEach((mText, mi) => {
    const checked = account.milestones[account.level]?.[mi] || false;
    msHtml += `
      <div class="milestone-item" onclick="toggleMilestone('${account.id}',${account.level},${mi})">
        <div class="ms-check ${checked ? 'done' : ''}">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex-1">
          <div class="ms-text ${checked ? 'done' : ''}">${esc(mText)}</div>
        </div>
      </div>`;
  });

  // Promote button
  let promoteHtml = '';
  if (!isLast) {
    promoteHtml = `<button class="btn-promote" ${complete ? '' : 'disabled'}
      onclick="promoteAccount('${account.id}')"
      id="btn-promote-${account.id}">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${complete ? 'Advance to Level ' + (account.level+2) + ' — ' + levelName(account.level+1) : 'Complete all milestones to advance'}
    </button>`;
  } else {
    promoteHtml = `<button class="btn-promote btn-secure" ${complete ? '' : 'disabled'}
      onclick="secureAccount('${account.id}')"
      id="btn-promote-${account.id}">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l1.5 3 3.5.5-2.5 2.4.6 3.5L8 10l-3.1 1.4.6-3.5L3 5.5 6.5 5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      ${complete ? 'Secure This Account' : 'Complete all milestones to secure'}
    </button>`;
  }

  const html = `
    <div class="detail-level-bar" style="background:${col}"></div>
    <div class="detail-company">${esc(account.company)}</div>
    <div class="detail-meta">${esc(account.contact) || '<span style="color:var(--text3)">No contact added</span>'}</div>
    <div class="detail-location">${esc(account.location) || ''}</div>

    <div class="detail-level-row">
      <div class="detail-level-label">Level ${account.level+1} of 5</div>
      <div class="detail-level-name" style="color:${col}">${levelName(account.level)}</div>
    </div>
    ${stepsHtml}

    <div class="milestones-section">
      <div class="ms-heading">Level ${account.level+1} milestones — ${done}/${total}</div>
      ${msHtml}
    </div>

    ${account.notes ? `
    <div class="detail-notes-section">
      <div class="ms-heading">Notes</div>
      <div class="detail-notes-text">${esc(account.notes)}</div>
    </div>` : ''}

    ${promoteHtml}

    <div class="detail-actions" style="margin-top:${promoteHtml ? '12px' : '24px'}">
      <button class="btn-ghost" onclick="openEditModal('${account.id}')">Edit</button>
      ${inTargets ? `<button class="btn-ghost" onclick="moveToBench('${account.id}')">→ Bench</button>` : `<button class="btn-ghost" onclick="openSlotPickerForBench('${account.id}')">→ Targets</button>`}
      <button class="btn-danger" onclick="confirmDelete('${account.id}')">Delete</button>
    </div>
  `;

  document.getElementById('modal-account-content').innerHTML = html;
}

// ─── TOGGLE MILESTONE ─────────────────────────────────────────────────────────

window.toggleMilestone = function(accountId, level, mi) {
  const account = findAccount(accountId);
  if (!account) return;
  normalizeMilestones(account);
  account.milestones[level][mi] = !account.milestones[level][mi];
  saveState();
  renderAll();
  renderAccountDetail(account); // refresh detail
};

// ─── PROMOTE / SECURE ─────────────────────────────────────────────────────────

window.promoteAccount = function(accountId) {
  const account = findAccount(accountId);
  if (!account || !levelComplete(account) || account.level >= 4) return;
  account.level++;
  normalizeMilestones(account);
  saveState();
  renderAll();
  renderAccountDetail(account);
};

window.secureAccount = function(accountId) {
  const account = findAccount(accountId);
  if (!account || !isFullySecured(account)) return;
  closeModal('modal-account');
  // Move to secured
  account.securedAt = new Date().toISOString();
  // Remove from wherever it was
  for (let i = 0; i < state.targets.length; i++) {
    if (state.targets[i] && state.targets[i].id === accountId) {
      state.targets[i] = null; break;
    }
  }
  const bi = state.bench.findIndex(a => a.id === accountId);
  if (bi > -1) state.bench.splice(bi, 1);
  state.secured.unshift(account);
  saveState();
  renderAll();
  // Switch to secured tab
  document.querySelector('[data-view="maintenance"]')?.click();
};

// ─── BENCH / RESTORE ──────────────────────────────────────────────────────────

window.moveToBench = function(accountId) {
  closeModal('modal-account');
  for (let i = 0; i < state.targets.length; i++) {
    if (state.targets[i] && state.targets[i].id === accountId) {
      state.bench.push(state.targets[i]);
      state.targets[i] = null;
      break;
    }
  }
  saveState();
  renderAll();
};

window.openSlotPickerForBench = function(accountId) {
  closeModal('modal-account');
  // Find first empty slot
  const emptySlot = state.targets.findIndex(a => a === null);
  if (emptySlot > -1) {
    benchToTarget(accountId, emptySlot);
  } else {
    // All slots full — open slot picker to swap
    pendingSlotBenchId = accountId;
    openSlotPickerSwap(accountId);
  }
};

let pendingSlotBenchId = null;

function openSlotPickerSwap(accountId) {
  const listEl = document.getElementById('slot-list');
  let html = `<p class="confirm-msg" style="margin-bottom:12px">All target slots are full. Choose one to swap with the bench account:</p>`;
  state.targets.forEach((a, i) => {
    if (!a) return;
    html += `<div class="slot-option" onclick="swapWithTarget('${accountId}',${i})">
      <div>
        <div class="slot-option-label">${esc(a.company)}</div>
        <div class="slot-option-sub">Slot ${i+1} — L${a.level+1} · ${levelName(a.level)}</div>
      </div>
      <div class="slot-option-arrow">⇄</div>
    </div>`;
  });
  listEl.innerHTML = html;
  document.getElementById('modal-slot').classList.remove('hidden');
}

window.swapWithTarget = function(benchId, targetSlot) {
  closeModal('modal-slot');
  const bi = state.bench.findIndex(a => a.id === benchId);
  if (bi === -1) return;
  const benchAcc = state.bench.splice(bi, 1)[0];
  if (state.targets[targetSlot]) state.bench.push(state.targets[targetSlot]);
  state.targets[targetSlot] = benchAcc;
  saveState();
  renderAll();
};

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

let editingId   = null;
let editingSlot = null;

window.openEditModal = function(accountId, slotIdx) {
  if (document.getElementById('modal-account')) closeModal('modal-account');
  editingId   = accountId || null;
  editingSlot = slotIdx !== undefined ? slotIdx : null;

  const account = accountId ? findAccount(accountId) : null;
  document.getElementById('edit-title').textContent = account ? 'Edit Account' : 'Add Account';
  document.getElementById('edit-company').value  = account?.company  || '';
  document.getElementById('edit-contact').value  = account?.contact  || '';
  document.getElementById('edit-location').value = account?.location || '';
  document.getElementById('edit-notes').value    = account?.notes    || '';
  document.getElementById('modal-edit').classList.remove('hidden');
  setTimeout(() => document.getElementById('edit-company').focus(), 150);
};

document.getElementById('edit-cancel').addEventListener('click', () => closeModal('modal-edit'));
document.getElementById('edit-save').addEventListener('click', saveEdit);

function saveEdit() {
  const company  = document.getElementById('edit-company').value.trim();
  const contact  = document.getElementById('edit-contact').value.trim();
  const location = document.getElementById('edit-location').value.trim();
  const notes    = document.getElementById('edit-notes').value.trim();

  if (!company) {
    document.getElementById('edit-company').focus();
    document.getElementById('edit-company').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('edit-company').style.borderColor = '';

  if (editingId) {
    // Update existing
    const account = findAccount(editingId);
    if (account) {
      account.company  = company;
      account.contact  = contact;
      account.location = location;
      account.notes    = notes;
    }
  } else {
    // Create new
    const account = {
      id: uid(),
      company, contact, location, notes,
      level: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
      securedAt: null,
    };
    normalizeMilestones(account);

    // Place in target slot
    const slot = editingSlot !== null ? editingSlot : state.targets.findIndex(a => a === null);
    if (slot > -1 && slot < MAX_TARGETS) {
      state.targets[slot] = account;
    } else {
      state.bench.push(account);
    }
  }

  saveState();
  renderAll();
  closeModal('modal-edit');
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

window.confirmDelete = function(accountId) {
  const account = findAccount(accountId);
  if (!account) return;
  closeModal('modal-account');
  openConfirm(
    'Delete Account?',
    `This will permanently remove "${account.company}" and all progress. This cannot be undone.`,
    () => {
      for (let i = 0; i < state.targets.length; i++) {
        if (state.targets[i] && state.targets[i].id === accountId) {
          state.targets[i] = null; break;
        }
      }
      const bi = state.bench.findIndex(a => a.id === accountId);
      if (bi > -1) state.bench.splice(bi, 1);
      saveState();
      renderAll();
    }
  );
};

// ─── SECURED DETAIL ───────────────────────────────────────────────────────────

window.openSecured = function(accountId) {
  const account = state.secured.find(a => a.id === accountId);
  if (!account) return;
  normalizeMilestones(account);

  let msHtml = '';
  state.levels[4]?.milestones?.forEach(m => {
    msHtml += `<div class="maintenance-item">
      <div class="ms-check-green">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="ms-text done">${esc(m)}</div>
    </div>`;
  });

  const html = `
    <div class="detail-level-bar" style="background:var(--green)"></div>
    <div class="detail-company">${esc(account.company)}</div>
    <div class="detail-meta">${esc(account.contact) || ''}</div>
    <div class="detail-location">${esc(account.location) || ''}</div>
    <div style="margin:14px 0 20px">
      <span class="secured-star">✓ Account Secured</span>
      <span style="font-size:12px;color:var(--text3);margin-left:10px">${fmtDate(account.securedAt)}</span>
    </div>

    <div class="maintenance-section">
      <h3>Completed Milestones</h3>
      ${msHtml}
    </div>

    ${account.notes ? `
    <div class="maintenance-section">
      <h3>Notes</h3>
      <div class="detail-notes-text">${esc(account.notes)}</div>
    </div>` : ''}

    <div class="detail-actions">
      <button class="btn-ghost" onclick="editSecured('${account.id}')">Edit Notes</button>
      <button class="btn-danger" onclick="confirmDeleteSecured('${account.id}')">Remove</button>
    </div>
  `;

  document.getElementById('modal-account-content').innerHTML = html;
  document.getElementById('modal-account').classList.remove('hidden');
};

window.editSecured = function(accountId) {
  const account = state.secured.find(a => a.id === accountId);
  if (!account) return;
  closeModal('modal-account');
  editingId   = accountId;
  editingSlot = null;
  document.getElementById('edit-title').textContent = 'Edit Account';
  document.getElementById('edit-company').value  = account.company  || '';
  document.getElementById('edit-contact').value  = account.contact  || '';
  document.getElementById('edit-location').value = account.location || '';
  document.getElementById('edit-notes').value    = account.notes    || '';
  // Override save to update secured array
  document.getElementById('modal-edit').classList.remove('hidden');
  document.getElementById('edit-save').onclick = () => {
    account.company  = document.getElementById('edit-company').value.trim() || account.company;
    account.contact  = document.getElementById('edit-contact').value.trim();
    account.location = document.getElementById('edit-location').value.trim();
    account.notes    = document.getElementById('edit-notes').value.trim();
    saveState(); renderAll(); closeModal('modal-edit');
    document.getElementById('edit-save').onclick = saveEdit; // restore
  };
};

window.confirmDeleteSecured = function(accountId) {
  const account = state.secured.find(a => a.id === accountId);
  if (!account) return;
  closeModal('modal-account');
  openConfirm(
    'Remove Account?',
    `Remove "${account.company}" from secured accounts?`,
    () => {
      state.secured = state.secured.filter(a => a.id !== accountId);
      saveState(); renderAll();
    }
  );
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

document.getElementById('btn-settings').addEventListener('click', openSettings);

function openSettings() {
  renderSettings();
  document.getElementById('modal-settings').classList.remove('hidden');
}

function renderSettings() {
  const el = document.getElementById('settings-levels');
  let html = '';
  state.levels.forEach((lvl, li) => {
    const col = levelColor(li);
    html += `<div class="settings-level-block">
      <div class="settings-level-header">
        <div class="settings-level-dot" style="background:${col}"></div>
        <div class="settings-level-title">Level ${li+1}</div>
        <input class="settings-level-name-input" style="background:none;border:none;color:var(--text2);font-family:var(--font);font-size:13px;flex:1;text-align:right;outline:none;padding:0 0 0 8px"
          data-level="${li}" data-field="name" value="${esc(lvl.name)}" maxlength="30" />
      </div>
      <div class="settings-milestones" id="settings-ms-${li}">`;
    lvl.milestones.forEach((m, mi) => {
      html += `<div class="settings-ms-row" id="ms-row-${li}-${mi}">
        <input type="text" value="${esc(m)}" data-level="${li}" data-mi="${mi}" maxlength="100"
          onchange="updateMilestoneText(${li},${mi},this.value)" />
        <button class="settings-ms-del" onclick="deleteMilestone(${li},${mi})" title="Remove">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>`;
    });
    html += `</div>
      <button class="settings-add-ms" onclick="addMilestone(${li})">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add milestone
      </button>
    </div>`;
  });
  el.innerHTML = html;

  // Bind name inputs
  el.querySelectorAll('.settings-level-name-input').forEach(input => {
    input.addEventListener('change', e => {
      const li = parseInt(e.target.dataset.level);
      state.levels[li].name = e.target.value.trim() || state.levels[li].name;
    });
  });
}

window.updateMilestoneText = function(li, mi, val) {
  if (state.levels[li]) state.levels[li].milestones[mi] = val;
};
window.deleteMilestone = function(li, mi) {
  state.levels[li].milestones.splice(mi, 1);
  renderSettings();
};
window.addMilestone = function(li) {
  state.levels[li].milestones.push('New milestone');
  // Also extend all accounts
  [...state.targets, ...state.bench].forEach(a => {
    if (a) { normalizeMilestones(a); }
  });
  renderSettings();
};

document.getElementById('settings-save').addEventListener('click', () => {
  // Normalize all accounts with new milestone config
  [...state.targets, ...state.bench].forEach(a => {
    if (a) normalizeMilestones(a);
  });
  saveState();
  renderAll();
  closeModal('modal-settings');
});

document.getElementById('settings-reset').addEventListener('click', () => {
  openConfirm('Reset Milestones?', 'This will restore all default milestone names. Account progress will not be lost.', () => {
    state.levels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));
    saveState();
    renderSettings();
  });
});

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────

let confirmCallback = null;

function openConfirm(title, msg, onOk) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  confirmCallback = onOk;
  document.getElementById('modal-confirm').classList.remove('hidden');
}

document.getElementById('confirm-ok').addEventListener('click', () => {
  closeModal('modal-confirm');
  if (confirmCallback) { confirmCallback(); confirmCallback = null; }
});
document.getElementById('confirm-cancel').addEventListener('click', () => closeModal('modal-confirm'));

// ─── CLOSE MODALS ─────────────────────────────────────────────────────────────

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

// Tap overlay to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────

function boot() {
  loadState();

  // Normalize all accounts on load
  [...state.targets, ...state.bench].forEach(a => {
    if (a) normalizeMilestones(a);
  });

  renderAll();

  // Reveal app
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      app.classList.remove('hidden');
    }, 500);
  }, 900);
}

document.addEventListener('DOMContentLoaded', boot);

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
