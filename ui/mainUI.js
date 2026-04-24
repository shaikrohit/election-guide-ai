// ui/mainUI.js

/**
 * Handles main UI navigation and initialization.
 */
class MainUI {
    constructor(appState, announcer, mapsService) {
        this.appState = appState;
        this.announcer = announcer;
        this.mapsService = mapsService;

        // Screens
        this.personaScreen = document.getElementById('personaScreen');
        this.flowScreen = document.getElementById('flowScreen');
        
        // Buttons
        this.backToHomeBtn = document.getElementById('backToHomeBtn');
        this.findLocationBtn = document.getElementById('findLocationBtn');

        this.initListeners();
    }

    initListeners() {
        // Persona Selection
        const personaCards = document.querySelectorAll('.persona-card');
        personaCards.forEach(card => {
            card.addEventListener('click', () => {
                const persona = card.getAttribute('data-persona');
                this.appState.setPersona(persona);
                
                this.personaScreen.classList.remove('active');
                this.flowScreen.classList.add('active');
                
                this.announcer.announce(`${card.querySelector('h3').textContent} profile selected. Guide loaded.`);
                
                const flowTitle = document.getElementById('flowTitle');
                if (flowTitle) {
                    flowTitle.setAttribute('tabindex', '-1');
                    flowTitle.focus();
                }
            });
        });

        // Back to Home
        this.backToHomeBtn.addEventListener('click', () => {
            this.flowScreen.classList.remove('active');
            this.personaScreen.classList.add('active');
            this.appState.setPersona(null);
            
            this.announcer.announce('Returned to profile selection.');
            
            const firstCard = document.querySelector('.persona-card');
            if (firstCard) firstCard.focus();
        });

        // Maps Handling
        this.findLocationBtn.addEventListener('click', () => {
            this.announcer.announce("Fetching your location...");
            this.mapsService.findPollingStation();
        });
    }
}
