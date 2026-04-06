const CONFIG = {
    supabaseUrl: "",
    supabaseKey: "",
    whatsapp: "260976410975",
    brand: "Keria Wellness",
    currency: "ZMW",
    whatsappMessage: "Hello Keria Wellness, I would like to order "
};

const hasSupabaseConfig = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseKey);
const supabaseClient = (typeof window !== 'undefined' && window.supabase && hasSupabaseConfig)
    ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey)
    : null;
