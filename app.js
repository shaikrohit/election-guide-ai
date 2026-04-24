// Main Application Orchestrator

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Utilities
    const announcer = new A11yAnnouncer('a11y-announcer');

    // 2. Initialize State Management
    const appState = new AppState();

    // 3. Initialize Services
    const geminiService = new GeminiService();
    const mapsService = new MapsService('mapContainer', 'mapFallback', 'openMapsLink');

    // 4. Initialize UI Components
    const chatUI = new ChatUI(appState, geminiService, announcer);
    const mainUI = new MainUI(appState, announcer, mapsService);
    const stepperUI = new StepperUI('stepsContainer', 'flowTitle', appState, Flows);

    // Initial render not strictly needed if state is null, 
    // but good practice if there's default state.
    stepperUI.render();

});
