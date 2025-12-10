console.log("Homepage loaded successfully");

const tabs = document.querySelectorAll('.sidebar a');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});