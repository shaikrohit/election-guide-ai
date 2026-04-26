// services/firebaseService.js

import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

class FirebaseService {
    constructor() {
        this.app = null;
        this.analytics = null;
        this.auth = null;
        this.db = null;
        this.user = null;
        this.initialized = false;
    }

    /**
     * Initializes Firebase only if the configuration exists.
     */
    init() {
        const firebaseConfig = Config.getFirebaseConfig();

        if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('__')) {
            console.warn("Firebase configuration is missing or using placeholders. Firebase services are disabled.");
            return false;
        }

        try {
            this.app = initializeApp(firebaseConfig);
            this.analytics = getAnalytics(this.app);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            
            // Set up Auth state observer
            onAuthStateChanged(this.auth, (user) => {
                this.user = user;
                if (user) {
                    console.log("Firebase Anonymous User ID:", user.uid);
                }
            });

            this.initialized = true;
            console.log("Firebase initialized successfully.");
            return true;
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            return false;
        }
    }

    /**
     * Authenticates the user anonymously.
     * This is useful for saving session data without requiring a login form.
     */
    async loginAnonymously() {
        if (!this.initialized || !this.auth) return null;
        try {
            const userCredential = await signInAnonymously(this.auth);
            return userCredential.user;
        } catch (error) {
            console.error("Anonymous auth failed:", error);
            return null;
        }
    }

    /**
     * Logs an analytics event to Google Analytics (GA4).
     * @param {string} eventName - Name of the event
     * @param {object} eventParams - Additional parameters
     */
    logUserEvent(eventName, eventParams = {}) {
        if (!this.initialized || !this.analytics) return;
        try {
            logEvent(this.analytics, eventName, eventParams);
        } catch (error) {
            console.warn("Failed to log event:", error);
        }
    }

    /**
     * Saves user feedback or interaction data to Cloud Firestore.
     * @param {string} collectionName - Name of the collection
     * @param {object} data - Data payload to save
     */
    async saveData(collectionName, data) {
        if (!this.initialized || !this.db) {
            console.warn("Cannot save data: Firebase not initialized.");
            return { error: "Firebase not initialized" };
        }

        try {
            // Ensure user is authenticated before writing
            if (!this.user) {
                await this.loginAnonymously();
            }

            const docRef = await addDoc(collection(this.db, collectionName), {
                ...data,
                userId: this.user ? this.user.uid : 'anonymous',
                timestamp: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            return { error: error.message };
        }
    }
}

// Make it available globally without needing module system
window.FirebaseService = FirebaseService;
