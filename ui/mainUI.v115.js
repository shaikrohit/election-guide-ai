// ui/mainUI.js

/**
 * Handles main UI navigation and initialization.
 * Enhanced with failsafe direct attachments.
 */
class MainUI {
    constructor(appState, announcer, mapsService, firebaseService) {
        this.appState = appState;
        this.announcer = announcer;
        this.mapsService = mapsService;
        this.firebaseService = firebaseService;

        this.appMain = document.querySelector('.app-main');
        this.personaScreen = document.getElementById('personaScreen');
        this.flowScreen = document.getElementById('flowScreen');
        this.backToHomeBtn = document.getElementById('backToHomeBtn');
        this.findLocationBtn = document.getElementById('findLocationBtn');

        this.initListeners();
        console.log("MainUI: Initialized and ready.");
    }

    initListeners() {
        console.log("MainUI: Binding delegated listeners...");
        
        const cardsContainer = document.querySelector('.cards-container');
        if (cardsContainer) {
            cardsContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.persona-card');
                if (card) {
                    e.preventDefault();
                    const persona = card.getAttribute('data-persona');
                    const title = card.querySelector('h3')?.textContent;
                    console.log(`MainUI: Card clicked -> ${persona}`);
                    this.handlePersonaSelect(persona, title);
                }
            });
        } else {
            console.warn("MainUI: .cards-container not found!");
        }

        if (this.backToHomeBtn) {
            this.backToHomeBtn.addEventListener('click', () => {
                console.log("MainUI: Back to home clicked.");
                this.handleBackToHome();
            });
        }

        if (this.findLocationBtn) {
            this.findLocationBtn.addEventListener('click', () => {
                this.mapsService.findPollingStation();
            });
        }
    }

    handlePersonaSelect(persona, title) {
        console.log(`MainUI: Selecting persona -> ${persona}`);
        this.appState.setPersona(persona);
        
        // Force UI update
        if (this.personaScreen) {
            this.personaScreen.classList.remove('active');
            this.personaScreen.style.display = 'none';
        }
        if (this.flowScreen) {
            this.flowScreen.classList.add('active');
            this.flowScreen.style.display = 'block';
        }
        
        this.announcer.announce(`${title || 'Profile'} selected.`);
        
        const flowTitle = document.getElementById('flowTitle');
        if (flowTitle) {
            flowTitle.focus();
        }

        if (this.firebaseService) {
            this.firebaseService.logUserEvent('select_persona', { persona });
        }
    }

    handleBackToHome() {
        if (this.flowScreen) {
            this.flowScreen.classList.remove('active');
            this.flowScreen.style.display = 'none';
        }
        if (this.personaScreen) {
            this.personaScreen.classList.add('active');
            this.personaScreen.style.display = 'block';
        }
        this.appState.setPersona(null);
        this.announcer.announce('Returned to profile selection.');
    }
}

window.MainUI = MainUI;
