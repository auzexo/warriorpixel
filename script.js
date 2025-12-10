// Shared data
window.WPData = { coins:1200, gems:350, vouchers:3 };

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // show top currencies
  const coinsTop = document.getElementById('coins-top');
  const gemsTop = document.getElementById('gems-top');
  const vouchersTop = document.getElementById('vouchers-top');
  if(coinsTop) coinsTop.textContent = WPData.coins;
  if(gemsTop) gemsTop.textContent = WPData.gems;
  if(vouchersTop) vouchersTop.textContent = WPData.vouchers;

  // menu toggle with animated slide-in
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const sidebarClose = document.getElementById('sidebarClose');

  function openSidebar(){
    sidebar.classList.add('show');
    overlay.classList.add('show');
  }
  function closeSidebar(){
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
  }

  if(menuToggle) menuToggle.addEventListener('click', openSidebar);
  if(overlay) overlay.addEventListener('click', closeSidebar);
  if(sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

  // quick demo: chat send
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
});