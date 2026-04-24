// utils/announcer.js

/**
 * Handles accessibility announcements for screen readers.
 */
class A11yAnnouncer {
    constructor(elementId) {
        this.announcerElement = document.getElementById(elementId);
    }

    /**
     * Announces a message to screen readers.
     * @param {string} message - The message to announce.
     */
    announce(message) {
        if (this.announcerElement) {
            this.announcerElement.textContent = message;
            // Clear after a brief moment to allow repeated identical announcements
            setTimeout(() => { 
                if (this.announcerElement.textContent === message) {
                    this.announcerElement.textContent = ''; 
                }
            }, 3000);
        }
    }
}
