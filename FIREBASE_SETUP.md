# Firebase Setup & Data Structure Guide

## 📋 Table of Contents
1. [Firebase Project Setup](#firebase-project-setup)
2. [Firestore Data Structure](#firestore-data-structure)
3. [Admin Panel Setup (Google Sheets)](#admin-panel-setup)
4. [Security Rules](#security-rules)
5. [Deployment Guide](#deployment-guide)

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `attar-shop` (or your preferred name)
4. Continue through the setup wizard
5. Enable Google Analytics (optional)

### Step 2: Get Project Credentials

1. Go to Project Settings (⚙️ gear icon)
2. Copy the firebaseConfig object
3. Paste it into `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 3: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in production mode** (we'll add security rules)
4. Select your region (closest to your users)
5. Click **Create**

### Step 4: Add WhatsApp Number

1. Open `firebase-config.js`
2. Update the WhatsApp number:

```javascript
const WHATSAPP_NUMBER = "+201234567890"; // Your WhatsApp number
```

---

## Firestore Data Structure

### Collection: `products`

**Document Schema:**

```javascript
{
  // Generated automatically (Firebase ID)
  id: "product_001",
  
  // Basic Info
  name: "عسل جبلي طبيعي",           // Arabic name
  name_en: "Mountain Honey",         // English name
  description: "عسل طبيعي 100%",    // Optional: product description
  
  // Pricing & Availability
  price: 120,                        // Price in EGP (number)
  stock: 50,                         // Available quantity
  
  // Category (must match these values exactly)
  category: "spices",  // Options: spices | herbs | coffee | oils | incense | cosmetics
  
  // Display
  image_emoji: "🍯",                 // Emoji for product image
  // OR image_url: "https://..."    // URL to product image (optional)
  
  // Status
  active: true,                      // Set to false to hide product
  featured: false,                   // Optional: highlight on homepage
  
  // Admin Info
  created_at: Timestamp,             // Automatically set
  updated_at: Timestamp,             // Automatically set
  admin_notes: ""                    // Internal notes (optional)
}
```

### Collection: `orders`

**Document Schema:**

```javascript
{
  // Automatically generated
  id: "order_001",
  
  // Order Items
  items: [
    {
      product_id: "product_001",
      product_name: "عسل جبلي طبيعي",
      quantity: 2,
      price: 120
    }
  ],
  
  // Totals
  total: 240,
  
  // Status
  status: "pending",  // Options: pending | confirmed | shipped | delivered
  
  // Timestamps
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Collection: `settings` (Optional)

**Document Schema:**

```javascript
{
  id: "shop_settings",
  
  shop_name: "Nahl Attar",
  shop_description: "مح النحل",
  whatsapp_number: "+201234567890",
  email: "shop@example.com",
  
  // Limits
  min_order_value: 100,  // Minimum order in EGP
  delivery_fee: 0,
  
  // Settings
  currency: "EGP",
  language: "ar",
  
  updated_at: Timestamp
}
```

---

## Admin Panel Setup

### Method 1: Firestore Console (Manual)

The easiest way for small stores (under 100 products):

1. Go to **Firestore Database** in Firebase Console
2. Click **Create collection** → name it `products`
3. Click **Add document** → Auto ID
4. Fill in the fields matching the schema above
5. Repeat for each product

**Advantages:**
- No coding required
- Direct in Firebase Console
- Perfect for < 50 products

**Disadvantages:**
- Not user-friendly for frequent updates
- No batch operations

### Method 2: Google Sheets Integration (Recommended)

Use Google Sheets as an easy admin interface:

**Setup:**

1. Create a Google Sheet with these columns:
   ```
   A: name (Arabic)
   B: name_en (English)
   C: description
   D: price
   E: stock
   F: category
   G: image_emoji
   H: active (TRUE/FALSE)
   I: featured (TRUE/FALSE)
   ```

2. Use Apps Script to sync to Firestore:
   ```javascript
   // In Google Sheets, go to Extensions → Apps Script
   
   function syncToFirestore() {
     const sheet = SpreadsheetApp.getActiveSheet();
     const data = sheet.getDataRange().getValues();
     
     // Skip header row
     for (let i = 1; i < data.length; i++) {
       const row = data[i];
       const productId = `product_${i}`;
       
       const product = {
         name: row[0],
         name_en: row[1],
         description: row[2],
         price: parseFloat(row[3]),
         stock: parseInt(row[4]),
         category: row[5],
         image_emoji: row[6],
         active: row[7] === true || row[7] === 'TRUE',
         featured: row[8] === true || row[8] === 'TRUE',
         updated_at: new Date()
       };
       
       // Send to Firebase via HTTP
       const payload = JSON.stringify(product);
       const options = {
         method: 'post',
         contentType: 'application/json',
         payload: payload,
         muteHttpExceptions: true
       };
       
       const url = `https://YOUR_PROJECT.firebaseapp.com/products/${productId}`;
       UrlFetchApp.fetch(url, options);
     }
     
     Logger.log('Sync completed!');
   }
   
   // Create a trigger: Extensions → Apps Script → Triggers
   // Run syncToFirestore every 1 hour
   ```

3. Set up automatic triggers to sync hourly

**Advantages:**
- Familiar Google Sheets interface
- Easy bulk updates
- Version history built-in
- Free

**Disadvantages:**
- Requires some setup
- Slight delay in updates (1 hour)

### Method 3: Simple Web Admin Panel

Create a basic admin panel (optional future enhancement):

```html
<!-- admin.html - Simple admin panel -->
<form>
  <input name="name" placeholder="Product Name (Arabic)">
  <input name="name_en" placeholder="Product Name (English)">
  <input name="price" type="number" placeholder="Price">
  <select name="category">
    <option value="spices">Spices</option>
    <option value="herbs">Herbs</option>
    <option value="oils">Oils</option>
  </select>
  <input name="image_emoji" placeholder="Emoji">
  <button type="submit">Add Product</button>
</form>
```

---

## Security Rules

### Production Security Rules

Replace default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products: Public read, admin write
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid in ["ADMIN_UID_1", "ADMIN_UID_2"];
    }
    
    // Orders: Public write (anyone can submit), admin read
    match /orders/{document=**} {
      allow read: if request.auth.uid in ["ADMIN_UID_1", "ADMIN_UID_2"];
      allow create: if true;
      allow write: if false;
    }
    
    // Settings: Public read, admin write
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid in ["ADMIN_UID_1", "ADMIN_UID_2"];
    }
  }
}
```

### How to Find Your Admin UID:

1. In Firebase Console → Authentication
2. Create a user for admin (or use existing)
3. Copy the User ID (UID)
4. Paste into security rules

---

## Deployment Guide

### Deploy to GitHub Pages (Free Hosting)

1. **Create GitHub Repository**
   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/attar-shop.git
   ```

2. **Push Files**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Source: `main` branch
   - Save
   - Your site is live at: `https://YOUR_USERNAME.github.io/attar-shop/`

4. **Enable HTTPS**
   - Automatically enabled for GitHub Pages
   - Use custom domain (optional): Settings → Pages → Custom domain

### Alternative: Deploy to Netlify (Also Free)

1. Go to [Netlify](https://netlify.com)
2. Connect GitHub repo
3. Deploy automatically on each push
4. Custom domain included

### Alternative: Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```

2. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

---

## Quick Start Checklist

- [ ] Create Firebase project
- [ ] Enable Firestore
- [ ] Copy firebaseConfig to code
- [ ] Update WhatsApp number
- [ ] Create `products` collection
- [ ] Add 5-10 test products
- [ ] Test add to cart
- [ ] Test WhatsApp order
- [ ] Set security rules
- [ ] Deploy to GitHub Pages / Netlify
- [ ] Test on mobile device
- [ ] Share link with customers

---

## Monthly Maintenance

### Every Week:
- Check orders in Firestore
- Respond to WhatsApp orders
- Monitor stock levels

### Monthly:
- Update product prices
- Add seasonal products
- Remove out-of-stock items
- Check analytics (if enabled)

### Quarterly:
- Review customer feedback
- Update product descriptions
- Optimize images/emojis

---

## Troubleshooting

**Products not loading?**
- Check Firebase config credentials
- Verify Firestore has products collection
- Check browser console for errors (F12)
- Disable ad blocker

**WhatsApp not opening?**
- Verify phone number includes country code (+20)
- Ensure phone has WhatsApp installed
- Try opening WhatsApp manually, then try again

**Cart not saving?**
- Clear browser cookies/cache
- Check browser localStorage enabled
- Try different browser

**Firestore errors?**
- Check security rules (allow read)
- Verify Internet connection
- Check Firebase status page

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [WhatsApp API](https://www.whatsapp.com/business/api)
- [GitHub Pages Guide](https://pages.github.com/)

---

Last updated: 2024
Version: 1.0
