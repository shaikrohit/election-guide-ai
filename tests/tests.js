/**
 * ElectionGuide AI — Automated Test Suite
 * Vanilla JS, no build tools required.
 * Open tests/index.html in a browser to run.
 */

const T = (() => {
    let passed = 0, failed = 0, total = 0;
    const results = [];

    function assert(condition, name, detail = '') {
        total++;
        if (condition) {
            passed++;
            results.push({ ok: true, name });
        } else {
            failed++;
            results.push({ ok: false, name, detail });
        }
    }

    function assertEqual(a, b, name) {
        assert(a === b, name, `Expected "${b}", got "${a}"`);
    }

    function assertContains(str, sub, name) {
        assert(typeof str === 'string' && str.includes(sub), name, `"${sub}" not found in "${str}"`);
    }

    function report() {
        const list = document.getElementById('results');
        results.forEach(r => {
            const li = document.createElement('li');
            li.className = r.ok ? 'pass' : 'fail';
            li.textContent = (r.ok ? '✅ ' : '❌ ') + r.name + (r.detail ? ` — ${r.detail}` : '');
            list.appendChild(li);
        });
        document.getElementById('summary').textContent =
            `${passed} passed · ${failed} failed · ${total} total`;
        document.getElementById('summary').className = failed > 0 ? 'summary fail' : 'summary pass';
    }

    return { assert, assertEqual, assertContains, report };
})();

