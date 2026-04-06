let inventory = [];
let editingId = null;
const categorySeed = [...new Set(inventory.map((item) => item.category).filter(Boolean))];
if (!Array.isArray(window.categories) || !window.categories.length) {
    window.categories = categorySeed.length ? categorySeed : ['Nuts', 'Seeds', 'Specialty'];
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

function syncCategories(selectedCategory) {
    const tagContainer = document.getElementById('category-tags');
    const dropdown = document.getElementById('p-category');
    const currentSelected = selectedCategory || dropdown.value || window.categories[0] || '';

    tagContainer.innerHTML = window.categories.map((cat, index) => `
        <span class="bg-white border border-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">
            ${cat}
            <button onclick="deleteCategory(${index})" class="text-red-400 hover:text-red-600">&times;</button>
        </span>
    `).join('');

    dropdown.innerHTML = window.categories.map((cat) => `
        <option value="${cat}">${cat}</option>
    `).join('');

    if (window.categories.includes(currentSelected)) {
        dropdown.value = currentSelected;
    }
}

function hydrateCategoriesFromInventory() {
    const inventoryCategories = [...new Set(inventory.map((item) => item.category).filter(Boolean))];
    const merged = [...new Set([...(window.categories || []), ...inventoryCategories])];
    window.categories = merged.length ? merged : ['Nuts', 'Seeds', 'Specialty'];
    syncCategories();
}

function addCategory() {
    const input = document.getElementById('new-cat-name');
    const value = input.value.trim();
    if (value !== '' && !window.categories.includes(value)) {
        window.categories.push(value);
        input.value = '';
        syncCategories(value);
        alert('Category list updated.');
    }
}

function deleteCategory(index) {
    if (index < 0 || index >= window.categories.length) {
        return;
    }
    if (confirm('Remove this category? Products already assigned to it will keep their current value.')) {
        window.categories.splice(index, 1);
        syncCategories();
    }
}

function renderInventory() {
    const list = document.getElementById('admin-product-list');
    document.getElementById('item-count').innerText = `${inventory.length} Items`;

    if (!list) {
        return;
    }

    if (!inventory.length) {
        list.innerHTML = `
            <tr>
                <td colspan="5" class="p-6 text-sm text-slate-400 text-center">No products found.</td>
            </tr>
        `;
        return;
    }

    list.innerHTML = inventory.map((product, index) => `
        <tr class="border-b border-emerald-900/10">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <img src="${product.image}" class="w-12 h-12 rounded-xl object-cover" onerror="this.src='https://via.placeholder.com/120'">
                    <div>
                        <p class="text-xs font-bold text-emerald-900">${product.name}</p>
                        <p class="text-[11px] text-slate-500">${product.benefits || ''}</p>
                    </div>
                </div>
            </td>
            <td class="p-4 text-xs text-slate-500">${product.category}</td>
            <td class="p-4 text-xs text-emerald-700 font-black">${product.price}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-full text-[9px] ${product.is_in_stock === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                    ${product.is_in_stock === false ? 'OUT OF STOCK' : 'IN STOCK'}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="editProduct(${index})" class="text-blue-600 hover:text-blue-800 text-xs font-bold mr-3">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
            </td>
        </tr>
    `).join('');
}

function editProduct(index) {
    const product = inventory[index];
    if (!product) {
        return;
    }

    document.getElementById('form-title').innerText = 'Edit Product';
    document.getElementById('edit-index').value = index;
    editingId = product.id || null;
    document.getElementById('p-name').value = product.name || '';
    document.getElementById('p-price').value = product.price || '';
    document.getElementById('p-benefits').value = product.benefits || '';
    document.getElementById('is_in_stock').checked = product.is_in_stock !== false;

    if (product.category && !window.categories.includes(product.category)) {
        window.categories.push(product.category);
        syncCategories(product.category);
    }

    document.getElementById('p-category').value = product.category || 'Nuts';
    document.getElementById('p-image').value = product.image || '';
    document.getElementById('product-image-file').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveProduct() {
    const index = parseInt(document.getElementById('edit-index').value, 10);
    const fileInput = document.getElementById('product-image-file');
    const urlInput = document.getElementById('p-image').value.trim();
    const existingImage = index >= 0 && inventory[index] ? inventory[index].image : '';

    let imageData = urlInput || existingImage;

    if (fileInput.files && fileInput.files[0]) {
        try {
            imageData = await getBase64(fileInput.files[0]);
        } catch (error) {
            alert(`Error reading image file: ${error.message}`);
            return;
        }
    }

    const newProduct = {
        name: document.getElementById('p-name').value.trim(),
        price: document.getElementById('p-price').value.trim(),
        category: document.getElementById('p-category').value,
        benefits: document.getElementById('p-benefits').value.trim(),
        image: imageData,
        is_in_stock: document.getElementById('is_in_stock').checked
    };

    if (!newProduct.name || !newProduct.price || !newProduct.image) {
        alert('Please complete name, price, and upload or paste an image before saving.');
        return;
    }

    if (_supabase) {
        const payload = {
            name: newProduct.name,
            price: newProduct.price,
            category: newProduct.category,
            benefits: newProduct.benefits,
            image_url: newProduct.image,
            is_in_stock: newProduct.is_in_stock
        };

        let error;
        if (editingId) {
            ({ error } = await _supabase.from('products').update(payload).eq('id', editingId));
        } else {
            ({ error } = await _supabase.from('products').insert([payload]));
        }

        if (error) {
            console.error('Error saving:', error.message);
            alert('Failed to save. Check console.');
            return;
        }

        await loadInventory();
    } else {
        if (index === -1) {
            inventory.push(newProduct);
        } else {
            inventory[index] = { ...inventory[index], ...newProduct };
        }
        renderInventory();
    }

    if (newProduct.category && !window.categories.includes(newProduct.category)) {
        window.categories.push(newProduct.category);
    }

    resetForm();
    alert(_supabase ? 'Success! Product is now live on Keria Wellness.' : 'Inventory updated locally. Generate product data to export.');
}

async function deleteProduct(id) {
    const item = inventory.find((product) => product.id === id);
    if (!item) {
        return;
    }

    if (!confirm('Are you sure you want to remove this product from Keria Wellness?')) {
        return;
    }

    if (_supabase && item.id) {
        const { error } = await _supabase.from('products').delete().eq('id', item.id);
        if (error) {
            console.error('Admin Fetch Error:', error.message);
            alert('Error deleting product');
            return;
        }
        await refreshAdminTable();
    } else {
        inventory = inventory.filter((product) => product.id !== id);
        renderInventory();
    }

    resetForm();
}

function resetForm() {
    document.getElementById('admin-form').reset();
    document.getElementById('edit-index').value = '-1';
    document.getElementById('form-title').innerText = 'Add New Product';
    editingId = null;
    document.getElementById('product-image-file').value = '';
    document.getElementById('p-image').value = '';
    document.getElementById('p-benefits').value = '';
    document.getElementById('is_in_stock').checked = true;
    syncCategories();
}

function buildProductsCode() {
    const portable = inventory.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        benefits: item.benefits || '',
        image: item.image,
        is_in_stock: item.is_in_stock !== false
    }));
    return `const products = ${JSON.stringify(portable, null, 4)};`;
}

