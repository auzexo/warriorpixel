console.log("Wallet page loaded");
console.log("Wallet Loaded");

document.getElementById("addMoney").addEventListener("click", () => {
    alert("Add money feature coming soon!");
});

document.getElementById("withdrawMoney").addEventListener("click", () => {
    alert("Withdraw feature coming soon!");
});
// Set wallet balance from global data
document.querySelector(".amount").textContent = "₹ " + WPData.walletBalance;