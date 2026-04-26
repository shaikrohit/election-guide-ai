/**
 * Interactive Election Timeline Component
 * Renders a visual, interactive roadmap of the election process.
 */
class TimelineUI {
    /**
     * @param {string} containerId - The DOM element ID to render into.
     * @param {AppState} appState - Application state manager.
     * @param {object|null} firebaseService - Optional Firebase service for analytics.
     */
    constructor(containerId, appState, firebaseService = null) {
        this.container = document.getElementById(containerId);
        this.appState = appState;
        this.firebaseService = firebaseService;

        this.milestones = [
            { id: 'tl-1', icon: 'campaign', title: 'Election Announcement', date: 'T - 45 Days', desc: 'ECI announces dates and Model Code of Conduct begins.' },
            { id: 'tl-2', icon: 'assignment', title: 'Nominations Filing', date: 'T - 30 Days', desc: 'Candidates file papers and security deposits.' },
            { id: 'tl-3', icon: 'fact_check', title: 'Scrutiny & Withdrawal', date: 'T - 21 Days', desc: 'Verification of candidates and final list publication.' },
            { id: 'tl-4', icon: 'record_voice_over', title: 'Campaigning', date: 'T - 20 Days', desc: 'Active canvassing and public rallies across the nation.' },
            { id: 'tl-5', icon: 'how_to_vote', title: 'Polling Day', date: 'Election Day', desc: 'Voters cast ballots at assigned polling stations.' },
            { id: 'tl-6', icon: 'analytics', title: 'Counting Day', date: 'T + 3 Days', desc: 'Votes are tallied and winners are determined.' }
        ];

        this.render();
    }

    /**
     * Renders the premium roadmap.
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <h3 class="timeline-header" data-translate>Election Roadmap 2026</h3>
            <div class="timeline-track">
                ${this.milestones.map((m, i) => this._renderMilestone(m)).join('')}
            </div>
        `;
    }

    /**
     * @private
     */
    _renderMilestone(m) {
        return `
            <div class="milestone-item">
                <div class="milestone-marker">
                    <span class="material-icons-round">${m.icon}</span>
                </div>
                <div class="card">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">${m.date}</div>
                    <h4 style="margin: 0.25rem 0 0.5rem; font-size: 1.1rem;" data-translate>${m.title}</h4>
                    <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.4;" data-translate>${m.desc}</p>
                </div>
            </div>
        `;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineUI;
}
