/**
 * Service to handle Google Cloud Translation API interactions.
 * Includes caching in localStorage to minimize API costs and improve performance.
 */

const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATION_API_KEY || ''; // User needs to set this
const API_URL = 'https://translation.googleapis.com/language/translate/v2';

const CACHE_KEY_PREFIX = 'trans_cache_v3_'; // Force refresh again for debugging

// Cache expiration: 24 hours
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// List of words that should NOT be translated
const PROTECTED_WORDS = [
    'Apple', 'Samsung', 'Realme', 'Xiaomi', 'Redmi', 'Oppo', 'Vivo', 
    'OnePlus', 'Sony', 'LG', 'Google', 'Microsoft', 'Dell', 'HP', 
    'Lenovo', 'Asus', 'Acer', 'Motorola', 'Nokia', 'Huawei', 'Honor',
    'Infinix', 'Tecno', 'Itel', 'Lava', 'Nothing', 'Poco', 'iQOO',
    'Flipkart', 'Amazon', 'IndianKart', 'iPhone', 'iPad', 'MacBook',
    'Galaxy', 'Note', 'Ultra', 'Pro', 'Max', 'Plus', 'Mini', 'Air',
    'Watch', 'Buds', 'AirPods'
];

/**
 * Generates a cache key for a specific text and target language.
 */
const getCacheKey = (text, targetLang) => `${CACHE_KEY_PREFIX}${targetLang}_${text}`;

/**
 * Replaces protected words with placeholders
 */
const maskProtectedWords = (text) => {
    let maskedText = text;
    const placeholders = [];
    
    PROTECTED_WORDS.forEach((word, index) => {
        // Case-insensitive regex with boundary check
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(maskedText)) {
            // Store the actual matched word case (e.g., "apple" -> "Apple")
            const matches = maskedText.match(regex);
            matches.forEach(match => {
                const placeholder = `__BP${placeholders.length}__`; // BP = Brand Placeholder
                // Only replace the first occurrence found to keep indices synced, or replace all safely?
                // Replacing one by one is safer for multiple same words
                 maskedText = maskedText.replace(match, placeholder);
                 placeholders.push({ placeholder, original: match });
            });
        }
    });
    
    return { maskedText, placeholders };
};

/**
 * Restores protected words from placeholders
 */
const unmaskProtectedWords = (text, placeholders) => {
    let unmaskedText = text;
    // Reverse order to avoid partial matches if nested (though unlikely with this scheme)
    for (let i = placeholders.length - 1; i >= 0; i--) {
        const { placeholder, original } = placeholders[i];
        // Replace all occurrences of the placeholder
        unmaskedText = unmaskedText.split(placeholder).join(original);
    }
    return unmaskedText;
};

/**
 * Fetches translation from Google API or local cache.
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'hi')
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang) => {
    // 1. Validate Input
    if (!text || !targetLang || targetLang === 'en') {
        return text;
    }

    if (!API_KEY) {
        console.error('CRITICAL: VITE_GOOGLE_TRANSLATION_API_KEY is missing in .env file!');
        return text;
    }

    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${targetLang}_${btoa(encodeURIComponent(text.trim()))}`;
        
        // 2. Check Cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { value, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRATION) {
                // console.log(`[Cache Hit] "${text}" -> "${value}"`);
                return value;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }

        // 3. Protect Brand Names
        const { maskedText, placeholders } = maskProtectedWords(text); // Renamed placeholders to protectionMap in instruction, but keeping original function name and variable for consistency with other parts of the file.

        // 4. API Request
        const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
        
        // console.log(`[Translating] "${text}" to ${targetLang}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: maskedText,
                target: targetLang,
                format: 'text',
                source: 'en'
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Google API Error:', JSON.stringify(data.error, null, 2));
            if (data.error.code === 400 && data.error.message === 'API key not valid. Please pass a valid API key.') {
                 console.error('ACTION REQUIRED: Check your Google Cloud Console to ensure the API key is valid, active, and has the Cloud Translation API enabled.');
            }
            return text;
        }

        let translatedText = data.data.translations[0].translatedText;

        // 5. Restore Brand Names
        translatedText = unmaskProtectedWords(translatedText, placeholders); // Renamed restoreBrandNames in instruction, but keeping original function name for consistency with other parts of the file.

        // 6. Fix Common Hindi Issues
        if (targetLang === 'hi') {
            translatedText = translatedText.replace(/\|/g, '।');
        }

        // 7. Save to Cache
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                value: translatedText,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('LocalStorage full, cannot cache translation');
        }

        return translatedText;

    } catch (error) {
        console.error('Translation Service Network/System Error:', error);
        return text;
    }
};

/**
 * Batch translation (if needed in future)
 */
export const translateBatch = async (texts, targetLang) => {
    // Implementation for array of strings if needed to reduce HTTP overhead
};
