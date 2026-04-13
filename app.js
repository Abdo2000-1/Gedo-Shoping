/* ============================================================================
   ATTAR SHOP - MAIN APPLICATION SCRIPT
   E-commerce functionality with Firebase integration
   ============================================================================ */

/* ============================================================================
   STATE MANAGEMENT
   ============================================================================ */

let cart = [];
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let isLoading = false;

/* ============================================================================
   DOM ELEMENTS
   ============================================================================ */

const productsGrid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const cartIcon = document.getElementById('cartIcon');
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartClose = document.getElementById('cartClose');
const overlay = document.getElementById('overlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const orderBtn = document.getElementById('orderBtn');
const themeToggle = document.getElementById('themeToggle');
const categoryButtons = document.querySelectorAll('.category-btn');

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    
    // سحب المنتجات والعروض من فايربيز عند فتح الصفحة
    await loadProducts();
    await loadOffers();
    
    setupEventListeners();
    loadCartFromLocalStorage();
    
    // عرض المنتجات اللي اتسحبت
    renderProducts();
    updateCartUI();
});

/* ============================================================================
   THEME MANAGEMENT
   ============================================================================ */

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
}

/* ============================================================================
   FIREBASE OPERATIONS
   ============================================================================ */

async function loadProducts() {
    try {
        isLoading = true;
        
        // التأكد من وجود اتصال بـ Firebase (db موجودة في firebase-config.js)
        if (typeof db === 'undefined') {
            console.error('Firebase DB is not defined. Check firebase-config.js');
            loadFallbackProducts();
            return;
        }

        // سحب المنتجات من Collection "products"
        const querySnapshot = await db.collection('products')
            .where('active', '==', true)
            .get();
        
        allProducts = [];
        querySnapshot.forEach(doc => {
            allProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Successfully loaded ${allProducts.length} products from Firebase`);

        // لو المخزن في فايربيز فاضي، حمل المنتجات الاحتياطية
        if (allProducts.length === 0) {
            loadFallbackProducts();
        }
        
    } catch (error) {
        console.error('Error loading products from Firebase:', error);
        loadFallbackProducts();
    } finally {
        isLoading = false;
        renderProducts(); // تحديث العرض بعد السحب
    }
}

function loadFallbackProducts() {
    console.log("Loading fallback products...");
    allProducts = [
        {
            id: 'f1',
            name: 'منتج تجريبي 1',
            price: 50,
            category: 'honey',
            description: 'يرجى إضافة منتجات حقيقية في Firebase',
            image_emoji: '🍯',
            active: true
        }
    ];
}

/* ============================================================================
   OFFERS MANAGEMENT
   ============================================================================ */

let allOffers = [];
const offerQuantities = {};

async function loadOffers() {
    const grid = document.getElementById('offersGrid');
    const empty = document.getElementById('offersEmpty');
    const badge = document.getElementById('offersNavBadge');
    if (!grid) return;

    try {
        if (typeof db === 'undefined') { grid.innerHTML = ''; empty.style.display = 'block'; return; }
        
        const snap = await db.collection('offers').where('active', '==', true).get();
        allOffers = [];
        snap.forEach(doc => allOffers.push({ id: doc.id, ...doc.data() }));

        if (allOffers.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            document.getElementById('offersSection').style.display = 'none';
            return;
        }

        document.getElementById('offersSection').style.display = 'block';
        // Update nav badge
        badge.textContent = allOffers.length;
        badge.style.display = 'flex';
        
        renderOffers();
    } catch (e) {
        console.error('Error loading offers:', e);
        grid.innerHTML = '';
        empty.style.display = 'block';
    }
}

function renderOffers() {
    const grid = document.getElementById('offersGrid');
    grid.innerHTML = allOffers.map(offer => {
        const discount = Math.round(((offer.original_price - offer.sale_price) / offer.original_price) * 100);
        const savings = offer.original_price - offer.sale_price;
        const qty = offerQuantities[offer.id] || 0;
        const imgHtml = offer.image_url
            ? `<img src="${offer.image_url}" alt="${offer.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
               <span class="offer-emoji-fallback" style="display:none">${offer.image_emoji || '🏷️'}</span>`
            : `<span class="offer-emoji-fallback">${offer.image_emoji || '🏷️'}</span>`;

        return `
        <div class="offer-card">
            <div class="offer-discount-badge">🔥 خصم ${discount}%</div>
            <div class="offer-image-wrapper">${imgHtml}</div>
            <div class="offer-info">
                <div class="offer-name">${offer.name}</div>
                ${offer.description ? `<div class="offer-description">${offer.description}</div>` : ''}
                <div class="offer-pricing">
                    <span class="offer-original-price">EGP ${offer.original_price}</span>
                    <span class="offer-sale-price">EGP ${offer.sale_price}</span>
                    <span class="offer-savings">وفّر ${savings} EGP</span>
                </div>
                <div class="offer-actions">
                    <div class="offer-qty-control">
                        <button class="offer-qty-btn" onclick="changeOfferQty('${offer.id}', -1)">−</button>
                        <span class="offer-qty-display" id="offer-qty-${offer.id}">${qty}</span>
                        <button class="offer-qty-btn" onclick="changeOfferQty('${offer.id}', 1)">+</button>
                    </div>
                    <button class="offer-add-btn" onclick="addOfferToCart('${offer.id}')">
                        <span>🛒</span> أضف للسلة
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function changeOfferQty(offerId, delta) {
    offerQuantities[offerId] = Math.max(0, (offerQuantities[offerId] || 0) + delta);
    const el = document.getElementById(`offer-qty-${offerId}`);
    if (el) el.textContent = offerQuantities[offerId];
}

function addOfferToCart(offerId) {
    const qty = offerQuantities[offerId] || 0;
    if (qty <= 0) { alert('من فضلك اختر الكمية أولاً'); return; }
    const offer = allOffers.find(o => o.id === offerId);
    if (!offer) return;

    const productVersion = { ...offer, price: offer.sale_price, id: 'offer_' + offerId };
    const existing = cart.find(item => item.id === productVersion.id);
    if (existing) { existing.quantity += qty; }
    else { cart.push({ ...productVersion, quantity: qty }); }

    offerQuantities[offerId] = 0;
    const el = document.getElementById(`offer-qty-${offerId}`);
    if (el) el.textContent = 0;

    saveCartToLocalStorage();
    updateCartUI();
    showNotification(`تم إضافة ${offer.name} للسلة 🔥`);
}

/* ============================================================================
   EVENT LISTENERS
   ============================================================================ */

function setupEventListeners() {
    cartIcon.addEventListener('click', toggleCart);
    cartClose.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);
    orderBtn.addEventListener('click', proceedToOrder);
    themeToggle.addEventListener('click', toggleTheme);
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartSidebar.classList.contains('open')) {
            closeCart();
        }
    });
}

