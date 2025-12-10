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