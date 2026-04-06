const CONFIG = {
    supabaseUrl: "https://zarblykuwtjhjvzdosqc.supabase.co",
    supabaseKey: "sb_publishable_KwgEUe84jLMaYZm7CXwAVQ_1lLktnI_",
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
