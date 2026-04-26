// tests/flows.test.js

/**
 * Tests for election flow data integrity.
 * Ensures all personas have valid, well-formed step definitions.
 */

const fs = require('fs');
const path = require('path');

// Load flows.js — replace const with var so it's accessible after eval
const flowsSrc = fs.readFileSync(path.join(__dirname, '../logic/flows.js'), 'utf8')
    .replace('const Flows', 'var Flows');
eval(flowsSrc);

describe('Flows Data', () => {
    it('should define all three personas', () => {
        expect(Flows).toHaveProperty('first-time');
        expect(Flows).toHaveProperty('regular');
        expect(Flows).toHaveProperty('candidate');
    });

    it.each(['first-time', 'regular', 'candidate'])('%s should have a title and steps array', (persona) => {
        const flow = Flows[persona];
        expect(typeof flow.title).toBe('string');
        expect(flow.title.length).toBeGreaterThan(0);
        expect(Array.isArray(flow.steps)).toBe(true);
        expect(flow.steps.length).toBeGreaterThan(0);
    });

    it.each(['first-time', 'regular', 'candidate'])('%s steps should have required fields', (persona) => {
        Flows[persona].steps.forEach((step) => {
            expect(step).toHaveProperty('id');
            expect(step).toHaveProperty('title');
            expect(step).toHaveProperty('desc');
            expect(typeof step.id).toBe('string');
            expect(typeof step.title).toBe('string');
            expect(typeof step.desc).toBe('string');
        });
    });

    it('should have unique step IDs across all personas', () => {
        const allIds = [];
        Object.values(Flows).forEach(flow => {
            flow.steps.forEach(step => allIds.push(step.id));
        });
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(allIds.length);
    });

    it('steps with dates should have valid ISO date strings', () => {
        Object.values(Flows).forEach(flow => {
            flow.steps.forEach(step => {
                if (step.date) {
                    const parsed = new Date(step.date);
                    expect(isNaN(parsed.getTime())).toBe(false);
                    expect(typeof step.dateLabel).toBe('string');
                }
            });
        });
    });
});
