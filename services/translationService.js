/**
 * Service for Google Cloud Translation API integration.
 * PRIMARY: Google Cloud Translation API (when key is available).
 * FALLBACK: Built-in UI dictionary for core Indian languages.
 */
class TranslationService {
    constructor() {
        this.endpoint = "https://translation.googleapis.com/language/translate/v2";
        this.cache = new Map();

        // Built-in dictionary for core UI strings — ensures language switching
        // works even when the Translation API is unavailable or rate-limited.
        this.dictionary = {
            hi: {
                "Welcome to your Smart Election Assistant": "आपके स्मार्ट चुनाव सहायक में आपका स्वागत है",
                "Let's personalize your experience. Tell us a bit about yourself:": "आइए आपका अनुभव व्यक्तिगत बनाएं। हमें अपने बारे में थोड़ा बताएं:",
                "First-Time Voter": "पहली बार मतदाता",
                "Regular Voter": "नियमित मतदाता",
                "Candidate": "उम्मीदवार",
                "Learn how to register and cast your first vote securely.": "सुरक्षित रूप से पंजीकरण करने और पहला वोट डालने का तरीका जानें।",
                "Find your polling station and review the current voting process.": "अपना मतदान केंद्र खोजें और वर्तमान मतदान प्रक्रिया की समीक्षा करें।",
                "Understand the nomination and campaigning guidelines.": "नामांकन और प्रचार दिशानिर्देशों को समझें।",
                "Your Guide": "आपकी मार्गदर्शिका",
                "Change Profile": "प्रोफ़ाइल बदलें",
                "Find Polling Station": "मतदान केंद्र खोजें",
                "Use My Location": "मेरा स्थान उपयोग करें",
                "Election Info": "चुनाव जानकारी",
                "Live Data": "लाइव डेटा",
                "Real-time election data powered by Google Civic Information API.": "Google Civic Information API द्वारा संचालित रियल-टाइम चुनाव डेटा।",
                "View Upcoming Elections": "आगामी चुनाव देखें",
                "Ask anything about elections…": "चुनावों के बारे में कुछ भी पूछें…",
                "Voice Off": "आवाज़ बंद",
                "Voice On": "आवाज़ चालू",
                "Locate your nearest polling station based on your current location.": "अपने वर्तमान स्थान के आधार पर निकटतम मतदान केंद्र खोजें।",
                "Open in Google Maps": "Google Maps में खोलें"
            },
            te: {
                "Welcome to your Smart Election Assistant": "మీ స్మార్ట్ ఎన్నికల సహాయకునికి స్వాగతం",
                "Let's personalize your experience. Tell us a bit about yourself:": "మీ అనుభవాన్ని వ్యక్తిగతీకరించండి. మీ గురించి కొంచెం చెప్పండి:",
                "First-Time Voter": "మొదటిసారి ఓటర్",
                "Regular Voter": "నిత్య ఓటర్",
                "Candidate": "అభ్యర్థి",
                "Learn how to register and cast your first vote securely.": "సురక్షితంగా నమోదు చేసుకుని మొదటి ఓటు వేయడం నేర్చుకోండి.",
                "Find your polling station and review the current voting process.": "మీ పోలింగ్ స్టేషన్ కనుగొనండి మరియు ప్రస్తుత ఓటింగ్ ప్రక్రియను సమీక్షించండి.",
                "Understand the nomination and campaigning guidelines.": "నామినేషన్ మరియు ప్రచార మార్గదర్శకాలను అర్థం చేసుకోండి.",
                "Your Guide": "మీ గైడ్",
                "Change Profile": "ప్రొఫైల్ మార్చండి",
                "Find Polling Station": "పోలింగ్ స్టేషన్ కనుగొనండి",
                "Use My Location": "నా స్థానాన్ని ఉపయోగించండి",
                "Election Info": "ఎన్నికల సమాచారం",
                "Live Data": "లైవ్ డేటా",
                "View Upcoming Elections": "రాబోయే ఎన్నికలు చూడండి",
                "Ask anything about elections…": "ఎన్నికల గురించి ఏదైనా అడగండి…",
                "Voice Off": "వాయిస్ ఆఫ్",
                "Voice On": "వాయిస్ ఆన్",
                "Open in Google Maps": "Google Maps లో తెరవండి"
            },
            ta: {
                "Welcome to your Smart Election Assistant": "உங்கள் ஸ்மார்ட் தேர்தல் உதவியாளரில் வரவேற்கிறோம்",
                "Let's personalize your experience. Tell us a bit about yourself:": "உங்கள் அனுபவத்தை தனிப்பயனாக்குவோம். உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள்:",
                "First-Time Voter": "முதல்முறை வாக்காளர்",
                "Regular Voter": "வழக்கமான வாக்காளர்",
                "Candidate": "வேட்பாளர்",
                "Learn how to register and cast your first vote securely.": "பாதுகாப்பாக பதிவு செய்து முதல் வாக்கு அளிக்க கற்றுக்கொள்ளுங்கள்.",
                "Find your polling station and review the current voting process.": "உங்கள் வாக்குச்சாவடியைக் கண்டறிந்து தற்போதைய வாக்களிப்பு செயல்முறையை மதிப்பாய்வு செய்யுங்கள்.",
                "Understand the nomination and campaigning guidelines.": "நியமனம் மற்றும் பிரச்சார வழிகாட்டுதல்களை புரிந்துகொள்ளுங்கள்.",
                "Your Guide": "உங்கள் வழிகாட்டி",
                "Change Profile": "சுயவிவரம் மாற்று",
                "Find Polling Station": "வாக்குச்சாவடி கண்டறி",
                "Use My Location": "என் இருப்பிடம் பயன்படுத்து",
                "Election Info": "தேர்தல் தகவல்",
                "Live Data": "நேரடி தரவு",
                "View Upcoming Elections": "வரவிருக்கும் தேர்தல்களை காண்க",
                "Ask anything about elections…": "தேர்தல்களைப் பற்றி எதையும் கேளுங்கள்…",
                "Voice Off": "குரல் அணைக்கப்பட்டது",
                "Voice On": "குரல் இயக்கப்பட்டது",
                "Open in Google Maps": "Google Maps இல் திற"
            },
            kn: {
                "Welcome to your Smart Election Assistant": "ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಚುನಾವಣೆ ಸಹಾಯಕಕ್ಕೆ ಸ್ವಾಗತ",
                "Let's personalize your experience. Tell us a bit about yourself:": "ನಿಮ್ಮ ಅನುಭವವನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸೋಣ. ನಿಮ್ಮ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ಹೇಳಿ:",
                "First-Time Voter": "ಮೊದಲ ಬಾರಿ ಮತದಾರ",
                "Regular Voter": "ನಿಯಮಿತ ಮತದಾರ",
                "Candidate": "ಅಭ್ಯರ್ಥಿ",
                "Learn how to register and cast your first vote securely.": "ಸುರಕ್ಷಿತವಾಗಿ ನೋಂದಾಯಿಸಿ ಮೊದಲ ಮತ ಚಲಾಯಿಸಲು ಕಲಿಯಿರಿ.",
                "Find your polling station and review the current voting process.": "ನಿಮ್ಮ ಮತದಾನ ಕೇಂದ್ರ ಕಂಡುಹಿಡಿಯಿರಿ ಮತ್ತು ಪ್ರಸ್ತುತ ಮತದಾನ ಪ್ರಕ್ರಿಯೆ ಪರಿಶೀಲಿಸಿ.",
                "Understand the nomination and campaigning guidelines.": "ನಾಮಪತ್ರ ಮತ್ತು ಪ್ರಚಾರ ಮಾರ್ಗದರ್ಶಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.",
                "Your Guide": "ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶಿ",
                "Change Profile": "ಪ್ರೊಫೈಲ್ ಬದಲಾಯಿಸಿ",
                "Find Polling Station": "ಮತದಾನ ಕೇಂದ್ರ ಹುಡುಕಿ",
                "Use My Location": "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
                "Election Info": "ಚುನಾವಣೆ ಮಾಹಿತಿ",
                "Live Data": "ಲೈವ್ ಡೇಟಾ",
                "View Upcoming Elections": "ಮುಂಬರುವ ಚುನಾವಣೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                "Ask anything about elections…": "ಚುನಾವಣೆಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ…",
                "Voice Off": "ಧ್ವನಿ ಆಫ್",
                "Voice On": "ಧ್ವನಿ ಆನ್",
                "Open in Google Maps": "Google Maps ನಲ್ಲಿ ತೆರೆಯಿರಿ"
            }
        };
    }

