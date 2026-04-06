document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#product-grid');
    const filterBar = document.querySelector('#category-filters');
    const searchInput = document.querySelector('#productSearch');
    const modal = document.querySelector('#productModal');
    const modalContent = document.querySelector('#modalContent');
    const productCount = document.querySelector('#productCount');
    const cartFab = document.querySelector('#cart-fab');
    const cartFabBtn = document.querySelector('#cart-fab-btn');
    const cartCount = document.querySelector('#cart-count');
    const cartModal = document.querySelector('#cartModal');
    const cartItems = document.querySelector('#cart-items');
    const cartCheckout = document.querySelector('#cart-checkout');
    const cartClear = document.querySelector('#cart-clear');
    if (!grid) {
        return;
    }

    const fallbackProducts = Array.isArray(products) ? products : [];
    const hasCartUI = Boolean(cartFab && cartFabBtn && cartCount && cartModal && cartItems && cartCheckout && cartClear);
    let allProducts = [];
    let activeCategory = 'All';
    let searchTerm = '';
    let cart = [];
    const CART_STORAGE_KEY = 'keria_cart';

    function normalizeProduct(product) {
        return {
            id: product.id,
            name: product.name || 'Unnamed Product',
            category: product.category || 'Wellness',
            price: product.price || 'K0',
            benefits: product.benefits || '',
            image: product.image_url || product.image || 'images/default-product.jpg',
            isInStock: product.is_in_stock !== false
        };
    }

    function renderProductCards(items) {
        grid.innerHTML = '';
        if (productCount) {
            productCount.textContent = `${items.length} healthy product${items.length === 1 ? '' : 's'} available`;
        }

        if (!items.length) {
            grid.innerHTML = '<div class="product-card" style="grid-column: 1 / -1; text-align: center;"><h3 style="color: var(--keria-emerald); font-family: \"Playfair Display\", serif;">No products found</h3><p style="color: #64748b; margin-bottom: 0;">Try another category.</p></div>';
            return;
        }

        items.forEach((product) => {
            const messagePrefix = typeof CONFIG !== 'undefined' && CONFIG.whatsappMessage
                ? CONFIG.whatsappMessage
                : 'Hello Keria Wellness, I would like to order ';
            const whatsappNumber = typeof CONFIG !== 'undefined' && CONFIG.whatsapp
                ? CONFIG.whatsapp
                : '260976410975';
            const outOfStock = product.isInStock === false;
            const badgeClass = outOfStock ? 'category-badge category-badge--soldout' : 'category-badge';
            const statusText = outOfStock ? 'Sold Out' : product.category;
            const buttonClass = outOfStock ? 'btn-primary btn-primary--disabled' : 'btn-primary';
            const buttonText = outOfStock ? 'Unavailable' : (hasCartUI ? 'Add to Cart' : 'Order Now');
            const cardClass = outOfStock ? 'product-card product-card--soldout' : 'product-card';
            const modalPointerClass = modal ? 'product-card--interactive' : '';
            const actionMarkup = outOfStock
                ? `<button type="button" class="${buttonClass}" style="font-size: 0.7rem; padding: 8px 16px;">${buttonText}</button>`
                : (hasCartUI
                    ? `<button type="button" class="${buttonClass}" data-add-cart="${product.id}" style="font-size: 0.7rem; padding: 8px 16px;">${buttonText}</button>`
                    : `<a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messagePrefix + product.name)}" class="${buttonClass}" style="font-size: 0.7rem; padding: 8px 16px;" target="_blank" rel="noopener noreferrer">${buttonText}</a>`);

            const card = `
                <div class="${cardClass} ${modalPointerClass}" ${modal ? `data-product-id="${product.id}"` : ''}>
                    <div class="product-image-wrap">
                        <img src="${product.image}" onerror="this.src='images/default-product.jpg'" alt="${product.name}" style="width: 100%; display: block;">
                        ${outOfStock ? '<div class="stock-overlay">OUT OF STOCK</div>' : ''}
                    </div>
                    <div style="padding-top: 15px;">
                        <span class="${badgeClass}">${statusText}</span>
                        <h3 style="color: var(--keria-emerald); margin: 10px 0 5px 0; font-family: 'Playfair Display', serif;">${product.name}</h3>
                        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 15px;">${product.benefits}</p>

                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; margin-top: 10px; padding-top: 15px; gap: 10px;">
                            <span style="font-weight: 800; color: var(--keria-emerald);">${product.price}</span>
                            ${actionMarkup}
                        </div>
                    </div>
                </div>
            `;

            grid.innerHTML += card;
        });
    }

    function openModal(productId) {
        if (!modal || !modalContent) {
            return;
        }

        const product = allProducts.find((item) => String(item.id) === String(productId));
        if (!product) {
            return;
        }

        const messagePrefix = typeof CONFIG !== 'undefined' && CONFIG.whatsappMessage
            ? CONFIG.whatsappMessage
            : 'Hello Keria Wellness, I would like to order ';
        const whatsappNumber = typeof CONFIG !== 'undefined' && CONFIG.whatsapp
            ? CONFIG.whatsapp
            : '260976410975';
        const outOfStock = product.isInStock === false;

        const modalActionMarkup = outOfStock
            ? '<button type="button" class="btn-primary btn-primary--disabled">Unavailable</button>'
            : (hasCartUI
                ? `<button type="button" class="btn-primary" data-modal-add-cart="${product.id}">Add to Cart</button>`
                : `<a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messagePrefix + product.name)}" class="btn-primary" target="_blank" rel="noopener noreferrer">Order via WhatsApp</a>`);

        modalContent.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="modal-image" onerror="this.src='images/default-product.jpg'">
            <span class="category-badge ${outOfStock ? 'category-badge--soldout' : ''}">${outOfStock ? 'Sold Out' : product.category}</span>
            <h2 id="modal-title" class="modal-title">${product.name}</h2>
            <p class="modal-copy">${product.benefits || 'Pure wellness support for your daily routine.'}</p>
            <div class="modal-row">
                <span class="modal-price">${product.price}</span>
                ${modalActionMarkup}
            </div>
        `;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) {
            return;
        }
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function getNumericPrice(price) {
        const parsed = Number(String(price || '').replace(/[^0-9.]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatCurrency(value) {
        return `K${value.toFixed(0)}`;
    }

    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('Cart save failed:', error);
        }
        updateCartUI();
    }

    function loadCart() {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            if (!saved) {
                return;
            }

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                return;
            }

            cart = parsed
                .filter((item) => item && item.id && item.name)
                .map((item) => ({
                    ...item,
                    quantity: Math.max(1, Number(item.quantity) || 1)
                }));
        } catch (error) {
            console.error('Cart load failed:', error);
            cart = [];
        }
    }

    function renderCartItems() {
        if (!hasCartUI) {
            return;
        }

        if (!cart.length) {
            cartItems.innerHTML = '<p class="modal-copy" style="margin: 0;">Your cart is empty. Add products to build your order.</p>';
            return;
        }

        const total = cart.reduce((sum, item) => sum + (getNumericPrice(item.price) * item.quantity), 0);
        const rows = cart.map((item) => `
            <div class="cart-item">
                <div>
                    <p class="cart-item__title">${item.name}</p>
                    <p class="cart-item__meta">${item.price} x ${item.quantity}</p>
                </div>
                <button type="button" class="cart-item__remove" data-cart-remove="${item.id}">Remove</button>
            </div>
        `).join('');

        cartItems.innerHTML = `${rows}<div class="cart-total">Total: ${formatCurrency(total)}</div>`;
    }

    function updateCartUI() {
        if (!hasCartUI) {
            return;
        }

        const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = String(totalUnits);
        if (totalUnits > 0) {
            cartFab.classList.remove('hidden');
            cartFab.setAttribute('aria-hidden', 'false');
        } else {
            cartFab.classList.add('hidden');
            cartFab.setAttribute('aria-hidden', 'true');
            cartModal.classList.remove('is-open');
            cartModal.setAttribute('aria-hidden', 'true');
            if (!modal || !modal.classList.contains('is-open')) {
                document.body.style.overflow = '';
            }
        }

        renderCartItems();
    }

    function addToCart(productId) {
        const product = allProducts.find((item) => String(item.id) === String(productId));
        if (!product || product.isInStock === false) {
            return;
        }

        const existingItem = cart.find((item) => String(item.id) === String(product.id));
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        saveCart();
    }

    function toggleCartModal(forceOpen = null) {
        if (!hasCartUI) {
            return;
        }
        if (!cart.length) {
            return;
        }

        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !cartModal.classList.contains('is-open');
        if (shouldOpen) {
            cartModal.classList.add('is-open');
            cartModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        } else {
            cartModal.classList.remove('is-open');
            cartModal.setAttribute('aria-hidden', 'true');
            if (!modal || !modal.classList.contains('is-open')) {
                document.body.style.overflow = '';
            }
        }
    }

    function checkoutWhatsApp() {
        if (!cart.length) {
            return;
        }

        const whatsappNumber = typeof CONFIG !== 'undefined' && CONFIG.whatsapp
            ? CONFIG.whatsapp
            : '260976410975';

        let message = '*Keria Wellness Order Request*\n';
        message += '--------------------------\n';

        let total = 0;
        cart.forEach((item) => {
            const itemTotal = getNumericPrice(item.price) * item.quantity;
            message += `• ${item.name} (x${item.quantity}) - ${item.price}\n`;
            total += itemTotal;
        });

        message += '--------------------------\n';
        message += `*Total Estimate:* K${total.toFixed(2)}\n\n`;
        message += 'Please confirm availability and delivery details.';

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    }

    function getCategories(items) {
        return ['All', ...new Set(items.map((item) => item.category).filter(Boolean))];
    }

    function applyFilter(category) {
        activeCategory = category;
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filtered = allProducts.filter((item) => {
            const matchesCategory = category === 'All' || item.category === category;
            const haystack = `${item.name} ${item.category} ${item.benefits}`.toLowerCase();
            const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
            return matchesCategory && matchesSearch;
        });
        renderFilterButtons(getCategories(allProducts));
        renderProductCards(filtered);
    }

    function renderFilterButtons(categories) {
        if (!filterBar) {
            return;
        }

        filterBar.innerHTML = categories.map((category) => `
            <button class="filter-btn ${category === activeCategory ? 'active' : ''}" data-category="${category}">
                ${category}
            </button>
        `).join('');

        filterBar.querySelectorAll('.filter-btn').forEach((button) => {
            button.addEventListener('click', () => {
                applyFilter(button.dataset.category);
            });
        });
    }

    async function loadProducts() {
        if (!_supabase) {
            allProducts = fallbackProducts.map(normalizeProduct);
            renderFilterButtons(getCategories(allProducts));
            applyFilter('All');
            return;
        }

        try {
            const { data, error } = await _supabase
                .from('products')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                allProducts = fallbackProducts.map(normalizeProduct);
                renderFilterButtons(getCategories(allProducts));
                applyFilter('All');
                return;
            }

            const liveProducts = Array.isArray(data) ? data.map(normalizeProduct) : [];
            allProducts = liveProducts.length ? liveProducts : fallbackProducts.map(normalizeProduct);
            renderFilterButtons(getCategories(allProducts));
            applyFilter('All');
        } catch (error) {
            allProducts = fallbackProducts.map(normalizeProduct);
            renderFilterButtons(getCategories(allProducts));
            applyFilter('All');
        }
    }

    searchInput?.addEventListener('input', (event) => {
        searchTerm = event.target.value || '';
        applyFilter(activeCategory);
    });

    cartFabBtn?.addEventListener('click', () => {
        toggleCartModal(true);
    });

    cartCheckout?.addEventListener('click', () => {
        checkoutWhatsApp();
    });

    cartClear?.addEventListener('click', () => {
        cart = [];
        saveCart();
    });

    if (modal) {
        grid.addEventListener('click', (event) => {
            const addCartButton = event.target.closest('[data-add-cart]');
            if (addCartButton) {
                event.stopPropagation();
                addToCart(addCartButton.dataset.addCart);
                toggleCartModal(true);
                return;
            }

            const card = event.target.closest('[data-product-id]');
            if (!card) {
                return;
            }
            openModal(card.dataset.productId);
        });

        modal.addEventListener('click', (event) => {
            if (event.target.closest('[data-modal-close]')) {
                closeModal();
                return;
            }

            const modalAddCart = event.target.closest('[data-modal-add-cart]');
            if (modalAddCart) {
                addToCart(modalAddCart.dataset.modalAddCart);
                closeModal();
                toggleCartModal(true);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal();
                toggleCartModal(false);
            }
        });
    }

    cartModal?.addEventListener('click', (event) => {
        if (event.target.closest('[data-cart-close]')) {
            toggleCartModal(false);
            return;
        }

        const removeBtn = event.target.closest('[data-cart-remove]');
        if (!removeBtn) {
            return;
        }

        const removeId = removeBtn.dataset.cartRemove;
        const existing = cart.find((item) => String(item.id) === String(removeId));
        if (existing) {
            cart = cart.filter((item) => String(item.id) !== String(removeId));
            saveCart();
        }
    });

    loadCart();
    updateCartUI();

    loadProducts();
});
