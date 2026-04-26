// logic/appState.js

/**
 * Lightweight, centralized state management for the application.
 */
class AppState {
    constructor() {
        this.activePersona = null;
        this.currentStep = 1;
        this.stepState = {};
        this.isAiThinking = false;
        this.listeners = [];
    }

    /**
     * Subscribes a listener to state changes.
     * @param {Function} listener - The callback function.
     */
    subscribe(listener) {
        this.listeners.push(listener);
    }

    /**
     * Notifies all listeners of a state change.
     */
    notify() {
        this.listeners.forEach(listener => listener(this));
    }

    /**
     * Sets the active persona and resets step state.
     * @param {string|null} persona - The persona ID.
     */
    setPersona(persona) {
        this.activePersona = persona;
        this.currentStep = 1;
        this.stepState = {};
        this.notify();
    }

    /**
     * Updates the current step in the flow.
     * Enforces sequential progression — never skips ahead by more than one step.
     * @param {number} step - The step number.
     */
    setStep(step) {
        // Allow going back to any already-completed step, but only advance by 1.
        if (step > this.currentStep + 1) return;
        this.currentStep = step;
        this.notify();
    }

    /**
     * Toggles a boolean value in the step state.
     * @param {string} key - The state key.
     */
    toggleStepState(key) {
        this.stepState[key] = !this.stepState[key];
        this.notify();
    }

    /**
     * Sets a specific value in the step state.
     * @param {string} key - The state key.
     * @param {any} value - The state value.
     */
    setStepState(key, value) {
        this.stepState[key] = value;
        this.notify();
    }

    /**
     * Updates the AI thinking status.
     * @param {boolean} isThinking 
     */
    setAiThinking(isThinking) {
        this.isAiThinking = isThinking;
        this.notify();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}
