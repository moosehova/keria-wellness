document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('product-grid');
    if (!grid || !Array.isArray(products)) {
        return;
    }

    grid.innerHTML = products.map((product) => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3 style="color: var(--keria-emerald); margin-top: 15px; font-family: 'Playfair Display', serif;">${product.name}</h3>
            <p class="product-meta">${product.benefits}</p>
            <div class="product-row">
                <span class="price">${product.price}</span>
                <a href="https://wa.me/260976410975?text=${encodeURIComponent(`I want to order ${product.name}`)}" class="btn-primary card-btn" target="_blank" rel="noopener noreferrer">Order Now</a>
            </div>
        </div>
    `).join('');
});