function handleCategoryFilter(e) {
    const category = e.currentTarget.dataset.category;
    filterByCategory(category);
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
}

/* ============================================================================
   PRODUCT FILTERING
   ============================================================================ */

function filterByCategory(category) {
    currentCategory = category;
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(p => p.category === category);
    }
    renderProducts();
}

/* ============================================================================
   RENDERING
   ============================================================================ */
function renderProducts() {
    const productsToShow = (currentCategory === 'all') ? allProducts : allProducts.filter(p => p.category === currentCategory);
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-image-wrapper">
                ${product.image_url 
                    ? `<img src="${product.image_url}" alt="${product.name}" onerror="this.innerHTML='📦'">` 
                    : `<span class="product-emoji-fallback">${product.image_emoji || '📦'}</span>`
                }
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price">EGP ${product.price}</div>
                
                <div class="quantity-control" style="margin-bottom: 10px; display: flex; justify-content: center; gap: 10px; align-items: center;">
                    <button class="qty-btn" onclick="decreaseQuantity('${product.id}')" style="width:30px; height:30px; border-radius:50%; border:1px solid #ddd;">−</button>
                    <div class="qty-display" id="qty-${product.id}" style="font-weight:bold;">${getQuantity(product.id)}</div>
                    <button class="qty-btn" onclick="increaseQuantity('${product.id}')" style="width:30px; height:30px; border-radius:50%; border:1px solid #ddd;">+</button>
                </div>
                
               <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
    <span>🛒</span>
    أضف للسلة
</button>
            </div>
        </div>
    `).join('');
}
/* ============================================================================
   QUANTITY CONTROL
   ============================================================================ */

const quantities = {};

function getQuantity(productId) {
    return quantities[productId] || 0;
}

function setQuantity(productId, value) {
    quantities[productId] = Math.max(0, value);
    updateQuantityDisplay(productId);
}

function increaseQuantity(productId) {
    setQuantity(productId, getQuantity(productId) + 1);
}

function decreaseQuantity(productId) {
    setQuantity(productId, getQuantity(productId) - 1);
}

function updateQuantityDisplay(productId) {
    const display = document.getElementById(`qty-${productId}`);
    if (display) {
        display.textContent = getQuantity(productId);
    }
}

/* ============================================================================
   CART OPERATIONS
   ============================================================================ */

function addToCart(productId) {
    const quantity = getQuantity(productId);
    
    if (quantity <= 0) {
        alert('من فضلك اختر الكمية أولاً');
        return;
    }
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }
    
    setQuantity(productId, 0);
    saveCartToLocalStorage();
    updateCartUI();
    showNotification(`تم إضافة ${product.name} للسلة`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToLocalStorage();
    updateCartUI();
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(0, newQuantity);
        if (item.quantity === 0) {
            removeFromCart(productId);
        } else {
            saveCartToLocalStorage();
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartBadge.textContent = itemCount;
    cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
    
    cartCount.textContent = itemCount;
    cartTotal.textContent = `${CURRENCY} ${total.toFixed(2)}`;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-message">سلتك فارغة</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${CURRENCY} ${item.price}</div>
                </div>
                <div class="cart-item-details">
                    <span>الكمية: ${item.quantity}</span>
                    <span>الإجمالي: ${CURRENCY} ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-qty-control">
                        <button class="cart-item-qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">−</button>
                        <div class="cart-item-qty-display">${item.quantity}</div>
                        <button class="cart-item-qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                   <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
    🗑️ إزالة
</button>
                </div>
            </div>
        `).join('');
    }
}

