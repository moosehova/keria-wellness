const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BRAND_NAME = process.env.BRAND_NAME || 'Keria Wellness';

function requireEnv(name, value) {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function excerptFromHtml(html, maxLength = 180) {
    const plain = String(html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (plain.length <= maxLength) {
        return plain;
    }
    return `${plain.slice(0, maxLength - 1)}...`;
}

async function generatePostWithOpenAI() {
    const prompt = [
        `You are a senior wellness content writer for ${BRAND_NAME}.`,
        'Create one original, factual, SEO-friendly blog post draft for a wellness ecommerce brand in Zambia.',
        'Topic constraints: natural nutrition, sea moss, nuts, seeds, ginger, daily wellness routines.',
        'Write in a warm, expert tone that feels premium and practical.',
        'Return strict JSON with keys: title, category, content_html.',
        'Rules:',
        '- title: 45-75 characters',
        '- category: one of Wellness Tips, Nutrition, Product Education',
        '- content_html: 700-1000 words in semantic HTML using <h2>, <h3>, <p>, <ul>, <li> only',
        '- include one short CTA paragraph near the end inviting readers to explore Keria products',
        '- no markdown fences, no extra keys, no commentary'
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'You produce clean JSON only.' },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`OpenAI generation failed: ${response.status} ${detail}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('OpenAI response did not contain message content.');
    }

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error('Could not parse OpenAI JSON content.');
    }

    const title = String(parsed.title || '').trim();
    const category = String(parsed.category || 'Wellness Tips').trim();
    const contentHtml = String(parsed.content_html || '').trim();

    if (!title || !contentHtml) {
        throw new Error('Generated post is missing title or content_html.');
    }

    return { title, category, contentHtml };
}

async function generateImageUrl(title) {
    if (!OPENAI_API_KEY) {
        return null;
    }

    const imagePrompt = `Premium editorial still life for ${BRAND_NAME}: ${title}. Natural wellness ingredients, elegant soft lighting, clean composition, realistic photography, no text.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: imagePrompt,
            size: '1536x1024'
        })
    });

    if (!response.ok) {
        console.warn('Image generation failed. Continuing without image.');
        return null;
    }

    const payload = await response.json();
    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) {
        return null;
    }

    return `data:image/png;base64,${b64}`;
}

async function insertDraft(post) {
    const endpoint = `${SUPABASE_URL}/rest/v1/blog_posts`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: 'return=representation'
        },
        body: JSON.stringify(post)
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase insert failed: ${response.status} ${detail}`);
    }

    const rows = await response.json();
    return rows?.[0] || null;
}

async function run() {
    requireEnv('OPENAI_API_KEY', OPENAI_API_KEY);
    requireEnv('SUPABASE_URL', SUPABASE_URL);
    requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

    const generated = await generatePostWithOpenAI();
    const slugBase = slugify(generated.title) || `keria-post-${Date.now()}`;
    const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    const excerpt = excerptFromHtml(generated.contentHtml);
    const imageUrl = await generateImageUrl(generated.title);

    const payload = {
        title: generated.title,
        slug,
        content: generated.contentHtml,
        excerpt,
        category: generated.category,
        image_url: imageUrl,
        status: 'draft'
    };

    const saved = await insertDraft(payload);
    console.log(`Draft created: ${saved?.id || 'unknown-id'} | ${payload.title}`);
}

run().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
