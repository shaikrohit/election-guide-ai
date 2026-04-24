// ui/chatUI.js

/**
 * Handles the UI interactions for the AI Chat functionality.
 */
class ChatUI {
    constructor(appState, geminiService, announcer) {
        this.appState       = appState;
        this.geminiService  = geminiService;
        this.announcer      = announcer;

        // DOM Elements
        this.globalAiContainer = document.querySelector('.global-ai-container');
        this.aiQuestionInput   = document.getElementById('aiQuestionInput');
        this.aiChatWindow      = document.getElementById('aiChatWindow');
        this.askAiBtn          = document.getElementById('askAiBtn');

        this._initListeners();
        this._initStateSubscription();
    }

    _initListeners() {
        // Open chat on input focus or click
        this.aiQuestionInput.addEventListener('focus', () => this.openChat());
        this.aiQuestionInput.addEventListener('click', () => this.openChat());

        // Close when clicking outside the container
        document.addEventListener('click', (e) => {
            if (!this.globalAiContainer.contains(e.target)) {
                this.closeChat();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.globalAiContainer.classList.contains('is-open')) {
                this.closeChat();
                if (this.globalAiContainer.contains(document.activeElement)) {
                    this.aiQuestionInput.blur();
                }
            }
        });

        // Send on button click
        this.askAiBtn.addEventListener('click', () => {
            this.openChat();
            this.handleAskAi();
        });

        // Send on Enter key
        this.aiQuestionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.openChat();
                this.handleAskAi();
            }
        });
    }

    /**
     * Subscribe to state: clear chat only when transitioning FROM a persona TO null.
     * This prevents the subscriber from wiping the chat on every setAiThinking() tick
     * while on the home screen (where activePersona is already null).
     */
    _initStateSubscription() {
        let prevPersona = this.appState.activePersona; // track previous value

        this.appState.subscribe((state) => {
            // Only act when persona goes FROM a value → null (user clicked "Change Profile")
            if (prevPersona !== null && state.activePersona === null) {
                this.aiChatWindow.innerHTML = '';
                this.geminiService.clearHistory();
                this.closeChat();
            }
            prevPersona = state.activePersona;
        });
    }

    openChat() {
        this.globalAiContainer.classList.add('is-open');
    }

    closeChat() {
        this.globalAiContainer.classList.remove('is-open');
    }

    /**
     * Appends a message bubble to the chat window.
     * @param {string} text
     * @param {string} className
     * @returns {string} The generated message element ID
     */
    appendMessage(text, className) {
        const msg = document.createElement('div');
        msg.className = `message ${className}`;
        msg.textContent = text;
        const id = 'msg-' + Date.now();
        msg.id = id;
        this.aiChatWindow.appendChild(msg);
        this.aiChatWindow.scrollTop = this.aiChatWindow.scrollHeight;
        return id;
    }

    /**
     * Handles the full ask → loading → response lifecycle.
     */
    async handleAskAi() {
        if (this.appState.isAiThinking) return;

        const question = this.aiQuestionInput.value.trim();

        if (!question) {
            this.appendMessage("Please enter a question.", 'system-message');
            this.announcer.announce("Please enter a question.");
            return;
        }

        this.appState.setAiThinking(true);
        this.askAiBtn.disabled          = true;
        this.aiQuestionInput.disabled   = true;

        this.appendMessage(question, 'user-message');
        this.aiQuestionInput.value = '';

        const loadingId = this.appendMessage("Thinking…", 'system-message');
        this.announcer.announce("Generating response…");

        const context = this.appState.activePersona || 'general';
        const answer  = await this.geminiService.askQuestion(question, context);

        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            renderMarkdown(answer, loadingElement);
        }

        this.announcer.announce("Response received.");

        this.appState.setAiThinking(false);
        this.askAiBtn.disabled        = false;
        this.aiQuestionInput.disabled = false;
        this.aiQuestionInput.focus();
    }
}
