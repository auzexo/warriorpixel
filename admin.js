/* Admin UI — simple client-side storage for tournaments
   - Not secure: this is UI prototype using localStorage.
   - Later replace with API + auth.
*/
const ADMIN_KEY = 'wp_admin_tournaments_v1';

function readTournaments(){
  try { const raw = localStorage.getItem(ADMIN_KEY); return raw ? JSON.parse(raw) : []; }
  catch(e){ return []; }
}
function writeTournaments(arr){ localStorage.setItem(ADMIN_KEY, JSON.stringify(arr)); }

function uid(){ return 't_' + Math.random().toString(36).slice(2,9); }

function renderTournaments(){
  const list = document.getElementById('tList');
  const items = readTournaments();
  list.innerHTML = '';
  if(items.length === 0){ list.innerHTML = '<li style="opacity:.7">No tournaments yet</li>'; return; }
  items.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<div>
        <div style="font-weight:700">${t.title}</div>
        <div class="meta">Prize ₹${t.prize} • Fee ₹${t.fee} • ${t.date} ${t.time}</div>
      </div>
      <div>
        <button class="btn-outline" data-id="${t.id}" data-action="edit">Edit</button>
        <button class="btn-negative" data-id="${t.id}" data-action="delete">Delete</button>
      </div>`;
    list.appendChild(li);
  });

  // attach edit/delete
  list.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', (e) => {
      const id = b.dataset.id;
      const action = b.dataset.action;
      if(action === 'delete'){ if(confirm('Delete this tournament?')) removeTournament(id); }
      if(action === 'edit'){ populateFormForEdit(id); }
    });
  });
}

function addTournament(obj){
  const arr = readTournaments();
  arr.push(obj);
  writeTournaments(arr);
  renderTournaments();
}

function removeTournament(id){
  const arr = readTournaments().filter(t => t.id !== id);
  writeTournaments(arr);
  renderTournaments();
}

function populateFormForEdit(id){
  const items = readTournaments();
  const t = items.find(x => x.id === id);
  if(!t) return alert('Item not found');
  document.getElementById('tTitle').value = t.title;
  document.getElementById('tPrize').value = t.prize;
  document.getElementById('tFee').value = t.fee;
  document.getElementById('tDate').value = t.date;
  document.getElementById('tTime').value = t.time;
  // delete existing then re-create on save (simple flow)
  removeTournament(id);
}

document.addEventListener('DOMContentLoaded', () => {
  renderTournaments();

  const createBtn = document.getElementById('createTournament');
  const resetBtn = document.getElementById('resetForm');
  const issueVoucher = document.getElementById('issueVoucher');
  const clearTournaments = document.getElementById('clearTournaments');

  createBtn.addEventListener('click', () => {
    const title = document.getElementById('tTitle').value.trim();
    const prize = parseInt(document.getElementById('tPrize').value,10) || 0;
    const fee = parseInt(document.getElementById('tFee').value,10) || 0;
    const date = document.getElementById('tDate').value;
    const time = document.getElementById('tTime').value;
    if(!title){ alert('Enter a title'); return; }
    const obj = { id: uid(), title, prize, fee, date, time };
    addTournament(obj);
    // clear form
    document.getElementById('tTitle').value = '';
    document.getElementById('tPrize').value = '';
    document.getElementById('tFee').value = '';
    document.getElementById('tDate').value = '';
    document.getElementById('tTime').value = '';
    alert('Tournament created (local) — will be listed below.');
  });

  resetBtn.addEventListener('click', () => {
    document.getElementById('tTitle').value = '';
    document.getElementById('tPrize').value = '';
    document.getElementById('tFee').value = '';
    document.getElementById('tDate').value = '';
    document.getElementById('tTime').value = '';
  });

  issueVoucher.addEventListener('click', () => {
    // quick demo: increase vouchers in wallet localStorage
    const walletKey = 'wp_wallet_v1';
    const raw = localStorage.getItem(walletKey);
    const wallet = raw ? JSON.parse(raw) : { vouchers:0, coins:0, gems:0, balance:0, transactions:[] };
    wallet.vouchers = (wallet.vouchers || 0) + 1;
    wallet.transactions = wallet.transactions || [];
    wallet.transactions.push({ note: 'Voucher issued by Admin', time: new Date().toLocaleString() });
    localStorage.setItem(walletKey, JSON.stringify(wallet));
    alert('Voucher issued (local).');
  });

  clearTournaments.addEventListener('click', () => {
    if(!confirm('Delete all tournaments?')) return;
    writeTournaments([]);
    renderTournaments();
  });
});