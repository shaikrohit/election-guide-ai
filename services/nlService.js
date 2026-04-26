/**
 * Service for handling Google Cloud Natural Language API integration.
 * Analyzes voter inquiries for better insight.
 */
class NLService {
    constructor() {
        this.endpoint = "https://language.googleapis.com/v1/documents:analyzeEntities";
    }

    /**
     * Analyzes entities in a text string.
     * @param {string} text - The text to analyze.
     * @returns {Promise<Object>} The analysis results.
     */
    async analyzeInquiry(text) {
        if (!text) return null;

        const apiKey = Config.getNLKey();
        if (!apiKey || apiKey.startsWith('__')) return null;

        try {
            const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document: {
                        type: 'PLAIN_TEXT',
                        content: text
                    },
                    encodingType: 'UTF8'
                })
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('NLService Error:', error);
            return null;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NLService;
}
