let cart = JSON.parse(localStorage.getItem('bahari_cart')) || [];
let user = JSON.parse(localStorage.getItem('bahari_user')) || null;
let orderHistory = JSON.parse(localStorage.getItem('bahari_orders')) || [];
const MERCHANT_PHONE = "254796401465";

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    checkUser();
    renderHistory();
});

// QTY TOGGLE (+ / -)
function changeQty(id, delta) {
    const input = document.getElementById(id);
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    input.value = val;
}

// SEARCH
function filterProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.fish-card').forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = title.includes(q) ? "block" : "none";
    });
}

// CATEGORIES
function filterCategory(cat, el) {
    document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.fish-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.category === cat) ? "block" : "none";
    });
}

// CART LOGIC
function addToCart(name, price, qtyId) {
    const qty = parseInt(document.getElementById(qtyId).value);
    const itemTotal = price * qty;

    cart.push({ name, price, qty, itemTotal, id: Date.now() });

    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
    toggleCart(); // Show sidebar when adding
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
    document.getElementById('cart-count').innerText = cart.length;

    list.innerHTML = cart.length === 0 ? "<p style='padding:20px'>Your basket is empty.</p>" : "";
    let grandTotal = 0;

    cart.forEach(item => {
        grandTotal += item.itemTotal;
        list.innerHTML += `
            <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center">
                <div style="text-align:left">
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
}

// CHECKOUT
function openPayment() {
    if (!user) return openModal('loginModal');
    if (cart.length === 0) return alert("Cart is empty!");
    document.getElementById('pay-amount').innerText = "Total to Pay: " + document.getElementById('cart-total-price').innerText;
    openModal('paymentModal');
}

function initiateMpesa(e) {
    e.preventDefault();
    const phone = document.getElementById('mpesa-phone').value;
    const total = document.getElementById('cart-total-price').innerText;

    const order = { date: new Date().toLocaleString(), items: [...cart], total: total };
    orderHistory.unshift(order);
    localStorage.setItem('bahari_orders', JSON.stringify(orderHistory));

    let msg = `*PAID ORDER - BAHARI FRESH*%0A------------------%0A`;
    msg += `Customer: ${user.name}%0A`;
    cart.forEach(i => msg += `• ${i.name} (${i.qty}kg) - KSh ${i.itemTotal}%0A`);
    msg += `%0A*TOTAL: ${total}*%0A*PAID VIA M-PESA: ${phone}*`;

    cart = [];
    localStorage.setItem('bahari_cart', "[]");
    updateCartUI();
    renderHistory();
    closeModal('paymentModal');

    window.location.href = `https://wa.me/${MERCHANT_PHONE}?text=${msg}`;
}

// USER AUTH
function checkUser() {
    if (user) {
        document.getElementById('auth-section').innerHTML = `Hi, ${user.name} | <a href="#" onclick="logout()">Logout</a>`;
        document.getElementById('history-link').style.display = "inline";
    }
}

function handleAuth(e) {
    e.preventDefault();
    user = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value
    };
    localStorage.setItem('bahari_user', JSON.stringify(user));
    location.reload();
}

function renderHistory() {
    const list = document.getElementById('order-history-list');
    list.innerHTML = orderHistory.length ? "" : "No previous orders.";
    orderHistory.forEach(o => {
        list.innerHTML += `<div style="background:#f4f4f4; padding:10px; margin-bottom:10px; border-radius:10px">
            <small>${o.date}</small><br><strong>${o.total}</strong> Paid
        </div>`;
    });
}

function logout() {
    localStorage.clear();
    location.reload();
}

// MODALS
function openModal(id) { document.getElementById(id).style.display = "block"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function toggleCart() { document.getElementById('cartSidebar').classList.toggle('active'); }
