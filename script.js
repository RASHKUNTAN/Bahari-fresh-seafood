// --- DATABASE SETUP ---
const SUPABASE_URL = 'https://qhpzqtwzifgthwovkpwp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocHpxdHd6aWZndGh3b3ZrcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjkzMzMsImV4cCI6MjA4ODQwNTMzM30.rgo0X-UWShZAAyvi9hRqSka44ZIJ-2GlvTNsxkFBKgU';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = JSON.parse(localStorage.getItem('bahari_cart')) || [];
let allProducts = [];
let isLoginMode = false;

// 1. LOAD LIVE PRODUCTS FROM DATABASE
async function loadProducts() {
    const { data, error } = await _supabase.from('products').select('*');
    if (error) {
        console.error('Error fetching data:', error);
    } else {
        allProducts = data;
        renderProducts(data);
    }
}

function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = items.map(p => `
        <div class="fish-card" data-category="${p.category}">
            <img src="${p.image_url}" alt="${p.name}" class="fish-img" onerror="this.src='https://via.placeholder.com/300x200?text=Fresh+Catch'">
            <div class="card-info">
                <h3>${p.name}</h3>
                <span class="price">KSh ${p.price.toLocaleString()}</span>
                <button class="add-btn" onclick="addToCart(${p.id})">Add to Basket</button>
            </div>
        </div>
    `).join('');
}

// 2. BASKET/CART LOGIC
function addToCart(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    cart.push(p);
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
    if (!document.getElementById('cartSidebar').classList.contains('active')) toggleCart();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
            <span>${item.name}</span>
            <span>KSh ${item.price.toLocaleString()} <button onclick="removeFromCart(${index})" style="color:red; border:none; background:none; cursor:pointer;">✕</button></span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, i) => sum + i.price, 0);
    const cartTotalPrice = document.getElementById('cart-total-price');
    if (cartTotalPrice) cartTotalPrice.innerText = `KSh ${total.toLocaleString()}`;
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.innerText = cart.length;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
}

// 3. ORDER SUBMISSION (SAVE TO SUPABASE)
async function processMpesa() {
    const phone = document.getElementById('mpesa-phone').value;
    const total = cart.reduce((sum, i) => sum + i.price, 0);
    
    // Create a list of items for the order record
    const itemsList = cart.map(item => item.name).join(', ');

    // Simple validation for Kenyan phone numbers
    if(!phone.startsWith('254') || phone.length < 12) {
        return alert("Please use format 2547XXXXXXXX");
    }

    if(cart.length === 0) {
        return alert("Your basket is empty!");
    }

    // SAVE ORDER DATA TO SUPABASE ORDERS TABLE
    const { error } = await _supabase
        .from('orders')
        .insert([{ 
            customer_phone: phone, 
            items: itemsList, 
            total_price: total,
            status: 'pending'
        }]);

    if (error) {
        alert("Order Error: " + error.message);
    } else {
        alert("Success! Order placed for " + itemsList + ". We will contact you at " + phone + " for delivery.");
        // Clear cart after successful order
        cart = [];
        localStorage.setItem('bahari_cart', "[]");
        location.reload();
    }
}

// 4. AUTHENTICATION HELPERS
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPass').value;

    if (isLoginMode) {
        const { error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message); else location.reload();
    } else {
        const { error } = await _supabase.auth.signUp({ email, password });
        if (error) alert(error.message); else alert("Check email for verification!");
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Login' : 'Create Account';
    document.getElementById('authSwitch').innerText = isLoginMode ? 'Need account? Register' : 'Have account? Login';
}

// 5. SEARCH & FILTERING
function filterProducts() {
    const val = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(val));
    renderProducts(filtered);
}

function filterCategory(cat, el) {
    document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
    renderProducts(filtered);
}

// 6. UI TOGGLES
function toggleCart() { document.getElementById('cartSidebar').classList.toggle('active'); }

function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
    if(id === 'paymentModal') {
        const total = cart.reduce((sum, i) => sum + i.price, 0);
        document.getElementById('pay-total-display').innerText = `Total Amount: KSh ${total.toLocaleString()}`;
    }
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
});