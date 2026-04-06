document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#product-grid');
    if (!grid) {
        return;
    }

    const fallbackProducts = Array.isArray(products) ? products : [];

    function normalizeProduct(product) {
        return {
            id: product.id,
            name: product.name || 'Unnamed Product',
            category: product.category || 'Wellness',
            price: product.price || 'K0',
            benefits: product.benefits || '',
            image: product.image_url || product.image || 'images/default-product.jpg'
        };
    }

    function renderProductCards(items) {
        grid.innerHTML = '';
        items.forEach((product) => {
            const messagePrefix = typeof CONFIG !== 'undefined' && CONFIG.whatsappMessage
                ? CONFIG.whatsappMessage
                : 'Hello Keria Wellness, I would like to order ';
            const whatsappNumber = typeof CONFIG !== 'undefined' && CONFIG.whatsapp
                ? CONFIG.whatsapp
                : '260976410975';

            const card = `
                <div class="product-card">
                    <div style="overflow: hidden; border-radius: 1.5rem;">
                        <img src="${product.image}" onerror="this.src='images/default-product.jpg'" alt="${product.name}" style="width: 100%; display: block;">
                    </div>
                    <div style="padding-top: 15px;">
                        <span class="category-badge">${product.category}</span>
                        <h3 style="color: var(--keria-emerald); margin: 10px 0 5px 0; font-family: 'Playfair Display', serif;">${product.name}</h3>
                        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 15px;">${product.benefits}</p>

                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; margin-top: 10px; padding-top: 15px; gap: 10px;">
                            <span style="font-weight: 800; color: var(--keria-emerald);">${product.price}</span>
                            <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messagePrefix + product.name)}" class="btn-primary" style="font-size: 0.7rem; padding: 8px 16px;" target="_blank" rel="noopener noreferrer">Order Now</a>
                        </div>
                    </div>
                </div>
            `;

            grid.innerHTML += card;
        });
    }

    async function loadProducts() {
        if (!supabaseClient) {
            renderProductCards(fallbackProducts.map(normalizeProduct));
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                renderProductCards(fallbackProducts.map(normalizeProduct));
                return;
            }

            const liveProducts = Array.isArray(data) ? data.map(normalizeProduct) : [];
            renderProductCards(liveProducts.length ? liveProducts : fallbackProducts.map(normalizeProduct));
        } catch (error) {
            renderProductCards(fallbackProducts.map(normalizeProduct));
        }
    }

    loadProducts();
});
