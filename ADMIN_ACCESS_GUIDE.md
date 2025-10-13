# 🔧 Admin Product Editor Access Guide

## 🚨 IMPORTANT: Correct URLs Only!

### ❌ Wrong URLs (These Will Give 404 Errors):
- ~~http://localhost:5001/products/1000/edit~~
- ~~http://localhost:5001/products/105/edit~~
- Any URL with `/products/` instead of `/admin/products/`
- Any product ID that doesn't exist (like 1000)

### ✅ Correct Admin URLs:

#### Main Admin Products Page:
**http://localhost:5001/admin/products**

#### Dan's Gold Products (Both Variants):
1. **Dan's Gold Organic Dairy Compost (ID: 105)**
   - **http://localhost:5001/admin/products/105**

2. **Dans Gold Organic Dairy Compost (ID: 101)**  
   - **http://localhost:5001/admin/products/101**

#### All Pay & Pickup Products:
1. **Amazonian Dark Earth**: http://localhost:5001/admin/products/98
2. **Dans Gold Compost**: http://localhost:5001/admin/products/101
3. **Dan's Gold Compost**: http://localhost:5001/admin/products/105  
4. **Mikey's Worm Poop**: http://localhost:5001/admin/products/109
5. **Tee Top Divot Repair**: http://localhost:5001/admin/products/122

## 🔐 Admin Access Requirements:

### Before accessing admin pages, you need to:
1. **Login to admin**: http://localhost:5001/admin/login
2. **Have valid admin token** stored in browser
3. **Use the `/admin/` path prefix** for all admin functions

### If you get authentication errors:
1. Clear browser cache/cookies
2. Login again at `/admin/login`
3. Make sure you're using the admin credentials

## 📊 Valid Product IDs Range:
- **Minimum ID**: 98
- **Maximum ID**: 131  
- **Total Products**: 34
- **Any ID outside this range will give 404**

## 🎯 Quick Access Steps:
1. Go to: **http://localhost:5001/admin/products**
2. Find "Dan's Gold" in the product list
3. Click the edit button, or
4. Use direct URL: **http://localhost:5001/admin/products/105**

## 🚀 Photo Upload Features Available:
- Hero image upload/replacement
- Gallery image management  
- Drag & drop support
- Image preview before upload
- Texture photo URL management

Remember: Always use `/admin/products/` not `/products/` for editing!