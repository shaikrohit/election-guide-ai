// tests/formatting.test.js

const { escapeHTML, renderMarkdown } = require('../utils/formatting');

describe('Formatting Utils', () => {
    // Setup basic DOM environment for testing DOM manipulation
    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
    });

    describe('escapeHTML', () => {
        it('should escape HTML characters', () => {
            const input = '<script>alert("test")</script>&';
            const expected = '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;&amp;';
            expect(escapeHTML(input)).toBe(expected);
        });

        it('should return empty string for null or undefined', () => {
            expect(escapeHTML(null)).toBe('');
            expect(escapeHTML(undefined)).toBe('');
        });
    });

    describe('renderMarkdown', () => {
        it('should format bold markdown', () => {
            const input = 'This is **bold** text';
            const container = document.getElementById('container');
            renderMarkdown(input, container);
            expect(container.innerHTML).toContain('<strong>bold</strong>');
        });

        it('should format bulleted lists', () => {
            const input = '* Item 1\n* Item 2';
            const container = document.getElementById('container');
            renderMarkdown(input, container);
            expect(container.innerHTML).toContain('<ul class="md-list">');
            expect(container.innerHTML).toContain('<li>Item 1</li>');
            expect(container.innerHTML).toContain('<li>Item 2</li>');
        });
    });
});
