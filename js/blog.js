document.addEventListener('DOMContentLoaded', async () => {
    const postsRoot = document.querySelector('#blog-posts');
    const emptyState = document.querySelector('#blog-empty');
    const listing = document.querySelector('#blog-listing');
    const detail = document.querySelector('#blog-detail');

    if (!postsRoot || !emptyState || !listing || !detail) {
        return;
    }

    if (!_supabase) {
        emptyState.textContent = 'Blog is temporarily unavailable. Please try again later.';
        emptyState.classList.remove('hidden');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (slug) {
        await renderSinglePost(slug, listing, detail, emptyState);
        return;
    }

    await renderPublishedPosts(postsRoot, emptyState);
});

function formatDate(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString('en-ZM', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function renderPublishedPosts(postsRoot, emptyState) {
    const { data, error } = await _supabase
        .from('blog_posts')
        .select('title, slug, excerpt, category, image_url, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) {
        emptyState.textContent = 'Could not load blog posts right now.';
        emptyState.classList.remove('hidden');
        return;
    }

    if (!Array.isArray(data) || !data.length) {
        emptyState.classList.remove('hidden');
        return;
    }

    postsRoot.innerHTML = data.map((post) => {
        const imageMarkup = post.image_url
            ? `<img class="blog-card__image" src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}">`
            : '<div class="blog-card__image blog-card__image--placeholder"></div>';

        return `
            <article class="blog-card">
                ${imageMarkup}
                <div class="blog-card__body">
                    <span class="category-badge">${escapeHtml(post.category || 'Wellness Tips')}</span>
                    <h3 class="blog-card__title">${escapeHtml(post.title)}</h3>
                    <p class="blog-card__meta">${escapeHtml(formatDate(post.created_at))}</p>
                    <p class="blog-card__excerpt">${escapeHtml(post.excerpt || '')}</p>
                    <a class="btn-primary blog-card__cta" href="blog.html?slug=${encodeURIComponent(post.slug)}">Read Article</a>
                </div>
            </article>
        `;
    }).join('');
}

async function renderSinglePost(slug, listing, detail, emptyState) {
    const { data, error } = await _supabase
        .from('blog_posts')
        .select('title, content, excerpt, category, image_url, created_at, slug')
        .eq('status', 'published')
        .eq('slug', slug)
        .maybeSingle();

    if (error || !data) {
        emptyState.textContent = 'That article could not be found.';
        emptyState.classList.remove('hidden');
        return;
    }

    listing.classList.add('hidden');
    detail.classList.remove('hidden');

    const imageMarkup = data.image_url
        ? `<img class="blog-detail__image" src="${escapeHtml(data.image_url)}" alt="${escapeHtml(data.title)}">`
        : '';

    detail.innerHTML = `
        <a href="blog.html" class="blog-back-link">&larr; Back to all articles</a>
        <span class="category-badge">${escapeHtml(data.category || 'Wellness Tips')}</span>
        <h2 class="blog-detail__title">${escapeHtml(data.title)}</h2>
        <p class="blog-card__meta">${escapeHtml(formatDate(data.created_at))}</p>
        ${imageMarkup}
        <div class="blog-detail__content">${data.content}</div>
    `;
}
