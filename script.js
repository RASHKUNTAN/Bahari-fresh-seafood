// --- INITIALIZATION ---
const SUPABASE_URL = 'https://qhpzqtwzifgthwovkpwp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocHpxdHd6aWZndGh3b3ZrcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjkzMzMsImV4cCI6MjA4ODQwNTMzM30.rgo0X-UWShZAAyvi9hRqSka44ZIJ-2GlvTNsxkFBKgU';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = JSON.parse(localStorage.getItem('bahari_cart')) || [];
let allProducts = [];
let isLoginMode = true;

// 1. DATA INITIALIZATION
async function loadProducts() {
    const { data, error } = await _supabase.from('products').select('*').order('name', { ascending: true });
    if (!error) {
        allProducts = data;
        renderProducts(data);
    } else {
        console.error("Error loading products:", error.message);
    }
}

function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = items.map(p => {
        const isOut = p.stock_quantity <= 0;
        return `
        <div class="fish-card" style="opacity: ${isOut ? '0.6' : '1'}">
            ${isOut ? '<div class="sold-out-badge">SOLD OUT</div>' : ''}
            <img src="${p.image_url}" class="fish-img" onerror="this.src='https://via.placeholder.com/300x200?text=Fresh+Catch'">
            <div class="card-info">
                <small style="color:var(--secondary); text-transform:uppercase; font-weight:700; letter-spacing:1px;">${p.category}</small>
                <h3 style="margin:10px 0; color: var(--primary);">${p.name}</h3>
                <div class="price-text" style="font-size: 1.4rem; font-weight: 800; margin-bottom: 10px;">KSh ${p.price.toLocaleString()}</div>
                <div style="margin-bottom:20px;">
                    <span style="color:${isOut ? '#ff4d4d' : '#28a745'}; font-size:0.85rem; font-weight:bold;">
                        ${isOut ? '● Out of Season' : '● ' + p.stock_quantity + ' ' + (p.unit || 'kg') + ' In Stock'}
                    </span>
                </div>
                <button class="buy-btn" 
                        onclick="addToCart(${p.id})" 
                        ${isOut ? 'disabled' : ''} 
                        style="background:${isOut ? '#ccc' : 'var(--primary)'}; color:white; width:100%; padding: 12px; border:none; border-radius:10px; font-weight:bold; cursor:${isOut ? 'not-allowed' : 'pointer'}; transition: 0.3s;">
                    ${isOut ? 'Sold Out' : 'Add to Basket'}
                </button>
            </div>
        </div>
    `}).join('');
}

// 2. SEARCH & FILTER
function filterProducts() {
    const val = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(val) || p.category.toLowerCase().includes(val));
    renderProducts(filtered);
}

// 3. CART SYSTEM
function addToCart(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    
    const inCartCount = cart.filter(item => item.id === id).length;
    if (inCartCount >= p.stock_quantity) {
        return alert("Sorry! We only have " + p.stock_quantity + " " + p.unit + " available.");
    }

    cart.push(p);
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
    
    if (!document.getElementById('cartSidebar').classList.contains('active')) {
        toggleCart();
    }
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;

    list.innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 15px 0; border-bottom: 1px solid #eee;">
            <div>
                <div style="font-weight:bold; color: var(--primary);">${item.name}</div>
                <div style="font-size:0.8rem; color:#666;">KSh ${item.price.toLocaleString()}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="color:#ff4d4d; border:none; background:none; cursor:pointer; font-size:1.2rem;">✕</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, i) => sum + i.price, 0);
    document.getElementById('cart-total-price').innerText = `Total: KSh ${total.toLocaleString()}`;
    document.getElementById('cart-count').innerText = cart.length;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('bahari_cart', JSON.stringify(cart));
    updateCartUI();
}

// 4. CHECKOUT & STOCK DEDUCTION
async function processMpesa() {
    const phone = document.getElementById('mpesa-phone').value;
    
    if(!phone.startsWith('254') || phone.length < 12) {
        return alert("Please use the format 2547XXXXXXXX");
    }
    if(cart.length === 0) return alert("Your basket is empty!");

    const total = cart.reduce((sum, i) => sum + i.price, 0);
    const itemsList = cart.map(item => item.name).join(', ');

    try {
        // Atomic-style check: verify stock one last time before deducting
        for (const item of cart) {
            const { data, error } = await _supabase.from('products').select('stock_quantity').eq('id', item.id).single();
            if (data.stock_quantity <= 0) {
                throw new Error(`Sorry, ${item.name} just sold out!`);
            }
            
            const { error: upError } = await _supabase
                .from('products')
                .update({ stock_quantity: data.stock_quantity - 1 })
                .eq('id', item.id);
            
            if (upError) throw upError;
        }

        const { error: orderError } = await _supabase.from('orders').insert([{ 
            customer_phone: phone, 
            items: itemsList, 
            total_price: total, 
            status: 'pending'
        }]);

        if (orderError) throw orderError;

        alert("🚀 Order Placed! We will call you shortly for delivery.");
        cart = []; 
        localStorage.setItem('bahari_cart', "[]"); 
        location.reload();

    } catch (err) {
        alert(err.message);
    }
}

// 5. AUTHENTICATION (Fixed for null references)
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const switcher = document.getElementById('authSwitch'); // Ensure this ID exists in HTML
    
    if (title) title.innerText = isLoginMode ? 'Login' : 'Create Account';
    if (switcher) switcher.innerText = isLoginMode ? 'Switch to Register' : 'Switch to Login';
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPass').value;

    const { data, error } = isLoginMode 
        ? await _supabase.auth.signInWithPassword({ email, password })
        : await _supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
    else {
        if (!isLoginMode) alert("Signup successful! Please check your email.");
        location.reload();
    }
}

// UI TOGGLES
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleCart() { document.getElementById('cartSidebar').classList.toggle('active'); }

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
});