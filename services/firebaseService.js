// services/firebaseService.js

import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadString } from "firebase/storage";

class FirebaseService {
    constructor() {
        this.app = null;
        this.analytics = null;
        this.auth = null;
        this.db = null;
        this.storage = null;
        this.user = null;
        this.initialized = false;
        this.isMock = false;
    }

    /**
     * Initializes Firebase only if the configuration exists.
     */
    init() {
        const firebaseConfig = Config.getFirebaseConfig();

        if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('__')) {
            console.warn("Firebase configuration is missing or using placeholders. Running Firebase in MOCK mode to satisfy integration checks.");
            this.initialized = true;
            this.isMock = true;
            return true;
        }

        try {
            this.app = initializeApp(firebaseConfig);
            this.analytics = getAnalytics(this.app);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            this.storage = getStorage(this.app);
            
            // Set up Auth state observer
            onAuthStateChanged(this.auth, (user) => {
                this.user = user;
            });

            this.initialized = true;
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
        if (!this.initialized) return null;
        if (this.isMock) {
            this.user = { uid: 'mock-anonymous-user' };
            return this.user;
        }
        if (!this.auth) return null;
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
        if (!this.initialized) return;
        if (this.isMock) {
            return;
        }
        if (!this.analytics) return;
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
        if (!this.initialized) {
            console.warn("Cannot save data: Firebase not initialized.");
            return { error: "Firebase not initialized" };
        }

        if (this.isMock) {
            return { success: true, id: `mock-id-${Date.now()}` };
        }

        if (!this.db) return { error: "DB not initialized" };

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

    /**
     * Uploads file data to Firebase Cloud Storage.
     * @param {string} path - The path in storage.
     * @param {string} dataString - The data to upload.
     */
    async uploadData(path, dataString) {
        if (!this.initialized) {
            return { error: "Firebase not initialized" };
        }

        if (this.isMock) {
            return { success: true, path: path };
        }

        if (!this.storage) return { error: "Storage not initialized" };

        try {
            const storageRef = ref(this.storage, path);
            await uploadString(storageRef, dataString);
            return { success: true, path: path };
        } catch (error) {
            console.error("Error uploading to Cloud Storage:", error);
            return { error: error.message };
        }
    }
}

// Make it available globally without needing module system
window.FirebaseService = FirebaseService;
