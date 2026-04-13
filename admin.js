
/* ============ LOGIN ============ */
function handleLogin() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPassword').value;
    if (email === "s.kamal2000@gmail.com" && pass === "sameh@egypt2000") {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadAdminProducts();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

/* ============ TABS ============ */
function switchTab(tab) {
    document.getElementById('productsTab').style.display = tab === 'products' ? 'block' : 'none';
    document.getElementById('offersTab').style.display = tab === 'offers' ? 'block' : 'none';
    if (tab === 'offers') loadAdminOffers();
    if (tab === 'products') loadAdminProducts();
}

/* ============ CLOUDINARY WIDGET LOGIC ============ */

const myWidget = cloudinary.createUploadWidget({
    cloudName: 'dcjzx63jq', 
    uploadPreset: 'gedo_shop_preset' 
}, (error, result) => { 
    if (!error && result && result.event === "success") { 
        const directLink = result.info.secure_url;
        
       
        const isProductsTab = document.getElementById('productsTab').style.display !== 'none';
        const targetInputId = isProductsTab ? 'pImageUrl' : 'oImageUrl';
        
        const inputField = document.getElementById(targetInputId);
        inputField.value = directLink;
        
       
        inputField.style.borderColor = "#4caf50";
        inputField.style.backgroundColor = "#f1f8e9";
        
        alert("✅ تم الرفع ووضع الرابط بنجاح!");
    }
});


document.addEventListener('click', function(e) {
    if(e.target && e.target.classList.contains('cloudinary-button-trigger')){
        myWidget.open();
    }
});

/* ============ PRODUCTS TAB ============ */
async function addProduct() {
    const name = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const category = document.getElementById('pCategory').value;
    const emoji = document.getElementById('pEmoji').value || '📦';
    const desc = document.getElementById('pDesc').value || '';
    const nameEn = document.getElementById('pNameEn').value || '';
    const imageUrl = document.getElementById('pImageUrl').value.trim();

    if (!name || !price) { 
        alert("❌ لازم تكتب الاسم والسعر!"); 
        return; 
    }

    const btn = document.getElementById('submitBtn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ جاري الحفظ...';
    btn.disabled = true;

    try {
        await db.collection("products").add({
            name,
            name_en: nameEn,
            price,
            category,
            image_url: imageUrl || '',
            image_emoji: emoji,
            description: desc,
            active: true,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ تم حفظ المنتج بنجاح!");
        clearProductForm();
        loadAdminProducts();
        if (window.opener) setTimeout(() => window.opener.location.reload(), 600);
    } catch (e) {
        alert("❌ خطأ في الحفظ: " + e.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function loadAdminProducts() {
    const listDiv = document.getElementById('adminProductsList');
    listDiv.innerHTML = "⏳ جاري التحميل...";
    const snapshot = await db.collection("products").get();
    listDiv.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const row = document.createElement('div');
        row.style = "border-bottom:1px solid #ddd; padding:10px; display:flex; justify-content:space-between; align-items:center; gap:8px;";
        row.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                ${data.image_url ? `<img src="${data.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">` : `<span style="font-size:28px">${data.image_emoji || '📦'}</span>`}
                <div>
                    <strong>${data.name}</strong>
                    <div style="font-size:12px;color:#888">${data.price} EGP</div>
                </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
                <button onclick="updatePrice('${doc.id}', ${data.price})" style="background:orange;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;">تعديل السعر</button>
                <button onclick="deleteProduct('${doc.id}')" style="background:red;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;">حذف</button>
            </div>
        `;
        listDiv.appendChild(row);
    });
}

async function updatePrice(id, oldPrice) {
    const newPrice = prompt("السعر الجديد:", oldPrice);
    if (newPrice) {
        await db.collection("products").doc(id).update({ price: parseFloat(newPrice) });
        loadAdminProducts();
    }
}

async function deleteProduct(id) {
    if (confirm("حذف نهائي؟")) {
        await db.collection("products").doc(id).delete();
        loadAdminProducts();
    }
}

function clearProductForm() {
    ['pName','pPrice','pEmoji','pDesc','pNameEn','pImageUrl'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.style.borderColor = ""; el.style.backgroundColor = ""; }
    });
}

/* ============ OFFERS TAB ============ */
async function addOffer() {
    const name = document.getElementById('oName').value.trim();
    const originalPrice = parseFloat(document.getElementById('oOriginalPrice').value);
    const salePrice = parseFloat(document.getElementById('oSalePrice').value);
    const emoji = document.getElementById('oEmoji').value || '🏷️';
    const desc = document.getElementById('oDesc').value || '';
    const imageUrl = document.getElementById('oImageUrl').value.trim();

    if (!name || !originalPrice || !salePrice) { 
        alert("❌ لازم الاسم والأسعار!"); 
        return; 
    }

    try {
        await db.collection("offers").add({
            name,
            original_price: originalPrice,
            sale_price: salePrice,
            image_url: imageUrl || '',
            image_emoji: emoji,
            description: desc,
            active: true,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("🔥 تم نشر العرض بنجاح!");
        clearOfferForm();
        loadAdminOffers();
        if (window.opener) setTimeout(() => window.opener.location.reload(), 600);
    } catch (e) {
        alert("❌ خطأ في النشر: " + e.message);
    }
}

async function loadAdminOffers() {
    const listDiv = document.getElementById('adminOffersList');
    listDiv.innerHTML = "⏳ جاري التحميل...";
    const snapshot = await db.collection("offers").get();
    listDiv.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const discount = Math.round(((data.original_price - data.sale_price) / data.original_price) * 100);
        const row = document.createElement('div');
        row.style = "border-bottom:1px solid #ddd; padding:10px; display:flex; justify-content:space-between; align-items:center; gap:8px;";
        row.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                ${data.image_url ? `<img src="${data.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">` : `<span style="font-size:28px">${data.image_emoji || '🏷️'}</span>`}
                <div>
                    <strong>${data.name}</strong>
                    <div style="font-size:12px;color:#888">${data.sale_price} EGP <span style="color:red">-${discount}%</span></div>
                </div>
            </div>
            <button onclick="deleteOffer('${doc.id}')" style="background:red;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;">حذف</button>
        `;
        listDiv.appendChild(row);
    });
}

async function deleteOffer(id) {
    if (confirm("حذف العرض نهائياً؟")) {
        await db.collection("offers").doc(id).delete();
        loadAdminOffers();
    }
}

function clearOfferForm() {
    ['oName','oOriginalPrice','oSalePrice','oEmoji','oDesc','oImageUrl'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.style.borderColor = ""; el.style.backgroundColor = ""; }
    });
}

function logout() { location.reload(); }

/* ============ SECURITY ============ */
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.onkeydown = function(e) {
    if(e.keyCode == 123) return false;
    if(e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) return false;
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
};