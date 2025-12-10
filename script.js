// simple shared data
window.WPData = { coins:1200, gems:350, vouchers:3 };

// show top currencies
document.addEventListener('DOMContentLoaded', ()=> {
  const coinsTop = document.getElementById('coins-top');
  const gemsTop = document.getElementById('gems-top');
  const vouchersTop = document.getElementById('vouchers-top');
  if(coinsTop) coinsTop.textContent = WPData.coins;
  if(gemsTop) gemsTop.textContent = WPData.gems;
  if(vouchersTop) vouchersTop.textContent = WPData.vouchers;

  // menu toggle for small screens
  const menuToggle = document.getElementById('menuToggle');
  if(menuToggle){
    menuToggle.addEventListener('click', ()=>{
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }

  // chat send demo
  const sendBtn = document.getElementById('sendChat');
  const chatText = document.getElementById('chatText');
  if(sendBtn && chatText){
    sendBtn.addEventListener('click', ()=>{
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