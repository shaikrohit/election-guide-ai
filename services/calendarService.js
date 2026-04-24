// Service for Google Calendar Links (No API Key Required)

const CalendarService = {
    /**
     * Generates a Google Calendar event creation link
     * @param {string} title - Event title
     * @param {string} details - Event details/description
     * @param {string} dateString - ISO Date string (e.g., "2026-05-01T00:00:00Z")
     * @returns {string} Google Calendar URL
     */
    generateGoogleCalendarLink: (title, details, dateString) => {
        try {
            const startDate = new Date(dateString);

            // Guard: invalid date → return link with title only
            if (isNaN(startDate.getTime())) {
                throw new Error('Invalid date');
            }

            // Default to a 1-hour event
            const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

            // Format dates to YYYYMMDDTHHMMSSZ (Google Calendar format)
            const formatGoogleDate = (d) => {
                return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
            };

            const start = formatGoogleDate(startDate);
            const end = formatGoogleDate(endDate);

            // URL Encode parameters
            const urlParams = new URLSearchParams({
                action: 'TEMPLATE',
                text: title,
                details: details,
                dates: `${start}/${end}`
            });

            return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
        } catch (_) {
            // Fallback for any date parsing failure
            const fallbackParams = new URLSearchParams({
                action: 'TEMPLATE',
                text: title || 'Election Event',
                details: details || ''
            });
            return `https://calendar.google.com/calendar/render?${fallbackParams.toString()}`;
        }
    }
};
