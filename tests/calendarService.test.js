// tests/calendarService.test.js

const CalendarService = require('../services/calendarService');

describe('CalendarService', () => {
    describe('generateGoogleCalendarLink', () => {
        it('should generate a valid google calendar link with specific date', () => {
            const title = 'Test Event';
            const details = 'Test Details';
            const dateString = '2026-05-01T00:00:00Z';
            
            const link = CalendarService.generateGoogleCalendarLink(title, details, dateString);
            
            expect(link).toContain('https://calendar.google.com/calendar/render?');
            expect(link).toContain('action=TEMPLATE');
            expect(link).toContain('text=Test+Event');
            expect(link).toContain('details=Test+Details');
            expect(link).toContain('dates=20260501T000000Z%2F20260501T010000Z');
        });

        it('should generate fallback link when date is invalid', () => {
            const title = 'Test Event';
            const details = 'Test Details';
            const dateString = 'invalid date';
            
            const link = CalendarService.generateGoogleCalendarLink(title, details, dateString);
            
            expect(link).toContain('https://calendar.google.com/calendar/render?');
            expect(link).toContain('action=TEMPLATE');
            expect(link).toContain('text=Test+Event');
            expect(link).toContain('details=Test+Details');
            expect(link).not.toContain('dates=');
        });
    });
});
