// Service for handling Google Gemini API integration

class GeminiService {
    constructor() {
        this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
        this.cache = new Map();
        this.lastCallTime = 0;
        this.conversationHistory = []; // Multi-turn conversation memory
        this.MAX_HISTORY_TURNS = 6;   // Keep last 6 turns (12 messages) for context
    }

    /**
     * Ask Gemini a question with persona context and full conversation history.
     * @param {string} question - The user's question
     * @param {string} persona  - The active persona (e.g., 'first-time')
     * @returns {Promise<string>} The response text
     */
    async askQuestion(question, persona) {
        if (!navigator.onLine) {
            return "⚠️ No internet connection. Please check your network and try again.";
        }

        const now = Date.now();
        if (now - this.lastCallTime < 2000) {
            return "Please wait a moment before asking another question.";
        }

        if (!question || typeof question !== 'string') return "Please provide a valid question.";

        // Sanitize: strip injection-relevant chars, limit length
        const cleanQuestion = question.replace(/[<>{}[\]]/g, '').trim().substring(0, 400);
        if (!cleanQuestion) return "Please provide a valid question.";

        const apiKey = Config.getGeminiKey();

        // Use mock if no key available
        if (!apiKey) {
            return this.getMockResponse(cleanQuestion, persona);
        }

        // Cache lookup (only for single-turn — skip when history exists)
        const cacheKey = `${persona}:${cleanQuestion.toLowerCase()}`;
        if (this.cache.has(cacheKey) && this.conversationHistory.length === 0) {
            return this.cache.get(cacheKey);
        }

        const contextMap = {
            "first-time": "You are a helpful, friendly AI assistant for a first-time voter. Keep answers simple, reassuring, and step-by-step. Use plain language.",
            "regular":    "You are a helpful AI for an experienced voter. Be concise and direct about polling and verification.",
            "candidate":  "You are a professional AI advisor for a political candidate. Provide factual, legally-grounded information about election rules and campaigning.",
            "general":    "You are a helpful election assistant. Guide the user through general election inquiries."
        };
        const systemInstruction = contextMap[persona] || contextMap["general"];

        // Build multi-turn contents array from history
        const newUserMessage = { role: "user", parts: [{ text: cleanQuestion }] };
        const contents = [...this.conversationHistory, newUserMessage];

        this.lastCallTime = Date.now();

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: contents,
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg  = errData?.error?.message || '';
                const status  = errData?.error?.code   || response.status;

                // Friendly quota / rate-limit message
                if (status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource_exhausted')) {
                    return "⏳ The AI assistant has reached its daily free quota. It will reset automatically. In the meantime, use the step guides and official links — they have everything you need!";
                }

                console.error(`Gemini API error [${status}]:`, errMsg, errData);
                return "Unable to reach the AI assistant right now. Please try again in a moment.";
            }

            clearTimeout(timeoutId);

            const data = await response.json();

            const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer) {

                // Update conversation history
                this.conversationHistory.push(newUserMessage);
                this.conversationHistory.push({ role: "model", parts: [{ text: answer }] });

                // Trim history to MAX_HISTORY_TURNS (oldest pairs removed first)
                if (this.conversationHistory.length > this.MAX_HISTORY_TURNS * 2) {
                    this.conversationHistory = this.conversationHistory.slice(-this.MAX_HISTORY_TURNS * 2);
                }

                // Cache only the first answer for this question (no history context)
                if (!this.cache.has(cacheKey)) {
                    this.cache.set(cacheKey, answer);
                    if (this.cache.size > 25) {
                        this.cache.delete(this.cache.keys().next().value);
                    }
                }

                return answer;
            } else {
                return "I couldn't generate a response. Could you rephrase your question?";
            }

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                return "The AI took too long to respond. Please try again.";
            }
            return "A network error occurred. Please check your connection and try again.";
        }
    }

    /**
     * Clears the conversation history. Call when persona changes or chat resets.
     */
    clearHistory() {
        this.conversationHistory = [];
        this.cache.clear();
    }

    /**
     * Fallback response generator when no API key is available.
     * @param {string} question
     * @param {string} persona
     */
    getMockResponse(question, persona) {
        const q = question.toLowerCase();
        if (q.includes('id') || q.includes('document')) {
            return "You typically need a government-issued ID like a Voter Card, Driver's License, or Passport.";
        }
        if (q.includes('when') || q.includes('date') || q.includes('deadline')) {
            return "Please check the timeline on the left for important dates specific to your category.";
        }
        if (q.includes('where') || q.includes('location') || q.includes('station')) {
            return "Use the 'Find Polling Station' tool on the right panel to locate your nearest booth.";
        }
        if (q.includes('register') || q.includes('eligib')) {
            return "To register, you must be 18+ and a citizen. Visit voters.eci.gov.in to register or verify your enrollment.";
        }
        return "I can answer questions about ID requirements, important dates, voter registration, and finding your polling station. What would you like to know?";
    }
}
