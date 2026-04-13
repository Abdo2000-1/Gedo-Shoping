// admin.js



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

async function addProduct() {
    const name = document.getElementById('pName').value;
    const price = parseFloat(document.getElementById('pPrice').value);
    const category = document.getElementById('pCategory').value;
    const imgUrl = document.getElementById('pImageUrl').value; // جلب رابط الصورة
    const emoji = document.getElementById('pEmoji').value || '📦';
    const desc = document.getElementById('pDesc').value;
    const nameEn = document.getElementById('pNameEn').value;

    if (!name || !price) {
        alert("يا سامح لازم الاسم والسعر!");
        return;
    }

    try {
        await db.collection("products").add({
            name: name,
            name_en: nameEn,
            price: price,
            category: category,
            image_url: imgUrl, // حفظ الرابط
            image_emoji: emoji,
            description: desc,
            active: true,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("تم الحفظ بنجاح!");
        clearForm();
        loadAdminProducts();
    } catch (e) { alert("خطأ في الحفظ!"); }
}

async function loadAdminProducts() {
    const listDiv = document.getElementById('adminProductsList');
    listDiv.innerHTML = "جاري التحميل...";
    const snapshot = await db.collection("products").get();
    listDiv.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const productRow = document.createElement('div');
        productRow.style = "border-bottom: 1px solid #ddd; padding: 10px; display: flex; justify-content: space-between; align-items: center;";
        productRow.innerHTML = `
            <div><strong>${data.name}</strong> - ${data.price} EGP</div>
            <div>
                <button onclick="updatePrice('${doc.id}', ${data.price})" style="background:orange; color:white; border:none; padding:5px; border-radius:5px;">تعديل السعر</button>
                <button onclick="deleteProduct('${doc.id}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px;">حذف</button>
            </div>
        `;
        listDiv.appendChild(productRow);
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

function clearForm() {
    document.getElementById('pName').value = "";
    document.getElementById('pPrice').value = "";
    document.getElementById('pImageUrl').value = "";
    document.getElementById('pEmoji').value = "";
    document.getElementById('pDesc').value = "";
    document.getElementById('pCategory').value = "spices";
}

function logout() { location.reload(); }



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