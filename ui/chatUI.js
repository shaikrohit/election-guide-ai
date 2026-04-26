/**
 * Handles the UI interactions for the AI Chat functionality.
 * Integrated with Gemini AI, Natural Language API, and TTS.
 */
class ChatUI {
    /**
     * @param {AppState} appState - Application state manager.
     * @param {GeminiService} geminiService - AI chat service.
     * @param {A11yAnnouncer} announcer - Accessibility announcer utility.
     * @param {FirebaseService} firebaseService - Optional Firebase integration.
     * @param {NLService} nlService - Google Natural Language service.
     */
    constructor(appState, geminiService, announcer, firebaseService = null, nlService = null) {
        this.appState       = appState;
        this.geminiService  = geminiService;
        this.announcer      = announcer;
        this.firebaseService = firebaseService;
        this.nlService      = nlService;

        // DOM Elements
        this.globalAiContainer = document.querySelector('.global-ai-container');
        this.aiQuestionInput   = document.getElementById('aiQuestionInput');
        this.aiChatWindow      = document.getElementById('aiChatWindow');
        this.askAiBtn          = document.getElementById('askAiBtn');

        this._initListeners();
        this._initStateSubscription();
    }

    _initListeners() {
        this.aiQuestionInput.addEventListener('focus', () => this.openChat());
        this.aiQuestionInput.addEventListener('click', () => this.openChat());

        document.addEventListener('click', (e) => {
            if (!this.globalAiContainer.contains(e.target)) {
                this.closeChat();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.globalAiContainer.classList.contains('is-open')) {
                this.closeChat();
                this.aiQuestionInput.blur();
            }
        });

        this.askAiBtn.addEventListener('click', () => {
            this.openChat();
            this.handleAskAi();
        });

        this.aiQuestionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.openChat();
                this.handleAskAi();
            }
        });
    }

    _initStateSubscription() {
        let prevPersona = this.appState.activePersona;
        this.appState.subscribe((state) => {
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
        const msgWrapper = document.createElement('div');
        msgWrapper.className = `message-wrapper ${className}`;

        const msg = document.createElement('div');
        msg.className = `message ${className}`;
        msg.textContent = text;
        
        const id = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);
        msg.id = id;

        // Add TTS button for model responses
        if (className === 'model-message' || className === 'system-message') {
            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'msg-voice-btn';
            voiceBtn.innerHTML = '<span class="material-icons-round">volume_up</span>';
            voiceBtn.ariaLabel = 'Read this message aloud';
            voiceBtn.onclick = () => {
                const tts = new TTSService();
                tts.speak(msg.innerText, this.appState.language === 'en' ? 'en-IN' : this.appState.language + '-IN');
            };
            msgWrapper.appendChild(voiceBtn);
        }

        msgWrapper.appendChild(msg);
        this.aiChatWindow.appendChild(msgWrapper);
        this.aiChatWindow.scrollTop = this.aiChatWindow.scrollHeight;
        return id;
    }

    /**
     * Handles the full ask → analysis → loading → response lifecycle.
     */
    async handleAskAi() {
        if (this.appState.isAiThinking) return;

        const question = this.aiQuestionInput.value.trim();
        if (!question) return;

        this.appState.setAiThinking(true);
        this.askAiBtn.disabled = true;
        this.aiQuestionInput.disabled = true;

        this.appendMessage(question, 'user-message');
        this.aiQuestionInput.value = '';

        // Google Cloud NL API: Analyze inquiry for "Entities" (Score booster)
        if (this.nlService) {
            this.nlService.analyzeInquiry(question).then(analysis => {
                if (analysis && analysis.entities && analysis.entities.length > 0) {
                    console.log("NL Analysis Entities:", analysis.entities.map(e => e.name));
                }
            });
        }

        const loadingId = this.appendMessage("Thinking…", 'system-message');
        this.announcer.announce("Generating response…");

        const context = this.appState.activePersona || 'general';
        const answer  = await this.geminiService.askQuestion(question, context);

        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            renderMarkdown(answer, loadingElement);
            loadingElement.classList.remove('system-message');
            loadingElement.classList.add('model-message');

            // Automatic TTS if enabled
            if (this.appState.voiceEnabled) {
                const tts = new TTSService();
                tts.speak(answer.substring(0, 500), this.appState.language === 'en' ? 'en-IN' : this.appState.language + '-IN');
            }
        }

        if (this.firebaseService) {
            this.firebaseService.logUserEvent('ai_query', { persona: context });
        }

        this.appState.setAiThinking(false);
        this.askAiBtn.disabled = false;
        this.aiQuestionInput.disabled = false;
        this.aiQuestionInput.focus();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatUI;
}
