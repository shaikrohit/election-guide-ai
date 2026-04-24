/**
 * Configuration Module
 * Centralizes all API key management for the application.
 *
 * Keys are injected at runtime via environment variables in production.
 * The __GEMINI_API_KEY__ and __MAPS_API_KEY__ placeholders are replaced
 * by the Docker entrypoint script with actual values from Cloud Run.
 *
 * For local development, replace the placeholders with your keys directly.
 */
const Config = (() => {
    const GEMINI_API_KEY = "__GEMINI_API_KEY__";
    const MAPS_API_KEY   = "__MAPS_API_KEY__";

    return {
        getGeminiKey: () => GEMINI_API_KEY,
        getMapsKey:   () => MAPS_API_KEY,
    };
})();
