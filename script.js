// Shared state
let cart = JSON.parse(localStorage.getItem('bahari_cart')) || [];
let user = JSON.parse(localStorage.getItem('bahari_user')) || null;
let orderHistory = JSON.parse(localStorage.getItem('bahari_orders')) || [];
const MERCHANT_PHONE = "254796401465";

// Detect current page
const currentPage = window.location.pathname.split("/").pop();

// Run page-specific logic
document.addEventListener('DOMContentLoaded', () => {
    if (currentPage === "index.html" || currentPage === "") {
        checkUser();
        updateCartUI();
    }
    if (currentPage === "cart.html") {
        updateCartUI();
    }
    if (currentPage === "login.html") {
        checkUser();
    }
    if (currentPage === "payment.html") {
        updateCartUI();
        showPaymentTotal();
    }
    if (currentPage === "history.html") {
        renderHistory();
    }
});

// -------------------- CART LOGIC --------------------
function changeQty(id, delta) {
    const input = document.getElementById(id);
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    input.value = val;
}

function addToCart(name, price, qtyId) {
    const qty = parseInt(document.getElementById(qtyId).value);
    const itemTotal = price * qty;
    cart.push({ name, price, qty, itemTotal, id: Date.now() });
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    alert(`${name} added to cart!`);
    updateCartUI();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
}

function clearCart() {
    cart = [];
    localStorage.setItem('bahari_cart', "[]");
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total-price');
    const cartCount = document.getElementById('cart-count');
    if (!list || !totalDisplay) return;

    list.innerHTML = cart.length === 0 ? "<p>Your basket is empty.</p>" : "";
    let grandTotal = 0;

    cart.forEach(item => {
        grandTotal += item.itemTotal;
        list.innerHTML += `
            <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.qty}kg x KSh ${item.price}</small>
                </div>
                <div style="font-weight:bold">
                    KSh ${item.itemTotal}
                    <span onclick="removeItem(${item.id})" style="color:red; margin-left:10px; cursor:pointer">✕</span>
                </div>
            </div>`;
    });
    totalDisplay.innerText = `KSh ${grandTotal.toFixed(2)}`;
    if (cartCount) cartCount.innerText = cart.length;
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('active');
    }
}

// -------------------- LOGIN SIDEBAR --------------------
function toggleLogin() {
    const loginSidebar = document.getElementById('loginSidebar');
    if (loginSidebar) {
        loginSidebar.classList.toggle('active');
    }
}

// -------------------- USER AUTH --------------------
function checkUser() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;
    if (user) {
        authSection.innerHTML = `Hi, ${user.name} | <a href="#" onclick="logout()">Logout</a>`;
        const historyLink = document.getElementById('history-link');
        if (historyLink) historyLink.style.display = "inline";
    }
}

function handleAuth(e) {
    e.preventDefault();
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    user = { name, email, password };
    localStorage.setItem('bahari_user', JSON.stringify(user));
    alert("Login successful!");
    window.location.href = "index.html";
}

function logout() {
    localStorage.removeItem('bahari_user');
    window.location.href = "index.html";
}

function togglePassword() {
    const passwordInput = document.getElementById('userPassword');
    const toggleIcon = document.querySelector('.toggle-password');
    if (!passwordInput || !toggleIcon) return;
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        toggleIcon.textContent = "👁️";
    }
}

// -------------------- MODALS --------------------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        if (modalId === "historyModal") {
            renderHistory(); // refresh history when opened
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

function openPayment() {
    openModal('paymentModal');
}

// Close modal if user clicks outside the modal content
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});

// Close modal with ESC key
window.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = "none";
        });
        const cartSidebar = document.getElementById('cartSidebar');
        const loginSidebar = document.getElementById('loginSidebar');
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (loginSidebar) loginSidebar.classList.remove('active');
    }
});

// -------------------- PAYMENT --------------------
function showPaymentTotal() {
    const payAmount = document.getElementById('pay-amount');
    if (!payAmount) return;
    let grandTotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
    payAmount.innerText = `Total to Pay: KSh ${grandTotal.toFixed(2)}`;
}

function initiateMpesa(e) {
    e.preventDefault();
    if (!user) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }
    if (cart.length === 0) {
        alert("Cart is empty!");
        window.location.href = "index.html";
        return;
    }

    const phone = document.getElementById('mpesa-phone').value;
    let total = cart.reduce((sum, item) => sum + item.itemTotal, 0);

    // Save order
    const order = { date: new Date().toLocaleString(), items: [...cart], total: `KSh ${total.toFixed(2)}` };
    orderHistory.unshift(order);
    localStorage.setItem('bahari_orders', JSON.stringify(orderHistory));

    // WhatsApp message
    let msg = `*PAID ORDER - BAHARI FRESH*%0A------------------%0A`;
    msg += `Customer: ${user.name}%0A`;
    cart.forEach(i => msg += `• ${i.name} (${i.qty}kg) - KSh ${i.itemTotal}%0A`);
    msg += `%0A*TOTAL: KSh ${total.toFixed(2)}*%0A*PAID VIA M-PESA: ${phone}*`;

    // Clear cart
    cart = [];
    localStorage.setItem('bahari_cart', "[]");

    alert("Payment initiated! Redirecting to WhatsApp...");
    window.location.href = `https://wa.me/${MERCHANT_PHONE}?text=${msg}`;
}

// -------------------- HISTORY --------------------
function renderHistory() {
    const list = document.getElementById('order-history-list');
    if (!list) return;
    list.innerHTML = orderHistory.length ? "" : "No previous orders.";
    orderHistory.forEach(o => {
        let itemsHtml = o.items.map(i => `• ${i.name} (${i.qty}kg) - KSh ${i.itemTotal}`).join("<br>");
        list.innerHTML += `<div style="background:rgba(255,255,255,0.1); padding:15px; margin-bottom:10px; border-radius:12px; color:#fff">
            <small>${o.date}</small><br>
            <strong>${o.total}</strong><br>
            ${itemsHtml}
        </div>`;
    });
}

