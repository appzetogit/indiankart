/**
 * Utility to help translate dynamic backend data that comes in English.
 * This is a client-side dictionary approach to avoid paid translation APIs.
 */

const commonTerms = {
  // Categories
  "electronics": "इलेक्ट्रॉनिक्स",
  "fashion": "फैशन",
  "home": "गृह",
  "beauty": "सौंदर्य",
  "mobiles": "मोबाइल",
  "mobile": "मोबाइल",
  "laptops": "लैपटॉप",
  "laptop": "लैपटॉप",
  "accessories": "एक्सेसरीज",
  "footwear": "जूते",
  "clothing": "कपड़े",
  "men": "पुरुष",
  "women": "महिलाएं",
  "kids": "बच्चों",
  "watches": "घड़ियाँ",
  "bags": "बैग",
  
  // Common Product Words
  "shirt": "शर्ट",
  "t-shirt": "टी-शर्ट",
  "jeans": "जींस",
  "shoes": "जूते",
  "samsung": "सैमसंग",
  "apple": "एप्पल",
  "redmi": "रेडमी",
  "xiaomi": "शाओमी",
  "realme": "रियलमी",
  "oneplus": "वनप्लस",
  "vivo": "विवो",
  "oppo": "ओप्पो",
  "sony": "सोनी",
  "lg": "एलजी",
  "dell": "डेल",
  "hp": "एचपी",
  "lenovo": "लेनोवो",
  "asus": "आसुस",
  "black": "काला",
  "blue": "नीला",
  "red": "लाल",
  "white": "सफेद",
  "green": "हरा",
  "gold": "सुनहरा",
  "silver": "चांदी",
  "variant": "वेरिएंट",
  "pro": "प्रो",
  "max": "मैक्स",
  "ultra": "अल्ट्रा",
  "lite": "लाइट",
  "note": "नोट",
  "galaxy": "ग गैलेक्सी",
  "iphone": "आईफोन",
  "smart": "स्मार्ट",
  "watch": "घड़ी",
  "headphones": "हेडफोन",
  "earbuds": "ईयरबड्स",
  "speaker": "स्पीकर",
  "cover": "कवर",
  "case": "केस",
  "glass": "ग्लास",
  "cable": "केबल",
  "charger": "चार्जर",
  "adapter": "एडेप्टर",
  "power": "पावर",
  "bank": "बैंक",
  
  // Offer/Status words commonly found in backend data
  "best": "बेस्ट",
  "seller": "सेलर",
  "new": "नया",
  "arrival": "अराइवल",
  "sale": "सेल",
  "discount": "छूट",
  "off": "की छूट",
  "flat": "फ्लैट",
  "cashback": "कैशबैक",
  "free": "मुफ्त",
  "delivery": "डिलीवरी",
  "shipping": "शिपिंग"
};

/**
 * Attempts to translate a text string by replacing common English terms with Hindi.
 * @param {string} text - The text to translate (e.g., "Men's Blue T-Shirt")
 * @param {string} lang - The target language code ('hi' or 'en')
 * @returns {string} - The translated or original text
 */
export const translateBackendData = (text, lang) => {
  if (!text || typeof text !== 'string') return text;
  if (lang !== 'hi') return text;

  // Normalize text to lower case for matching, but preserve original casing structure for result if possible
  // For simplicity, we'll do case-insensitive replacement globally
  
  let translatedText = text;
  
  // Create a regex pattern from keys, sorted by length descending to match longest phrases first
  const sortedKeys = Object.keys(commonTerms).sort((a, b) => b.length - a.length);
  
  sortedKeys.forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(translatedText)) {
      translatedText = translatedText.replace(regex, commonTerms[key]);
    }
  });

  return translatedText;
};