    /**
     * Translates text into a target language.
     * Tries Google Cloud Translation API first, then falls back to built-in dictionary.
     * @param {string} text - The text to translate.
     * @param {string} targetLang - ISO-639-1 language code (e.g., 'hi', 'te').
     * @returns {Promise<string>} The translated text.
     */
    async translateText(text, targetLang) {
        if (!text || targetLang === 'en') return text;

        const trimmedText = text.trim();
        if (!trimmedText) return text;

        const cacheKey = `${targetLang}:${trimmedText}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        // Try Google Cloud Translation API
        const apiKey = (typeof Config !== 'undefined') ? Config.getTranslateKey() : null;
        if (apiKey && !apiKey.startsWith('__') && apiKey.length > 10) {
            try {
                const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: trimmedText, target: targetLang, format: 'text' })
                });

                if (response.ok) {
                    const data = await response.json();
                    const translated = data?.data?.translations?.[0]?.translatedText;
                    if (translated && translated !== trimmedText) {
                        this.cache.set(cacheKey, translated);
                        return translated;
                    }
                }
            } catch (_) {
                // Silently fall through to dictionary
            }
        }

        // Fallback: built-in dictionary
        const dict = this.dictionary[targetLang];
        if (dict && dict[trimmedText]) {
            this.cache.set(cacheKey, dict[trimmedText]);
            return dict[trimmedText];
        }

        return text;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationService;
}
