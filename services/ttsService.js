/**
 * Service for Text-to-Speech voice output.
 * PRIMARY: Browser Web Speech API (no API key required, works everywhere).
 * ENHANCEMENT: Google Cloud TTS (higher quality, used when API key is available).
 */
class TTSService {
    constructor() {
        this.endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
        this.currentAudio = null;
        this.synth = window.speechSynthesis || null;
        this.utterance = null;
    }

    /**
     * Speaks the given text aloud.
     * Tries Google Cloud TTS first; falls back to browser Web Speech API.
     * @param {string} text - The text to speak.
     * @param {string} languageCode - Language code (e.g., 'en-IN', 'hi-IN').
     * @returns {Promise<void>}
     */
    async speak(text, languageCode = 'en-IN') {
        if (!text) return;

        const apiKey = (typeof Config !== 'undefined') ? Config.getTTSKey() : null;

        // Try Google Cloud TTS when a valid key is present
        if (apiKey && !apiKey.startsWith('__') && apiKey.length > 10) {
            try {
                const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: { text: text.substring(0, 500) },
                        voice: { languageCode, ssmlGender: 'NEUTRAL' },
                        audioConfig: { audioEncoding: 'MP3' }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.audioContent) {
                        const audioBlob = this._base64ToBlob(data.audioContent, 'audio/mp3');
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentAudio = new Audio(audioUrl);
                        await this.currentAudio.play();
                        return;
                    }
                }
            } catch (_) {
                // Silently fall through to browser TTS
            }
        }

        // Fallback: Browser Web Speech API (no key required)
        this._speakWithBrowser(text, languageCode);
    }

    /**
     * Uses the browser's built-in Web Speech API to speak text.
     * @private
     */
    _speakWithBrowser(text, languageCode) {
        if (!this.synth) return;

        this.synth.cancel(); // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(text.substring(0, 500));

        // Map language code format (e.g. 'hi-IN' -> 'hi-IN')
        utterance.lang = languageCode || 'en-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        this.utterance = utterance;
        this.synth.speak(utterance);
    }

    /**
     * Converts base64 string to Blob.
     * @private
     */
    _base64ToBlob(base64, type) {
        const binStr = atob(base64);
        const len = binStr.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
        }
        return new Blob([arr], { type });
    }

    /**
     * Stops currently playing audio (both Google TTS and browser TTS).
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSService;
}
