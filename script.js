console.log("Homepage loaded successfully");

/* Sidebar active logic */
const tabs = document.querySelectorAll('.sidebar-item');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

/* Profile dropdown */
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

profileBtn.addEventListener("click", () => {
    profileMenu.style.display =
        profileMenu.style.display === "flex" ? "none" : "flex";
});
console.log("Wallet / Notifications / Friends icons ready");
// Load global values to homepage
document.querySelector(".currency .item:nth-child(1) span").textContent = WPData.gems;
document.querySelector(".currency .item:nth-child(2) span").textContent = WPData.coins;
document.querySelector(".currency .item:nth-child(3) span").textContent = WPData.vouchers;