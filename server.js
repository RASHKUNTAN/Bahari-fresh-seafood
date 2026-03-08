const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let allProducts = [];

async function loadProducts() {
    const { data } = await _supabase.from('products').select('*').order('name');
    if (data) { allProducts = data; renderProducts(data); }
}

function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map(p => {
        const isOutOfStock = p.stock_quantity <= 0;
        return `
        <div class="fish-card" style="opacity: ${isOutOfStock ? '0.6' : '1'}">
            <img src="${p.image_url}" style="width:100%; height:200px; object-fit:cover; border-radius:10px;">
            <h3>${p.name}</h3>
            <p>KSh ${p.price.toLocaleString()} / ${p.unit}</p>
            <div style="margin-bottom:10px;">
                <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock_quantity}" ${isOutOfStock ? 'disabled' : ''} style="width:50px;">
                <small style="display:block;">${isOutOfStock ? 'SOLD OUT' : 'Available: ' + p.stock_quantity + p.unit}</small>
            </div>
            <button class="checkout-btn" onclick="addToBasket(${p.id})" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Out of Stock' : 'Add to Basket'}
            </button>
        </div>
    `}).join('');
}

function addToBasket(id) {
    const p = allProducts.find(x => x.id === id);
    const qty = parseInt(document.getElementById(`qty-${id}`).value);
    cart.push({ ...p, qty, itemTotal: p.price * qty });
    updateCartUI();
    alert(`Added ${qty} ${p.unit} of ${p.name}`);
}

function updateCartUI() {
    const total = cart.reduce((sum, i) => sum + i.itemTotal, 0);
    document.getElementById('cart-total-price').innerText = `Total: KSh ${total.toLocaleString()}`;
    document.getElementById('cart-count').innerText = cart.length;
    document.getElementById('cart-items-list').innerHTML = cart.map(i => `<div>${i.name} (${i.qty}) - KSh ${i.itemTotal}</div>`).join('');
}

async function processMpesa() {
    const phone = document.getElementById('mpesa-phone').value;
    const total = cart.reduce((sum, i) => sum + i.itemTotal, 0);
    const itemsStr = cart.map(i => `${i.name}(${i.qty})`).join(', ');

    if (!phone.startsWith('254') || phone.length < 12) return alert("Use 2547...");

    const { error } = await _supabase.from('orders').insert([{ 
        customer_phone: phone, items: itemsStr, total_price: total, status: 'pending' 
    }]);

    if (!error) {
        for (const item of cart) {
            const { data } = await _supabase.from('products').select('stock_quantity').eq('id', item.id).single();
            await _supabase.from('products').update({ stock_quantity: data.stock_quantity - item.qty }).eq('id', item.id);
        }
        alert("Order Received!");
        cart = []; location.reload();
    }
}

function toggleCart() {
    const s = document.getElementById('cartSidebar');
    s.style.right = s.style.right === '0px' ? '-400px' : '0px';
}

loadProducts();