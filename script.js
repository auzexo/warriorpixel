// Shared simulated data
window.WPData = { coins:25, gems:1200, vouchers:3 };

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // show top currencies
  const coinsTop = document.getElementById('coins-top');
  const gemsTop = document.getElementById('gems-top');
  const vouchersTop = document.getElementById('vouchers-top');
  if(coinsTop) coinsTop.textContent = WPData.coins;
  if(gemsTop) gemsTop.textContent = WPData.gems;
  if(vouchersTop) vouchersTop.textContent = WPData.vouchers;

  // menu toggle & mobile sidebar
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const sidebarClose = document.getElementById('sidebarClose');

  function openSidebar(){ sidebar.classList.add('show'); overlay.classList.add('show'); }
  function closeSidebar(){ sidebar.classList.remove('show'); overlay.classList.remove('show'); }

  if(menuToggle) menuToggle.addEventListener('click', openSidebar);
  if(overlay) overlay.addEventListener('click', () => { closeSidebar(); closeRightPanel(); });
  if(sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

  // left nav: change section classes and show correct content placeholders
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      // set active
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // set section class on body for theming
      const section = item.dataset.section || '';
      document.body.classList.remove('section-ff','section-mc','section-ach');
      if(section === 'ff') document.body.classList.add('section-ff');
      if(section === 'mc') document.body.classList.add('section-mc');
      if(section === 'ach') document.body.classList.add('section-ach');

      // update page title
      const title = document.getElementById('pageTitle');
      if(title) title.textContent = (item.textContent || '').trim();

      // show placeholder content block matching selection (they are intentionally empty)
      document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
      if(section === 'ff') { document.getElementById('section-ff').classList.remove('hidden'); }
      if(section === 'mc') { document.getElementById('section-mc').classList.remove('hidden'); }
      if(section === 'ach') { document.getElementById('section-ach').classList.remove('hidden'); }

      // close mobile sidebar after navigation
      closeSidebar();
    });
  });

  // RIGHT PANEL (notifications / friends / gifts)
  const rightPanel = document.getElementById('rightPanel');
  const rightPanelTitle = document.getElementById('rightPanelTitle');
  const rightPanelBody  = document.getElementById('rightPanelBody');

  function openRightPanel(which){
    rightPanelTitle.textContent = which.charAt(0).toUpperCase() + which.slice(1);
    // empty body placeholders (you'll fill later)
    rightPanelBody.innerHTML = ''; // keep empty now
    rightPanel.classList.add('open');
    rightPanel.setAttribute('aria-hidden','false');
    overlay.classList.add('show');
  }
  function closeRightPanel(){
    rightPanel.classList.remove('open');
    rightPanel.setAttribute('aria-hidden','true');
    overlay.classList.remove('show');
  }

  // hooks for top-right buttons
  const bellBtn = document.getElementById('bellBtn');
  const friendsBtn = document.getElementById('friendsBtn');
  const walletBtn = document.getElementById('walletBtn');

  if(bellBtn) bellBtn.addEventListener('click', () => openRightPanel('notifications'));
  if(friendsBtn) friendsBtn.addEventListener('click', () => openRightPanel('friends'));
  if(walletBtn) walletBtn.addEventListener('click', () => openRightPanel('wallet'));

  // close right panel when overlay clicked (handled above)
  overlay.addEventListener('click', () => { closeRightPanel(); });

  // small chat send demo (keeps it empty / placeholder)
  const sendBtn = document.getElementById('sendChat');
  const chatText = document.getElementById('chatText');
  if(sendBtn && chatText){
    sendBtn.addEventListener('click', () => {
      const text = chatText.value.trim();
      if(!text) return;
      const box = document.createElement('div');
      box.className = 'msg me';
      box.textContent = text;
      const container = document.querySelector('.chat-box');
      container.insertBefore(box, container.querySelector('.chat-input'));
      chatText.value = '';
      container.scrollTop = container.scrollHeight;
    });
  }

  // accessibility: Escape closes overlays/panels
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ closeSidebar(); closeRightPanel(); }
  });
});