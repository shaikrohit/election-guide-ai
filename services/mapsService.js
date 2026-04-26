/**
 * Google Maps JavaScript API Integration Service.
 * Provides interactive map rendering and geocoding.
 */
class MapsService {
    /**
     * @param {string} containerId - ID of the map container element.
     * @param {string} fallbackId  - ID of the fallback message element.
     * @param {string} linkId      - ID of the external "Open in Maps" link element.
     */
    constructor(containerId, fallbackId, linkId) {
        this.containerId = containerId;
        this.container   = document.getElementById(containerId);
        this.fallback    = document.getElementById(fallbackId);
        this.link        = document.getElementById(linkId);
        
        this.map = null;
        this.geocoder = null;
        this.isLoaded = false;
    }

    /**
     * Loads the Google Maps JS API script dynamically.
     */
    async loadApi() {
        if (this.isLoaded) return;

        const apiKey = Config.getMapsKey();
        if (!apiKey || apiKey.startsWith('__')) {
            console.warn('MapsService: No API key, using basic embed.');
            return;
        }

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
            script.async = true;
            script.defer = true;
            
            window.initMap = () => {
                this.isLoaded = true;
                this.geocoder = new google.maps.Geocoder();
                resolve();
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Finds polling stations near the user's location.
     */
    async findPollingStation() {
        if (!navigator.onLine) {
            this.showFallback("No internet connection.");
            return;
        }

        this.showFallback("📍 Locating you…");

        if (!navigator.geolocation) {
            this.showFallback("Geolocation is not supported.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                await this.renderInteractiveMap(coords);
            },
            (error) => {
                this.showFallback("Permission denied or location unavailable.");
            }
        );
    }

    /**
     * Renders a fully interactive map using Google Maps JS API.
     * @param {Object} center - {lat, lng} coordinates.
     */
    async renderInteractiveMap(center) {
        await this.loadApi();

        if (!this.isLoaded) {
            // Fallback to legacy renderMap if JS API failed to load
            this._renderLegacyMap(center.lat, center.lng);
            return;
        }

        this.fallback.classList.add('hidden');
        this.container.classList.remove('hidden');
        this.container.innerHTML = '';

        this.map = new google.maps.Map(this.container, {
            center: center,
            zoom: 14,
            styles: this._getPremiumStyles(),
            disableDefaultUI: false,
            mapTypeControl: false
        });

        // Add User Marker
        new google.maps.Marker({
            position: center,
            map: this.map,
            title: "Your Location",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "white"
            }
        });

        // Search for Polling Stations
        const service = new google.maps.places.PlacesService(this.map);
        service.nearbySearch({
            location: center,
            radius: 5000,
            type: ['polling_station', 'government_office']
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach(place => {
                    new google.maps.Marker({
                        position: place.geometry.location,
                        map: this.map,
                        title: place.name,
                        animation: google.maps.Animation.DROP
                    });
                });
            }
        });

        this._showExternalLink(`https://www.google.com/maps/search/polling+station+near+me/@${center.lat},${center.lng},15z`);
    }

    /** Legacy fallback */
    _renderLegacyMap(lat, lng) {
        const query = encodeURIComponent(`polling station near ${lat},${lng}`);
        const embedSrc = `https://maps.google.com/maps?q=${query}&output=embed&z=14&hl=en`;
        this.container.innerHTML = `<iframe width="100%" height="100%" class="map-iframe" src="${embedSrc}"></iframe>`;
        this.container.classList.remove('hidden');
    }

    /** Private Styles */
    _getPremiumStyles() {
        return [
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }] },
            { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }] }
        ];
    }

    _showExternalLink(href) {
        if (this.link) {
            this.link.href = href;
            this.link.classList.remove('hidden');
        }
    }

    showFallback(message) {
        this.container.classList.add('hidden');
        this.fallback.classList.remove('hidden');
        this.fallback.textContent = message;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapsService;
}
