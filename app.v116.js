/**
 * Main Application Orchestrator
 * This module initializes all services and manages the global application lifecycle.
 */
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Initialize Core Utilities
    const announcer = new A11yAnnouncer('a11y-announcer');
    const appState = new AppState();

    // 2. Initialize Google Cloud Services
    const geminiService = new GeminiService();
    const mapsService   = new MapsService('mapContainer', 'mapFallback', 'openMapsLink');
    const civicService  = new CivicService();
    const translateService = new TranslationService();
    const ttsService       = new TTSService();
    const nlService        = new NLService();
    
    // 3. Initialize Firebase
    let firebaseService = null;
    try {
        if (typeof FirebaseService !== 'undefined') {
            firebaseService = new FirebaseService();
            const ok = firebaseService.init();
            if (ok) {
                firebaseService.logUserEvent('app_booted');
            }
        }
    } catch (e) {
        console.warn("Firebase initialization failed:", e);
    }

    // 4. Initialize UI Components
    const chatUI = new ChatUI(appState, geminiService, announcer, firebaseService, nlService);
    const mainUI = new MainUI(appState, announcer, mapsService, firebaseService);
    const stepperUI = new StepperUI('stepsContainer', 'flowTitle', appState, Flows, firebaseService);
    const timelineUI = new TimelineUI('timeline-container', appState, firebaseService);



    // 5. Global UI Elements
    const languageSelect = document.getElementById('languageSelect');
    const masterTTSBtn   = document.getElementById('masterTTSBtn');
    let voiceActive      = false;

    // 6. Multilingual Logic
    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const targetLang = e.target.value;
            appState.setLanguage(targetLang);
            
            announcer.announce(`Translating page...`);
            await translatePage(targetLang, translateService);
            
            if (firebaseService) {
                firebaseService.logUserEvent('language_changed', { language: targetLang });
            }
        });
    }

    // 7. Voice Accessibility Logic
    if (masterTTSBtn) {
        masterTTSBtn.addEventListener('click', () => {
            voiceActive = !voiceActive;
            appState.setVoiceEnabled(voiceActive);
            
            const statusText = masterTTSBtn.querySelector('.voice-status');
            const icon = masterTTSBtn.querySelector('.material-icons-round');
            
            masterTTSBtn.setAttribute('aria-pressed', voiceActive);

            if (voiceActive) {
                masterTTSBtn.classList.add('active');
                if (statusText) statusText.textContent = 'Voice On';
                if (icon) icon.textContent = 'volume_up';
                announcer.announce("Voice assistance enabled.");
                ttsService.speak("Voice assistance enabled.", appState.language === 'en' ? 'en-IN' : appState.language + '-IN');
            } else {
                masterTTSBtn.classList.remove('active');
                if (statusText) statusText.textContent = 'Voice Off';
                if (icon) icon.textContent = 'volume_off';
                announcer.announce("Voice assistance disabled.");
                ttsService.stop();
            }
        });
    }
});

/**
 * Translates the entire visible UI using the Google Translation API.
 * @param {string} lang - Target language code.
 * @param {TranslationService} service - The translation service instance.
 */
async function translatePage(lang, service) {
    const elementsToTranslate = document.querySelectorAll('[data-translate], h1, h2, h3, p, label, button span:not(.material-icons-round)');
    
    document.body.classList.add('translating');
    
    const promises = Array.from(elementsToTranslate).map(async (el) => {
        const originalText = el.getAttribute('data-original') || el.textContent.trim();
        if (!el.hasAttribute('data-original')) {
            el.setAttribute('data-original', originalText);
        }
        
        if (lang === 'en') {
            el.textContent = originalText;
            return;
        }

        const translated = await service.translateText(originalText, lang);
        el.textContent = translated;
    });

    await Promise.all(promises);
    document.body.classList.remove('translating');
}
