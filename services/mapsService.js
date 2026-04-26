// Service for Google Maps Integration
// Uses the Maps Embed API v1 (requires API key) for accurate search results.

/**
 * Google Maps Integration Service.
 * Provides polling station location lookup using the Maps Embed API.
 * Falls back gracefully to an external link when geolocation or API key is unavailable.
 */
class MapsService {
    /**
     * @param {string} containerId - ID of the map container element.
     * @param {string} fallbackId  - ID of the fallback message element.
     * @param {string} linkId      - ID of the external "Open in Maps" link element.
     */
    constructor(containerId, fallbackId, linkId) {
        this.container = document.getElementById(containerId);
        this.fallback  = document.getElementById(fallbackId);
        this.link      = document.getElementById(linkId);

        // Cache: prevent re-rendering the map on repeated clicks
        this._mapRendered = false;
        this._cachedLat   = null;
        this._cachedLng   = null;
    }

    /**
     * Requests geolocation and renders the nearest polling station map.
     * Skips re-render if map was already successfully shown.
     */
    async findPollingStation() {
        if (!navigator.onLine) {
            this.showFallback("No internet connection. Please check your network.");
            return;
        }

        // Return cached map if already rendered — no redundant iframe injection
        if (this._mapRendered) {
            this.fallback.classList.add('hidden');
            this.container.classList.remove('hidden');
            if (this.link) this.link.classList.remove('hidden');
            return;
        }

        if (!navigator.geolocation) {
            this.showFallback("Geolocation is not supported by your browser.");
            this._showExternalLink(`https://www.google.com/maps/search/polling+station+near+me/`);
            return;
        }

        this.showFallback("📍 Locating you… please allow location access if prompted.");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this._cachedLat = position.coords.latitude;
                this._cachedLng = position.coords.longitude;
                this.renderMap(this._cachedLat, this._cachedLng);
            },
            (error) => {
                const msg = error.code === 1
                    ? "Location permission was denied. Use the link below to search manually."
                    : "Unable to retrieve your location. Use the link below to search manually.";
                this.showFallback(msg);
                this._showExternalLink(`https://www.google.com/maps/search/polling+station+near+me/`);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

    /**
     * Injects a Google Maps embed iframe using the Maps Embed API v1.
     * Provides accurate, official polling station search results.
     * @param {number} lat
     * @param {number} lng
     */
    renderMap(lat, lng) {
        const apiKey = Config.getMapsKey();

        // Always show the "Open in Google Maps" deep-link button
        const deepLink = `https://www.google.com/maps/search/polling+station+near+me/@${lat},${lng},15z`;
        this._showExternalLink(deepLink);

        // Maps Embed API v1 — accurate search with key; free public embed as fallback
        const query    = encodeURIComponent(`polling station near ${lat},${lng}`);
        const embedSrc = apiKey
            ? `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${query}&center=${lat},${lng}&zoom=14`
            : `https://maps.google.com/maps?q=${query}&output=embed&z=14&hl=en`;

        // Hide fallback text
        this.fallback.classList.add('hidden');

        // Build iframe with full accessibility attributes and CSS class (no inline style)
        this.container.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src                   = embedSrc;
        iframe.width                 = '100%';
        iframe.height                = '100%';
        iframe.className             = 'map-iframe';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.setAttribute('title',      'Polling stations near your location');
        iframe.setAttribute('aria-label', 'Embedded map showing polling stations near your location');

        // Graceful fallback if iframe fails to load
        iframe.addEventListener('error', () => {
            this.showFallback('Could not load the map. Please use the link below to open Google Maps.');
        });

        this.container.appendChild(iframe);
        this.container.classList.remove('hidden');

        // Mark as rendered so we never rebuild this on repeated clicks
        this._mapRendered = true;
    }

    /** @private */
    _showExternalLink(href) {
        if (this.link) {
            this.link.href = href;
            this.link.classList.remove('hidden');
        }
    }

    /**
     * Shows a text fallback message and hides the map container.
     * @param {string} message
     */
    showFallback(message) {
        this._mapRendered = false;
        this.container.classList.add('hidden');
        this.fallback.classList.remove('hidden');
        this.fallback.textContent = message;
    }
}
