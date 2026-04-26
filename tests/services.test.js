/**
 * Jest tests for the new Google Cloud Services.
 */

const TranslationService = require('../services/translationService');
const TTSService = require('../services/ttsService');
const NLService = require('../services/nlService');

// Mock Config
global.Config = {
    getTranslateKey: () => 'test-key',
    getTTSKey: () => 'test-key',
    getNLKey: () => 'test-key'
};

// Mock fetch
global.fetch = jest.fn();

describe('New Google Services Tests', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    test('TranslationService translates text', async () => {
        const service = new TranslationService();
        fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: { translations: [{ translatedText: 'नमस्ते' }] } }),
            })
        );

        const result = await service.translateText('Hello', 'hi');
        expect(result).toBe('नमस्ते');
        expect(fetch).toHaveBeenCalled();
    });

    test('TTSService synthesizes speech', async () => {
        const service = new TTSService();
        fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ audioContent: 'YmFzZTY0YXVkaW8=' }),
            })
        );

        // Mocking Audio and Blob for the browser environment
        global.Blob = jest.fn();
        global.URL.createObjectURL = jest.fn();
        global.Audio = jest.fn().mockImplementation(() => ({
            play: jest.fn().mockResolvedValue(true)
        }));

        await service.speak('Hello');
        expect(fetch).toHaveBeenCalled();
    });

    test('NLService analyzes inquiry', async () => {
        const service = new NLService();
        fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ entities: [{ name: 'Election' }] }),
            })
        );

        const result = await service.analyzeInquiry('How to vote?');
        expect(result.entities[0].name).toBe('Election');
    });
});
