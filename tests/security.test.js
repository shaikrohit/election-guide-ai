// tests/security.test.js

/**
 * Security-focused tests to ensure input sanitization,
 * XSS prevention, and proper validation patterns.
 */

const { escapeHTML } = require('../utils/formatting');

describe('Security: XSS Prevention', () => {
    it('should escape script tags', () => {
        const malicious = '<script>alert("xss")</script>';
        const escaped = escapeHTML(malicious);
        expect(escaped).not.toContain('<script>');
        expect(escaped).toContain('&lt;script&gt;');
    });

    it('should neutralize event handler injection via tag escaping', () => {
        const malicious = '<img onerror="alert(1)" src=x>';
        const escaped = escapeHTML(malicious);
        // The angle brackets are escaped, so the tag is never parsed by the browser
        expect(escaped).not.toContain('<img');
        expect(escaped).toContain('&lt;img');
        expect(escaped).toContain('&gt;');
    });

    it('should escape HTML entities in all positions', () => {
        expect(escapeHTML('&')).toBe('&amp;');
        expect(escapeHTML('<')).toBe('&lt;');
        expect(escapeHTML('>')).toBe('&gt;');
        expect(escapeHTML('"')).toBe('&quot;');
        expect(escapeHTML("'")).toBe('&#39;');
    });

    it('should handle mixed content safely', () => {
        const input = 'Hello <b>world</b> & "friends" \'everywhere\'';
        const result = escapeHTML(input);
        expect(result).not.toContain('<b>');
        expect(result).toContain('&lt;b&gt;');
        expect(result).toContain('&amp;');
        expect(result).toContain('&quot;');
        expect(result).toContain('&#39;');
    });
});

describe('Security: Input Validation', () => {
    const CivicService = require('../services/civicService');

    beforeEach(() => {
        global.Config = { getCivicKey: jest.fn(() => 'key') };
        global.fetch = jest.fn();
        global.AbortSignal = { timeout: jest.fn() };
    });

    it('should reject empty address', async () => {
        const service = new CivicService();
        const result = await service.getVoterInfo('');
        expect(result.error).toBeDefined();
    });

    it('should reject null address', async () => {
        const service = new CivicService();
        const result = await service.getVoterInfo(null);
        expect(result.error).toBeDefined();
    });

    it('should reject very short address', async () => {
        const service = new CivicService();
        const result = await service.getVoterInfo('ab');
        expect(result.error).toBe('Please provide a valid address.');
    });

    it('should strip dangerous characters from address', async () => {
        const service = new CivicService();
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ normalizedInput: {} })
        });

        await service.getVoterInfo('<script>alert(1)</script> 123 Main St');
        const callUrl = global.fetch.mock.calls[0][0];
        expect(callUrl).not.toContain('<script>');
    });
});
