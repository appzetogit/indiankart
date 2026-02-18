import { useState, useEffect } from 'react';
import { translateText } from '../services/translationService';
import { useLanguageStore } from '../store/languageStore';

/**
 * Custom hook to translate text asynchronously using Google API.
 * @param {string} text - The text to translate
 * @returns {string} - The translated text (or original while loading/error)
 */
export const useGoogleTranslation = (text) => {
    const { language } = useLanguageStore();
    const [translatedText, setTranslatedText] = useState(text);
    // eslint-disable-next-line no-unused-vars
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // console.log('Hook Language changed:', language, 'Text:', text);
        let isMounted = true;

        const fetchTranslation = async () => {
            if (!text || language === 'en') {
                setTranslatedText(text);
                return;
            }

            setIsLoading(true);
            try {
                const result = await translateText(text, language);
                if (isMounted) {
                    setTranslatedText(result);
                }
            } catch (error) {
                console.error("Translation hook error:", error);
                if (isMounted) setTranslatedText(text);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchTranslation();

        return () => {
            isMounted = false;
        };
    }, [text, language]);

    return translatedText;
};
