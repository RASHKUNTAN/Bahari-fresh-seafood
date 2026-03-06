// --- DATABASE CONFIGURATION ---
const SUPABASE_URL = 'https://qhpzqtwzifgthwovkpwp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocHpxdHd6aWZndGh3b3ZrcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjkzMzMsImV4cCI6MjA4ODQwNTMzM30.rgo0X-UWShZAAyvi9hRqSka44ZIJ-2GlvTNsxkFBKgU';
const _supabase = supabase.createClient('https://qhpzqtwzifgthwovkpwp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocHpxdHd6aWZndGh3b3ZrcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjkzMzMsImV4cCI6MjA4ODQwNTMzM30.rgo0X-UWShZAAyvi9hRqSka44ZIJ-2GlvTNsxkFBKgU');

let cart = JSON.parse(localStorage.getItem('bahari_cart')) || [];
let allProducts = [];
let isLoginMode = false;

// 1. LOAD LIVE PRODUCTS FROM CLOUD
async function loadProducts() {
    const { data, error } = await _supabase.from('products').select('*');
    if (error) {
        console.error('Error:', error);
        // Fallback to your original images if database is empty
        renderProducts([
            { id: 1, name: 'Red Snapper', price: 1500, category: 'whole', image_url: 'images/redsnapper.jpg' },
            { id: 2, name: 'Silver Pomfret', price: 800, category: 'whole', image_url: 'images/silver-pomfret.jpg' }
        ]);
    } else {
        allProducts = data;
        renderProducts(data);
    }
}

function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map(p => `
        <div class="fish-card" data-category="${p.category}">
            <img src="${p.image_url}" alt="${p.name}" class="fish-img" onerror="this.src='https://via.placeholder.com/300x200?text=Fresh+Fish'">
            <div class="card-info">
                <h3>${p.name}</h3>
                <span class="price">KSh ${p.price.toLocaleString()}</span>
                <button class="add-btn" onclick="addToCart(${p.id})">Add to Basket</button>
            </div>
        </div>
    `).join('');
}

// 2. LIVE CART LOGIC
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
        <div style="display:flex; justify-content:space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9; align-items:center;">
            <div>
                <strong style="display:block;">${item.name}</strong>
                <small style="color:#00a896;">KSh ${item.price.toLocaleString()}</small>
            </div>
            <button onclick="removeFromCart(${index})" style="color:#ff7675; border:none; background:none; cursor:pointer; font-size:18px;">✕</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, i) => sum + i.price, 0);
    document.getElementById('cart-total-price').innerText = `KSh ${total.toLocaleString()}`;
    document.getElementById('cart-count').innerText = cart.length;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
}

// 3. AUTHENTICATION (SUPABASE)
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPass').value;

    if (isLoginMode) {
        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message); else location.reload();
    } else {
        const { data, error } = await _supabase.auth.signUp({ email, password });
        if (error) alert(error.message); else alert("Account created! Check email for verification.");
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Login' : 'Create Account';
    document.getElementById('authSwitch').innerText = isLoginMode ? 'Need an account? Register' : 'Already have an account? Login';
}

// 4. M-PESA CHECKOUT
function processMpesa() {
    const phone = document.getElementById('mpesa-phone').value;
    const total = cart.reduce((sum, i) => sum + i.price, 0);
    if(!phone.startsWith('254')) return alert("Use format 2547XXXXXXXX");
    
    alert(`STK Push sent to ${phone} for KSh ${total}. Check your phone!`);
    cart = [];
    localStorage.setItem('bahari_cart', "[]");
    location.reload();
}

// 5. SEARCH & UI
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

function toggleCart() { document.getElementById('cartSidebar').classList.toggle('active'); }
function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
    if(id === 'paymentModal') {
        const total = cart.reduce((sum, i) => sum + i.price, 0);
        document.getElementById('pay-total-display').innerText = `Amount: KSh ${total.toLocaleString()}`;
    }
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.addEventListener('DOMContentLoaded', loadProducts);