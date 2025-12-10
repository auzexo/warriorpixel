/* Wallet page logic
   - Uses localStorage to persist wallet state locally
   - Keeps counts of coins/gems/vouchers
   - Simple confirm modal before withdraw
*/

// keys
const STORAGE_KEY = 'wp_wallet_v1';

// default state
const defaultState = {
  balance: 0,
  coins: 25,
  gems: 1200,
  vouchers: 3,
  transactions: []
};

// helpers
function readState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {...defaultState};
  } catch(e){ return {...defaultState}; }
}
function writeState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// UI elements
const walletAmountEl = () => document.getElementById('walletAmount');
const coinsCountEl = () => document.getElementById('coinsCount');
const gemsCountEl = () => document.getElementById('gemsCount');
const vouchersCountEl = () => document.getElementById('vouchersCount');
const txnListEl = () => document.getElementById('txnList');

let state = readState();
function render(){
  if(walletAmountEl()) walletAmountEl().textContent = '₹' + state.balance;
  if(coinsCountEl()) coinsCountEl().textContent = state.coins;
  if(gemsCountEl()) gemsCountEl().textContent = state.gems;
  if(vouchersCountEl()) vouchersCountEl().textContent = state.vouchers;

  // render txns
  const list = txnListEl();
  if(list){
    list.innerHTML = '';
    if(state.transactions.length === 0){
      const li = document.createElement('li'); li.textContent = 'No transactions yet'; li.style.opacity = 0.7; list.appendChild(li);
    } else {
      state.transactions.slice().reverse().forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<div>${t.note}</div><div style="opacity:0.8">${t.time}</div>`;
        list.appendChild(li);
      });
    }
  }

  // keep WPData (global) in sync for header counters
  if(window.WPData){
    window.WPData.coins = state.coins;
    window.WPData.gems = state.gems;
    window.WPData.vouchers = state.vouchers;
  }
  // also update top header if present
  const topCoins = document.getElementById('coins-top');
  const topGems = document.getElementById('gems-top');
  const topVouchers = document.getElementById('vouchers-top');
  if(topCoins) topCoins.textContent = state.coins;
  if(topGems) topGems.textContent = state.gems;
  if(topVouchers) topVouchers.textContent = state.vouchers;
}

function pushTxn(note){
  state.transactions.push({ note, time: new Date().toLocaleString() });
  writeState(state);
  render();
}

// modal helpers
const modal = () => document.getElementById('modal');
const modalTitle = () => document.getElementById('modalTitle');
const modalBody = () => document.getElementById('modalBody');
const confirmBtn = () => document.getElementById('confirmBtn');
const cancelBtn = () => document.getElementById('cancelBtn');

function showModal(title, body, onConfirm){
  if(!modal()) return;
  modalTitle().textContent = title;
  modalBody().textContent = body;
  modal().classList.remove('hidden');

  const handleConfirm = () => { onConfirm(); closeModal(); };
  const handleCancel = () => { closeModal(); };

  confirmBtn().addEventListener('click', handleConfirm, {once:true});
  cancelBtn().addEventListener('click', handleCancel, {once:true});
}
function closeModal(){ if(modal()) modal().classList.add('hidden'); }

// actions
document.addEventListener('DOMContentLoaded', () => {
  render();

  const amountInput = document.getElementById('amountInput');
  const addBtn = document.getElementById('addMoneyBtn');
  const withdrawBtn = document.getElementById('withdrawMoneyBtn');
  const add100 = document.getElementById('add100Btn');
  const add500 = document.getElementById('add500Btn');
  const giveVoucher = document.getElementById('giveVoucherBtn');
  const clearTxns = document.getElementById('clearTxns');
  const exportTxns = document.getElementById('exportTxns');

  addBtn.addEventListener('click', () => {
    const amt = parseInt(amountInput.value,10);
    if(!amt || amt <= 0){ alert('Enter a positive amount'); return; }
    // confirm
    showModal('Add Money', `Add ₹${amt} to wallet?`, () => {
      state.balance += amt;
      pushTxn({ note: `+ ₹${amt} — Added` });
      writeState(state);
      render();
      amountInput.value = '';
    });
  });

  withdrawBtn.addEventListener('click', () => {
    const amt = parseInt(amountInput.value,10);
    if(!amt || amt <= 0){ alert('Enter a positive amount'); return; }
    if(amt > state.balance){ alert('Insufficient balance'); return; }
    showModal('Withdraw', `Withdraw ₹${amt}?`, () => {
      state.balance -= amt;
      pushTxn({ note: `- ₹${amt} — Withdrawn` });
      writeState(state);
      render();
      amountInput.value = '';
    });
  });

  add100.addEventListener('click', () => {
    state.balance += 100;
    pushTxn({ note: '+ ₹100 — Quick add' });
    writeState(state);
    render();
  });
  add500.addEventListener('click', () => {
    state.balance += 500;
    pushTxn({ note: '+ ₹500 — Quick add' });
    writeState(state);
    render();
  });

  giveVoucher.addEventListener('click', () => {
    state.vouchers += 1;
    pushTxn({ note: 'Voucher issued (event)' });
    writeState(state);
    render();
  });

  clearTxns.addEventListener('click', () => {
    if(!confirm('Clear all transactions?')) return;
    state.transactions = [];
    writeState(state);
    render();
  });

  exportTxns.addEventListener('click', () => {
    const dataStr = JSON.stringify(state.transactions, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // accessibility: close modal with escape
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape'){ closeModal(); }});
});