function exportCode() {
    const output = document.getElementById('output-code');
    output.classList.remove('hidden');
    output.textContent = buildProductsCode();
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function exportData() {
    const code = buildProductsCode();
    console.log(code);

    try {
        await navigator.clipboard.writeText(code);
        alert('Product code copied. Paste it into js/products.js, then commit and push.');
    } catch (error) {
        alert('Code printed to console. Copy it from DevTools Console and paste into js/products.js.');
    }
}

async function refreshAdminTable() {
    if (!_supabase) {
        renderInventory();
        hydrateCategoriesFromInventory();
        return;
    }

    const { data, error } = await _supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Admin Fetch Error:', error.message);
        renderInventory();
        hydrateCategoriesFromInventory();
        return;
    }

    inventory = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        benefits: item.benefits,
        image: item.image_url,
        is_in_stock: item.is_in_stock !== false
    }));

    renderInventory();
    hydrateCategoriesFromInventory();
}

async function loadInventory() {
    await refreshAdminTable();
}

window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.editProduct = editProduct;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.resetForm = resetForm;
window.exportCode = exportCode;
window.exportData = exportData;
window.refreshAdminTable = refreshAdminTable;

window.addEventListener('DOMContentLoaded', () => {
    syncCategories();
    refreshAdminTable();
});