/* ============================================================================
   CART UI CONTROLS
   ============================================================================ */

function toggleCart() {
    cartSidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
}

function closeCart() {
    cartSidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

/* ============================================================================
   ORDER PROCESSING
   ============================================================================ */

function proceedToOrder() {
    if (cart.length === 0) {
        alert('سلتك فارغة');
        return;
    }
    
    const orderMessage = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(orderMessage)}`;
    
    logOrder();
    window.open(whatsappUrl, '_blank');
}

function generateWhatsAppMessage() {
    const header = `*📦 طلب جديد من متجر جِدّو شوبنج*\n\n`;
    const itemsList = cart.map(item => 
        `• ${item.name}\n  الكمية: ${item.quantity}\n  السعر: ${CURRENCY} ${item.price}\n  الإجمالي: ${CURRENCY} ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n\n');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const footer = `\n\n━━━━━━━━━━━━━━━━━\n*الإجمالي الكلي: ${CURRENCY} ${total.toFixed(2)}*\n━━━━━━━━━━━━━━━━━`;
    return header + itemsList + footer;
}

async function logOrder() {
    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await db.collection('orders').add({
            items: cart,
            total: total,
            status: 'pending',
            created_at: new Date()
        });
    } catch (error) {
        console.error('Error logging order:', error);
    }
}

/* ============================================================================
   LOCAL STORAGE
   ============================================================================ */

function saveCartToLocalStorage() {
    localStorage.setItem('attar_cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const saved = localStorage.getItem('attar_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (error) {
            cart = [];
        }
    }
}

/* ============================================================================
   UTILITIES
   ============================================================================ */

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #c6a664;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/* ============================================================================
   SECURITY: PREVENT INSPECT ELEMENT & CONTENT COPY
   ============================================================================ */

// 1. منع كليك يمين
document.addEventListener('contextmenu', (e) => e.preventDefault());

// 2. منع اختصارات لوحة التحكم (F12, Ctrl+Shift+I, etc.)
document.onkeydown = function(e) {
    // منع F12
    if(e.keyCode == 123) return false;

    // منع Ctrl+Shift+I (Inspect)
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;

    // منع Ctrl+Shift+C (Select element)
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false;

    // منع Ctrl+Shift+J (Console)
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;

    // منع Ctrl+U (View Source)
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
};

// 3. منع سحب الصور أو تحديد النصوص (إضافي للحماية)
document.addEventListener('dragstart', (e) => e.preventDefault());
document.styleSheets[0].insertRule('body { user-select: none; -webkit-user-select: none; }', 0);

// 4. التشويش باستخدام الـ Debugger (اختياري لكن قوي)
// لو حد فتح الـ Console، الموقع هيدخل في حالة إيقاف مؤقت (Pause)
setInterval(function() {
    debugger;
}, 100);