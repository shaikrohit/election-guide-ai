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
    const MAPS_API_KEY   = "__MAPS_API_KEY__"; // Using public fallback to avoid 'Not Authorized' errors
    const CIVIC_API_KEY  = "__CIVIC_API_KEY__";
    const FIREBASE_CONFIG = {
        apiKey: "__FIREBASE_API_KEY__",
        authDomain: "__FIREBASE_AUTH_DOMAIN__",
        projectId: "__FIREBASE_PROJECT_ID__",
        storageBucket: "__FIREBASE_STORAGE_BUCKET__",
        messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
        appId: "__FIREBASE_APP_ID__",
        measurementId: "__FIREBASE_MEASUREMENT_ID__"
    };

    return {
        getGeminiKey: () => GEMINI_API_KEY,
        getMapsKey:   () => MAPS_API_KEY,
        getCivicKey:  () => CIVIC_API_KEY,
        getFirebaseConfig: () => FIREBASE_CONFIG
    };
})();
