// Service for Google Civic Information API Integration
// Docs: https://developers.google.com/civic-information/docs/v2
// This API is 100% FREE — no billing required.

class CivicService {
    constructor() {
        this.baseUrl = "https://www.googleapis.com/civicinfo/v2";
        this.cache = new Map();
    }

    /**
     * Fetches a list of upcoming elections.
     * GET /elections
     * @returns {Promise<Array>} List of election objects { id, name, electionDay }
     */
    async getElections() {
        const cacheKey = "elections";
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        const apiKey = Config.getCivicKey();
        if (!apiKey) {
            return this._getFallbackElections();
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/elections?key=${apiKey}`,
                { signal: AbortSignal.timeout(10000) }
            );

            if (!response.ok) {
                console.warn(`Civic API elections error: ${response.status}`);
                return this._getFallbackElections();
            }

            const data = await response.json();
            const elections = (data.elections || []).filter(e => e.id !== "2000"); // Exclude test election
            this.cache.set(cacheKey, elections);
            return elections;
        } catch (error) {
            console.warn("Civic API elections fetch failed:", error.message);
            return this._getFallbackElections();
        }
    }

    /**
     * Fetches voter info (polling locations, contests, candidates) for an address.
     * GET /voterinfo?address=...
     * @param {string} address - Voter's registered address
     * @param {string} [electionId] - Specific election ID (optional, defaults to next election)
     * @returns {Promise<Object>} Voter info response
     */
    async getVoterInfo(address, electionId) {
        if (!address || typeof address !== "string" || address.trim().length < 3) {
            return { error: "Please provide a valid address." };
        }

        const cleanAddress = address.replace(/[<>{}[\]]/g, "").trim().substring(0, 300);
        const cacheKey = `voterinfo:${cleanAddress}:${electionId || ""}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        const apiKey = Config.getCivicKey();
        if (!apiKey) {
            return { error: "Civic API key not configured." };
        }

        try {
            let url = `${this.baseUrl}/voterinfo?key=${apiKey}&address=${encodeURIComponent(cleanAddress)}`;
            if (electionId) url += `&electionId=${encodeURIComponent(electionId)}`;
            
            const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData?.error?.message || `Error ${response.status}`;
                console.warn("Civic API voterinfo error:", errMsg);
                return { error: errMsg };
            }

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.warn("Civic API voterinfo fetch failed:", error.message);
            return { error: "Network error fetching voter info." };
        }
    }

    /**
     * Fetches representatives (elected officials) for an address.
     * GET /representatives?address=...
     * @param {string} address - Address to look up
     * @returns {Promise<Object>} Representatives response
     */
    async getRepresentatives(address) {
        if (!address || typeof address !== "string" || address.trim().length < 3) {
            return { error: "Please provide a valid address." };
        }

        const cleanAddress = address.replace(/[<>{}[\]]/g, "").trim().substring(0, 300);
        const cacheKey = `reps:${cleanAddress}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        const apiKey = Config.getCivicKey();
        if (!apiKey) {
            return { error: "Civic API key not configured." };
        }

        try {
            const url = `${this.baseUrl}/representatives?key=${apiKey}&address=${encodeURIComponent(cleanAddress)}`;
            const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.warn("Civic API representatives error:", errData?.error?.message);
                return { error: errData?.error?.message || `Error ${response.status}` };
            }

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.warn("Civic API representatives fetch failed:", error.message);
            return { error: "Network error fetching representatives." };
        }
    }

    /**
     * Clears the cache.
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Fallback election data when API is unavailable.
     */
    _getFallbackElections() {
        return [
            {
                id: "local",
                name: "Upcoming General Election (India)",
                electionDay: "2026-06-01",
                isFallback: true
            }
        ];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CivicService;
}