// ═══════════════════════════════════════════════════════════════════════════════
// 1. escapeHTML — XSS Prevention
// ═══════════════════════════════════════════════════════════════════════════════
T.assertEqual(escapeHTML(''),           '',            'escapeHTML: empty string');
T.assertEqual(escapeHTML(null),         '',            'escapeHTML: null returns empty');
T.assertEqual(escapeHTML(undefined),    '',            'escapeHTML: undefined returns empty');
T.assertEqual(escapeHTML(0),            '',            'escapeHTML: falsy number returns empty');
T.assertEqual(escapeHTML('hello'),      'hello',       'escapeHTML: plain text unchanged');
T.assertEqual(escapeHTML('<b>'),        '&lt;b&gt;',   'escapeHTML: angle brackets escaped');
T.assertEqual(escapeHTML('"'),          '&quot;',      'escapeHTML: double quote escaped');
T.assertEqual(escapeHTML("'"),          '&#39;',       'escapeHTML: single quote escaped');
T.assertEqual(escapeHTML('&'),          '&amp;',       'escapeHTML: ampersand escaped');
T.assert(
    escapeHTML('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    'escapeHTML: full XSS payload neutralised'
);
T.assertEqual(
    escapeHTML('<img src=x onerror=alert(1)>'),
    '&lt;img src=x onerror=alert(1)&gt;',
    'escapeHTML: img injection neutralised'
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AppState — State Management
// ═══════════════════════════════════════════════════════════════════════════════
(() => {
    const s = new AppState();

    // Initial state
    T.assertEqual(s.activePersona, null,  'AppState: initial persona is null');
    T.assertEqual(s.currentStep,   1,     'AppState: initial step is 1');
    T.assertEqual(s.isAiThinking,  false, 'AppState: initial isAiThinking is false');
    T.assert(Object.keys(s.stepState).length === 0, 'AppState: initial stepState is empty');

    // setPersona
    s.setPersona('first-time');
    T.assertEqual(s.activePersona, 'first-time', 'setPersona: sets persona');
    T.assertEqual(s.currentStep,   1,             'setPersona: resets step to 1');

    // setStep — forward by 1
    s.setStep(2);
    T.assertEqual(s.currentStep, 2, 'setStep: advances step');

    // setStep — sequential progression guard
    s.setStep(5);
    T.assertEqual(s.currentStep, 2, 'setStep: cannot skip ahead by >1');

    // setStep — going back allowed
    s.setStep(1);
    T.assertEqual(s.currentStep, 1, 'setStep: can go back');

    // setStep — step 0 or negative should still be accepted (go back)
    s.setStep(2);
    s.setStep(0);
    T.assertEqual(s.currentStep, 0, 'setStep: can go to step 0');
    s.setStep(1); // reset

    // setStepState / toggleStepState
    s.setStepState('doc1', true);
    T.assertEqual(s.stepState['doc1'], true, 'setStepState: sets value');
    s.toggleStepState('doc1');
    T.assertEqual(s.stepState['doc1'], false, 'toggleStepState: toggles true→false');
    s.toggleStepState('doc1');
    T.assertEqual(s.stepState['doc1'], true, 'toggleStepState: toggles false→true');

    // toggleStepState on undefined key initialises to true
    s.toggleStepState('newKey');
    T.assertEqual(s.stepState['newKey'], true, 'toggleStepState: undefined → true');

    // setAiThinking
    s.setAiThinking(true);
    T.assertEqual(s.isAiThinking, true, 'setAiThinking: sets true');
    s.setAiThinking(false);
    T.assertEqual(s.isAiThinking, false, 'setAiThinking: sets false');

    // subscribe / notify
    let notifyCount = 0;
    s.subscribe(() => notifyCount++);
    s.setPersona('regular');
    T.assert(notifyCount >= 1, 'subscribe: listener called on change');

    // setPersona(null) resets all state
    s.setPersona(null);
    T.assertEqual(s.activePersona, null, 'setPersona(null): clears persona');
    T.assertEqual(s.currentStep,   1,    'setPersona(null): resets step');
    T.assert(Object.keys(s.stepState).length === 0, 'setPersona(null): clears stepState');

    // Multiple subscribers
    let secondCalled = false;
    s.subscribe(() => { secondCalled = true; });
    s.setPersona('candidate');
    T.assert(secondCalled, 'subscribe: multiple listeners all called');
})();

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CalendarService — Google Calendar Integration
// ═══════════════════════════════════════════════════════════════════════════════
(() => {
    const url = CalendarService.generateGoogleCalendarLink(
        'Test Event',
        'Test details',
        '2026-06-01T08:00:00Z'
    );

    T.assert(url.startsWith('https://calendar.google.com/calendar/render?'), 'CalendarService: returns Google Calendar URL');
    T.assertContains(url, 'action=TEMPLATE',  'CalendarService: includes action=TEMPLATE');
    T.assertContains(url, 'Test+Event',        'CalendarService: title is URL-encoded');
    T.assertContains(url, '20260601T',         'CalendarService: date formatted correctly');
    T.assertContains(url, 'Test+details',      'CalendarService: details included');

    // Verify end date is 1 hour after start
    T.assertContains(url, '20260601T080000Z', 'CalendarService: start time is correct');
    T.assertContains(url, '20260601T090000Z', 'CalendarService: end time is start + 1 hour');

    // Edge: special characters in title
    const urlSpecial = CalendarService.generateGoogleCalendarLink('Test & "Event"', 'Details', '2026-06-01T08:00:00Z');
    T.assert(typeof urlSpecial === 'string', 'CalendarService: handles special chars in title');

    // Edge: invalid date should not throw
    let threw = false;
    try { CalendarService.generateGoogleCalendarLink('T', 'D', 'not-a-date'); }
    catch(e) { threw = true; }
    T.assert(!threw, 'CalendarService: invalid date does not throw');
})();

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Config — API Key Management
// ═══════════════════════════════════════════════════════════════════════════════
T.assert(typeof Config.getGeminiKey() === 'string', 'Config.getGeminiKey: returns a string');
T.assert(typeof Config.getMapsKey()   === 'string', 'Config.getMapsKey: returns a string');
T.assert(Config.getGeminiKey().length > 0,          'Config.getGeminiKey: key is not empty');
T.assert(Config.getMapsKey().length   > 0,          'Config.getMapsKey: key is not empty');
T.assert(Config.getGeminiKey().startsWith('AIza'),  'Config.getGeminiKey: has valid key prefix');
T.assert(Config.getMapsKey().startsWith('AIza'),    'Config.getMapsKey: has valid key prefix');

// Config is frozen (IIFE — no setters)
T.assertEqual(typeof Config.setGeminiKey, 'undefined', 'Config: no setter exposed');

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Flows — Data Integrity
// ═══════════════════════════════════════════════════════════════════════════════
T.assert(Object.keys(Flows).length === 3, 'Flows: has exactly 3 personas');
['first-time', 'regular', 'candidate'].forEach(p => {
    T.assert(Array.isArray(Flows[p].steps) && Flows[p].steps.length > 0,
             `Flows["${p}"]: has steps array`);
    T.assert(typeof Flows[p].title === 'string' && Flows[p].title.length > 0,
             `Flows["${p}"]: has non-empty title`);

    // Check each step's data integrity
    const seenIds = new Set();
    Flows[p].steps.forEach((step, i) => {
        T.assert(typeof step.id    === 'string', `Flows["${p}"] step ${i+1}: has id`);
        T.assert(typeof step.title === 'string', `Flows["${p}"] step ${i+1}: has title`);
        T.assert(typeof step.desc  === 'string', `Flows["${p}"] step ${i+1}: has desc`);

        // Unique IDs
        T.assert(!seenIds.has(step.id), `Flows["${p}"] step ${i+1}: id "${step.id}" is unique`);
        seenIds.add(step.id);

        // Dates in the future
        if (step.date) {
            T.assert(new Date(step.date).getTime() > Date.now(),
                     `Flows["${p}"] step ${i+1}: date "${step.date}" is in the future`);
            T.assert(typeof step.dateLabel === 'string' && step.dateLabel.length > 0,
                     `Flows["${p}"] step ${i+1}: has dateLabel when date exists`);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. renderMarkdown — Safe Markdown Rendering
// ═══════════════════════════════════════════════════════════════════════════════
(() => {
    // Bold text
    const c1 = document.createElement('div');
    renderMarkdown('**bold** text', c1);
    const strong = c1.querySelector('strong');
    T.assert(strong !== null,              'renderMarkdown: creates <strong> for **bold**');
    T.assertEqual(strong.textContent, 'bold', 'renderMarkdown: bold text content correct');

    // List items
    const c2 = document.createElement('div');
    renderMarkdown('- item one\n- item two', c2);
    const lis = c2.querySelectorAll('li');
    T.assertEqual(lis.length, 2, 'renderMarkdown: renders 2 list items');

    // Numbered list
    const c2b = document.createElement('div');
    renderMarkdown('1. first\n2. second\n3. third', c2b);
    T.assertEqual(c2b.querySelectorAll('li').length, 3, 'renderMarkdown: renders numbered list');

    // Empty string
    const c3 = document.createElement('div');
    renderMarkdown('', c3);
    T.assertEqual(c3.innerHTML, '', 'renderMarkdown: empty string gives empty container');

    // Null / undefined
    const c4 = document.createElement('div');
    renderMarkdown(null, c4);
    T.assertEqual(c4.innerHTML, '', 'renderMarkdown: null input gives empty container');

    // XSS safety — no raw HTML injected
    const c5 = document.createElement('div');
    renderMarkdown('<script>alert("xss")</script>', c5);
    T.assert(c5.querySelector('script') === null, 'renderMarkdown: no script tags rendered');

    // Uses CSS classes, not inline styles
    const c6 = document.createElement('div');
    renderMarkdown('- item', c6);
    const ul = c6.querySelector('ul');
    T.assert(ul !== null, 'renderMarkdown: creates ul element');
    T.assert(ul.classList.contains('md-list'), 'renderMarkdown: ul uses CSS class, not inline style');
    T.assertEqual(ul.style.marginLeft, '', 'renderMarkdown: no inline marginLeft');

    // Paragraph class
    const c7 = document.createElement('div');
    renderMarkdown('plain text', c7);
    const p = c7.querySelector('p');
    T.assert(p !== null, 'renderMarkdown: creates <p> for plain text');
    T.assert(p.classList.contains('md-paragraph'), 'renderMarkdown: paragraph uses CSS class');
})();

// ═══════════════════════════════════════════════════════════════════════════════
// 7. GeminiService — Input Validation (Unit-safe, no network)
// ═══════════════════════════════════════════════════════════════════════════════
(() => {
    const g = new GeminiService();

    // clearHistory
    g.conversationHistory = [{ role: 'user', parts: [{ text: 'test' }] }];
    g.cache.set('key', 'val');
    g.clearHistory();
    T.assertEqual(g.conversationHistory.length, 0, 'GeminiService.clearHistory: clears history');
    T.assertEqual(g.cache.size, 0, 'GeminiService.clearHistory: clears cache');

    // getMockResponse — keyword matching
    T.assertContains(g.getMockResponse('what id do I need', 'general'), 'ID', 'getMockResponse: ID keyword');
    T.assertContains(g.getMockResponse('when is deadline', 'general'), 'timeline', 'getMockResponse: date keyword');
    T.assertContains(g.getMockResponse('where is station', 'general'), 'Polling Station', 'getMockResponse: location keyword');
    T.assertContains(g.getMockResponse('how to register', 'general'), 'register', 'getMockResponse: register keyword');
    T.assertContains(g.getMockResponse('random question', 'general'), 'answer questions', 'getMockResponse: fallback');
})();

// ═══════════════════════════════════════════════════════════════════════════════
// Run Report
// ═══════════════════════════════════════════════════════════════════════════════
T.report();
