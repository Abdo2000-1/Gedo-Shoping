// بيانات الدخول اللي حددتها لسامح
const ADMIN_EMAIL = "s.kamal2000@gmail.com";
const ADMIN_PASS = "sameh@egypt2000";

function handleLogin() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPassword').value;

    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        sessionStorage.setItem('isAdmin', 'true'); // حفظ حالة الدخول مؤقتاً
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

async function addProduct() {
    const name = document.getElementById('pName').value;
    const price = Number(document.getElementById('pPrice').value);
    
    if(!name || !price) return alert("من فضلك املأ البيانات الأساسية");

    try {
        await db.collection("products").add({
            name: name,
            name_en: document.getElementById('pNameEn').value,
            price: price,
            category: document.getElementById('pCategory').value,
            image_emoji: document.getElementById('pEmoji').value || "📦",
            description: document.getElementById('pDesc').value,
            active: true,
            featured: false,
            stock: 100
        });
        alert("تم إضافة المنتج بنجاح!");
        location.reload(); // تفريغ الخانات
    } catch (error) {
        console.error("Error: ", error);
        alert("حصل خطأ أثناء الإضافة");
    }
}

function logout() {
    sessionStorage.removeItem('isAdmin');
    location.reload();
}