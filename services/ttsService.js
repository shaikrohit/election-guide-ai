/**
 * Service for handling Google Cloud Text-to-Speech API integration.
 * Provides voice accessibility for voters.
 */
class TTSService {
    constructor() {
        this.endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
        this.audioContext = null;
    }

    /**
     * Synthesizes text into speech and plays it.
     * @param {string} text - The text to speak.
     * @param {string} languageCode - Language code (e.g., 'en-IN', 'hi-IN').
     * @returns {Promise<void>}
     */
    async speak(text, languageCode = 'en-IN') {
        if (!text) return;

        const apiKey = Config.getTTSKey();
        if (!apiKey || apiKey.startsWith('__')) {
            console.warn('TTSService: API Key missing.');
            return;
        }

        try {
            const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode, ssmlGender: 'NEUTRAL' },
                    audioConfig: { audioEncoding: 'MP3' }
                })
            });

            if (!response.ok) throw new Error(`TTS API error: ${response.status}`);

            const data = await response.json();
            const audioBlob = this._base64ToBlob(data.audioContent, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            this.currentAudio = new Audio(audioUrl);
            await this.currentAudio.play();
        } catch (error) {
            console.error('TTSService Error:', error);
        }
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
     * Stops currently playing audio.
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSService;
}
