/**
 * Service for handling Google Cloud Translation API integration.
 * Provides multilingual support for Indian voters.
 */
class TranslationService {
    constructor() {
        this.endpoint = "https://translation.googleapis.com/language/translate/v2";
        this.cache = new Map();
    }

    /**
     * Translates text into a target language.
     * @param {string} text - The text to translate.
     * @param {string} targetLang - ISO-639-1 language code (e.g., 'hi', 'te').
     * @returns {Promise<string>} The translated text.
     */
    async translateText(text, targetLang) {
        if (!text || targetLang === 'en') return text;

        const apiKey = Config.getTranslateKey();
        if (!apiKey || apiKey.startsWith('__')) {
            console.warn('TranslationService: API Key missing, returning original text.');
            return text;
        }

        const cacheKey = `${targetLang}:${text}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        try {
            const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    format: 'text'
                })
            });

            if (!response.ok) throw new Error(`Translation API error: ${response.status}`);

            const data = await response.json();
            const translatedText = data?.data?.translations?.[0]?.translatedText || text;

            this.cache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('TranslationService Error:', error);
            return text;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationService;
}
