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
        // Use both delegation AND direct attachment as a failsafe
        const cards = document.querySelectorAll('.persona-card');
        console.log(`MainUI: Found ${cards.length} persona cards.`);

        cards.forEach(card => {
            card.onclick = (e) => {
                e.preventDefault();
                const persona = card.getAttribute('data-persona');
                this.handlePersonaSelect(persona, card.querySelector('h3')?.textContent);
            };
        });

        if (this.backToHomeBtn) {
            this.backToHomeBtn.onclick = () => {
                this.handleBackToHome();
            };
        }

        if (this.findLocationBtn) {
            this.findLocationBtn.onclick = () => {
                this.mapsService.findPollingStation();
            };
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
