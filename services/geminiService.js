// Service for handling Google Gemini API integration

/**
 * Google Gemini AI Service.
 * Provides multi-turn conversational AI with automatic model failover,
 * response caching, and rate limiting. Supports both Gemini and Gemma models.
 */
class GeminiService {
    /** Initializes the service with model definitions, cache, and history. */
    constructor() {
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

        // Models to try in order of preference.
        // - Gemini models support systemInstruction and give the best responses.
        // - Gemma models are open-source fallbacks with separate quota pools.
        //   They do NOT support systemInstruction, so context is injected
        //   into the first user message instead.
        this.models = [
            { name: "gemini-2.5-flash",      supportsSystem: true  },
            { name: "gemini-2.5-flash-lite",  supportsSystem: true  },
            { name: "gemma-3-27b-it",         supportsSystem: false },
            { name: "gemma-3-12b-it",         supportsSystem: false },
            { name: "gemma-3-4b-it",          supportsSystem: false },
            { name: "gemma-3-1b-it",          supportsSystem: false },
        ];

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

        // Use mock if no key available or placeholder not replaced
        if (!apiKey || apiKey === "__GEMINI_API_KEY__") {
            return this.getMockResponse(cleanQuestion, persona);
        }

        // Cache lookup (only for single-turn — skip when history exists)
        const cacheKey = `${persona}:${cleanQuestion.toLowerCase()}`;
        if (this.cache.has(cacheKey) && this.conversationHistory.length === 0) {
            return this.cache.get(cacheKey);
        }

        const contextMap = {
            "first-time": "You are a helpful, friendly AI assistant for a first-time voter in India. Keep answers simple, reassuring, and step-by-step. Use plain language.",
            "regular":    "You are a helpful AI for an experienced voter in India. Be concise and direct about polling and verification.",
            "candidate":  "You are a professional AI advisor for a political candidate in India. Provide factual, legally-grounded information about election rules and campaigning.",
            "general":    "You are a helpful election assistant for Indian elections. Guide the user through general election inquiries."
        };
        const systemInstruction = contextMap[persona] || contextMap["general"];

        // Build multi-turn contents array from history
        const newUserMessage = { role: "user", parts: [{ text: cleanQuestion }] };

        this.lastCallTime = Date.now();

        // Try each model in order — ALL errors cause fallback to next model
        let lastError = "";
        for (const model of this.models) {
            const endpoint = `${this.baseUrl}/${model.name}:generateContent?key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            // Build the request body based on model capabilities
            const body = this._buildRequestBody(model, systemInstruction, cleanQuestion, newUserMessage);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify(body)
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const errMsg  = errData?.error?.message || '';
                    const status  = errData?.error?.code   || response.status;
                    lastError = `${model.name}: [${status}] ${errMsg.substring(0, 100)}`;
                    console.warn(`⚠️ Model ${model.name} failed (${status}), trying next...`);
                    continue; // ALL errors → try next model
                }

                const data = await response.json();
                const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (answer) {
                    // Update conversation history (always store as user/model pair)
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
                    console.warn(`⚠️ Model ${model.name} returned empty response, trying next...`);
                    lastError = `${model.name}: empty response`;
                    continue;
                }

            } catch (error) {
                clearTimeout(timeoutId);
                lastError = `${model.name}: ${error.message}`;
                console.warn(`⚠️ Model ${model.name} error: ${error.message}, trying next...`);
                continue; // Network errors, timeouts → try next model
            }
        }

        // All models exhausted — log the last error for debugging
        console.error("All models exhausted. Last error:", lastError);
        return "⏳ The AI assistant is temporarily unavailable. Please try again in a moment, or use the step guides and official links — they have everything you need!";
    }

    /**
     * Builds the request body, adapting to model capabilities.
     * - Gemini models: use systemInstruction field.
     * - Gemma models: prepend system context into the first user message text.
     */
    _buildRequestBody(model, systemInstruction, cleanQuestion, newUserMessage) {
        const generationConfig = { temperature: 0.3, maxOutputTokens: 1024 };

        if (model.supportsSystem) {
            // Gemini models: use the dedicated systemInstruction field
            const contents = [...this.conversationHistory, newUserMessage];
            return {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: contents,
                generationConfig
            };
        } else {
            // Gemma models: inject context into the user message directly
            const contextualQuestion = `[Context: ${systemInstruction}]\n\nUser question: ${cleanQuestion}`;
            const contextualMessage = { role: "user", parts: [{ text: contextualQuestion }] };

            // For Gemma, send only the current question (no multi-turn history,
            // as Gemma models may not handle it reliably)
            return {
                contents: [contextualMessage],
                generationConfig
            };
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
