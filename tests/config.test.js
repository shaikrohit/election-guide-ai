// tests/config.test.js

/**
 * Tests for the application configuration module.
 * Verifies that all required API key getters exist and return strings.
 */

const fs = require('fs');
const path = require('path');

// Load config.js — replace const with var so it's accessible after eval
const configSrc = fs.readFileSync(path.join(__dirname, '../config/config.js'), 'utf8')
    .replace('const Config', 'var Config');
eval(configSrc);

describe('Config Module', () => {
    it('should expose getGeminiKey', () => {
        expect(typeof Config.getGeminiKey).toBe('function');
        expect(typeof Config.getGeminiKey()).toBe('string');
    });

    it('should expose getMapsKey', () => {
        expect(typeof Config.getMapsKey).toBe('function');
        expect(typeof Config.getMapsKey()).toBe('string');
    });

    it('should expose getCivicKey', () => {
        expect(typeof Config.getCivicKey).toBe('function');
        expect(typeof Config.getCivicKey()).toBe('string');
    });

    it('should expose getFirebaseConfig', () => {
        expect(typeof Config.getFirebaseConfig).toBe('function');
        const fbConfig = Config.getFirebaseConfig();
        expect(fbConfig).toHaveProperty('apiKey');
        expect(fbConfig).toHaveProperty('authDomain');
        expect(fbConfig).toHaveProperty('projectId');
        expect(fbConfig).toHaveProperty('storageBucket');
        expect(fbConfig).toHaveProperty('messagingSenderId');
        expect(fbConfig).toHaveProperty('appId');
        expect(fbConfig).toHaveProperty('measurementId');
    });

    it('should use placeholder values before injection', () => {
        expect(Config.getGeminiKey()).toContain('__');
        expect(Config.getMapsKey()).toContain('__');
        expect(Config.getCivicKey()).toContain('__');
        expect(Config.getFirebaseConfig().apiKey).toContain('__');
    });
});
