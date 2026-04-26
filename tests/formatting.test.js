// tests/formatting.test.js

const { escapeHTML, renderMarkdown, renderElectionInfo, renderPollingInfo, renderAnalysisResult } = require('../utils/formatting');

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

    describe('renderElectionInfo', () => {
        it('should render warning if no elections', () => {
            const container = document.getElementById('container');
            renderElectionInfo([], container);
            expect(container.innerHTML).toContain('No upcoming elections found');
        });

        it('should render elections', () => {
            const container = document.getElementById('container');
            renderElectionInfo([{ name: 'Test Election', electionDay: '2024-11-05' }], container);
            expect(container.innerHTML).toContain('Test Election');
            expect(container.innerHTML).toContain('2024-11-05');
        });
    });

    describe('renderPollingInfo', () => {
        it('should render warning if no polling stations', () => {
            const container = document.getElementById('container');
            renderPollingInfo([], container);
            expect(container.innerHTML).toContain('No specific polling locations returned');
        });

        it('should render polling stations', () => {
            const container = document.getElementById('container');
            renderPollingInfo([{ address: { locationName: 'Test Location', line1: '123 Main St', city: 'Test City' } }], container);
            expect(container.innerHTML).toContain('Test Location');
            expect(container.innerHTML).toContain('123 Main St');
        });
    });

    describe('renderAnalysisResult', () => {
        it('should render analysis tags', () => {
            const container = document.getElementById('container');
            renderAnalysisResult({ entities: [{ name: 'Topic 1' }, { name: 'Topic 2' }] }, container);
            expect(container.innerHTML).toContain('Topic 1');
            expect(container.innerHTML).toContain('Topic 2');
        });
        it('should do nothing if no analysis or entities', () => {
            const container = document.getElementById('container');
            renderAnalysisResult(null, container);
            expect(container.innerHTML).toBe('');
        });
    });
});
