// ui/timelineUI.js

/**
 * Interactive Election Timeline Component
 * Renders a visual, interactive timeline of the Indian election process.
 * Users can click milestones to expand detailed descriptions, view key
 * dates, and understand the full election lifecycle from announcement
 * through results.
 *
 * Directly addresses the challenge: "Create an assistant that helps users
 * understand the election process, timelines, and steps in an interactive
 * and easy-to-follow way."
 */
class TimelineUI {
    /**
     * @param {string} containerId - The DOM element ID to render into.
     * @param {object|null} firebaseService - Optional Firebase service for analytics.
     */
    constructor(containerId, firebaseService) {
        this.container = document.getElementById(containerId);
        this.firebaseService = firebaseService;
        this.expandedMilestone = null;

        /** @type {Array<{id: string, icon: string, title: string, date: string, phase: string, summary: string, details: string[]}>} */
        this.milestones = [
            {
                id: 'tl-announce',
                icon: 'campaign',
                title: 'Election Announcement',
                date: 'T – 45 days',
                phase: 'Pre-Election',
                summary: 'The Election Commission of India (ECI) announces election dates and the Model Code of Conduct comes into effect.',
                details: [
                    'ECI issues press notification with schedule for all phases.',
                    'Model Code of Conduct (MCC) is immediately enforced for all parties.',
                    'Government cannot announce new policies or schemes after this date.',
                    'Election observers are deployed to constituencies.'
                ]
            },
            {
                id: 'tl-nomination',
                icon: 'assignment',
                title: 'Nomination Filing',
                date: 'T – 30 days',
                phase: 'Pre-Election',
                summary: 'Candidates file their nomination papers with the Returning Officer along with mandatory affidavits.',
                details: [
                    'Candidates submit Form 2A (nomination) to the Returning Officer.',
                    'A security deposit of ₹25,000 (General) or ₹12,500 (SC/ST) is required.',
                    'Mandatory affidavit declaring criminal cases, assets, and educational qualifications.',
                    'Nominations are open for approximately one week.'
                ]
            },
            {
                id: 'tl-scrutiny',
                icon: 'fact_check',
                title: 'Scrutiny of Nominations',
                date: 'T – 23 days',
                phase: 'Pre-Election',
                summary: 'The Returning Officer reviews all filed nominations for validity and completeness.',
                details: [
                    'Each nomination is checked for eligibility (age, citizenship, disqualifications).',
                    'Objections can be raised by other candidates.',
                    'Invalid nominations are rejected with written reasons.',
                    'Candidates are notified of the scrutiny outcome.'
                ]
            },
            {
                id: 'tl-withdrawal',
                icon: 'remove_circle_outline',
                title: 'Last Date for Withdrawal',
                date: 'T – 21 days',
                phase: 'Pre-Election',
                summary: 'Candidates have a final window to withdraw their candidature voluntarily.',
                details: [
                    'Candidates may withdraw by submitting a notice to the Returning Officer.',
                    'After this date, the final list of contesting candidates is published.',
                    'Election symbols are allotted to candidates by the ECI.',
                    'Ballot paper / EVM order is finalized.'
                ]
            },
            {
                id: 'tl-campaign',
                icon: 'record_voice_over',
                title: 'Campaigning Period',
                date: 'T – 20 to T – 2 days',
                phase: 'Campaign',
                summary: 'Parties and candidates actively campaign. Campaigning must stop 48 hours before polling.',
                details: [
                    'Door-to-door canvassing, rallies, and roadshows are permitted.',
                    'Paid media advertisements must carry pre-certification.',
                    'Social media campaigns are monitored by the ECI.',
                    'Silence period: All campaigning stops 48 hours before voting begins.'
                ]
            },
            {
                id: 'tl-polling',
                icon: 'how_to_vote',
                title: 'Polling Day',
                date: 'Election Day',
                phase: 'Voting',
                summary: 'Voters cast their ballots at assigned polling stations using EVMs. Polls are open from 7 AM to 6 PM.',
                details: [
                    'Voters must carry a valid photo ID (EPIC, Passport, Aadhaar, etc.).',
                    'Voting is done on Electronic Voting Machines (EVMs) with VVPAT verification.',
                    'Indelible ink is applied to the left index finger to prevent duplicate voting.',
                    'NOTA (None Of The Above) option is available on every ballot.',
                    'Booth-level officers ensure accessibility for disabled and elderly voters.'
                ]
            },
            {
                id: 'tl-counting',
                icon: 'analytics',
                title: 'Counting Day',
                date: 'T + 3 days',
                phase: 'Post-Election',
                summary: 'Votes are counted under heavy security. Postal ballots are counted first, then EVM results.',
                details: [
                    'Counting begins at 8 AM at designated counting centers.',
                    'Postal ballots (including service voters) are counted first.',
                    'EVM votes are tallied round by round, results displayed publicly.',
                    'VVPAT slips are matched with EVM counts for 5 random booths per constituency.',
                    'Candidates or their agents may be present to observe.'
                ]
            },
            {
                id: 'tl-results',
                icon: 'emoji_events',
                title: 'Results & Certification',
                date: 'T + 3 days (evening)',
                phase: 'Post-Election',
                summary: 'Winners are declared and issued Certificates of Election by the Returning Officer.',
                details: [
                    'The candidate with the highest valid votes is declared the winner.',
                    'Certificate of Election (Form 22) is issued to the winning candidate.',
                    'Results are published on the ECI portal in real-time.',
                    'The full results gazette is published within 30 days.',
                    'Elected members must take oath within the stipulated timeframe.'
                ]
            }
        ];

        this._render();
        this._setupListeners();
    }

