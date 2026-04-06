const CONFIG = {
    supabaseUrl: "",
    supabaseKey: "",
    whatsapp: "260976410975",
    brand: "Keria Wellness",
    currency: "ZMW",
    whatsappMessage: "Hello Keria Wellness, I would like to order "
};

const hasSupabaseConfig = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseKey);
const { createClient } = typeof supabase !== 'undefined' ? supabase : { createClient: null };
const _supabase = (typeof createClient === 'function' && hasSupabaseConfig)
    ? createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey)
    : null;
