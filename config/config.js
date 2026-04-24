/**
 * Configuration Module
 * Centralizes all API key management for the application.
 *
 * SECURITY NOTE: For a production deployment, keys must be handled
 * server-side (via a proxy/BFF) to prevent client-side exposure.
 * These keys are intentionally embedded for this client-side demo.
 */
const Config = (() => {
    const GEMINI_API_KEY = "__GEMINI_API_KEY__";
    const MAPS_API_KEY   = "__MAPS_API_KEY__";

    return {
        getGeminiKey: () => GEMINI_API_KEY,
        getMapsKey:   () => MAPS_API_KEY,
    };
})();