    /**
     * Renders the full interactive timeline into the container.
     */
    _render() {
        if (!this.container) return;

        const phasesHtml = this.milestones.map((m, i) => {
            const isFirst = i === 0;
            const isLast = i === this.milestones.length - 1;
            const phaseColor = this._getPhaseColor(m.phase);

            return `
                <div class="timeline-milestone" id="${m.id}" 
                     role="button" tabindex="0"
                     aria-expanded="false"
                     aria-label="${m.title} — ${m.date}">
                    <div class="timeline-connector ${isFirst ? 'timeline-connector--first' : ''} ${isLast ? 'timeline-connector--last' : ''}">
                        <div class="timeline-dot" style="background-color: ${phaseColor};">
                            <span class="material-icons-round" aria-hidden="true">${m.icon}</span>
                        </div>
                    </div>
                    <div class="timeline-card">
                        <div class="timeline-card-header">
                            <div class="timeline-card-title-group">
                                <span class="timeline-phase-tag" style="background-color: ${phaseColor}15; color: ${phaseColor}; border-color: ${phaseColor}40;">${m.phase}</span>
                                <h4 class="timeline-card-title">${m.title}</h4>
                            </div>
                            <span class="timeline-date">${m.date}</span>
                        </div>
                        <p class="timeline-card-summary">${m.summary}</p>
                        <div class="timeline-details" id="${m.id}-details">
                            <ul class="timeline-details-list">
                                ${m.details.map(d => `<li>${d}</li>`).join('')}
                            </ul>
                        </div>
                        <button class="timeline-expand-btn" aria-controls="${m.id}-details" data-milestone="${m.id}">
                            <span class="expand-text">Learn More</span>
                            <span class="material-icons-round expand-icon" aria-hidden="true">expand_more</span>
                        </button>
                    </div>
                </div>`;
        }).join('');

        this.container.innerHTML = `
            <div class="timeline-header">
                <div class="timeline-header-icon">
                    <span class="material-icons-round" aria-hidden="true">timeline</span>
                </div>
                <div>
                    <h3 class="timeline-main-title">Indian Election Process Timeline</h3>
                    <p class="timeline-subtitle">Click any milestone to learn about each phase of the election cycle.</p>
                </div>
            </div>
            <div class="timeline-track" role="list" aria-label="Election process milestones">
                ${phasesHtml}
            </div>`;
    }

    /**
     * Sets up a single delegated click listener on the timeline container.
     */
    _setupListeners() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const expandBtn = e.target.closest('.timeline-expand-btn');
            const milestoneEl = e.target.closest('.timeline-milestone');

            if (expandBtn) {
                e.stopPropagation();
                const milestoneId = expandBtn.getAttribute('data-milestone');
                this._toggleMilestone(milestoneId);
                return;
            }

            if (milestoneEl) {
                const milestoneId = milestoneEl.id;
                this._toggleMilestone(milestoneId);
            }
        });

        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const milestoneEl = e.target.closest('.timeline-milestone');
                if (milestoneEl) {
                    e.preventDefault();
                    this._toggleMilestone(milestoneEl.id);
                }
            }
        });
    }

    /**
     * Toggles the expanded state of a specific milestone.
     * @param {string} milestoneId - The ID of the milestone to toggle.
     */
    _toggleMilestone(milestoneId) {
        const el = document.getElementById(milestoneId);
        if (!el) return;

        const isExpanded = el.getAttribute('aria-expanded') === 'true';

        // Collapse all first
        this.container.querySelectorAll('.timeline-milestone').forEach(m => {
            m.setAttribute('aria-expanded', 'false');
            m.classList.remove('timeline-milestone--expanded');
            const btn = m.querySelector('.timeline-expand-btn .expand-text');
            if (btn) btn.textContent = 'Learn More';
            const icon = m.querySelector('.expand-icon');
            if (icon) icon.textContent = 'expand_more';
        });

        // If it was collapsed, expand it
        if (!isExpanded) {
            el.setAttribute('aria-expanded', 'true');
            el.classList.add('timeline-milestone--expanded');
            const btn = el.querySelector('.timeline-expand-btn .expand-text');
            if (btn) btn.textContent = 'Show Less';
            const icon = el.querySelector('.expand-icon');
            if (icon) icon.textContent = 'expand_less';
            this.expandedMilestone = milestoneId;

            if (this.firebaseService) {
                this.firebaseService.logUserEvent('timeline_milestone_view', { milestone: milestoneId });
            }
        } else {
            this.expandedMilestone = null;
        }
    }

    /**
     * Returns a color string based on the election phase.
     * @param {string} phase - The phase name.
     * @returns {string} CSS color value.
     */
    _getPhaseColor(phase) {
        const colors = {
            'Pre-Election': '#2563eb',
            'Campaign': '#d97706',
            'Voting': '#059669',
            'Post-Election': '#7c3aed'
        };
        return colors[phase] || '#64748b';
    }
}
