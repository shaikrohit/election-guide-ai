// ui/stepperUI.js

class StepperUI {
    constructor(containerId, titleId, appState, flows) {
        this.container    = document.getElementById(containerId);
        this.titleElement = document.getElementById(titleId);
        this.appState     = appState;
        this.flows        = flows;

        this.renderedPersona = null;
        this.stepElements    = [];

        // Re-render when state changes
        this.appState.subscribe(() => this.render());

        // Single delegated listener — set up ONCE in constructor, never re-attached.
        this._setupDelegatedListeners();
    }

    // ─── Render Orchestration ─────────────────────────────────────────────────

    render() {
        const personaId = this.appState.activePersona;
        if (!personaId || !this.flows[personaId]) return;

        const flowData = this.flows[personaId];

        if (this.renderedPersona !== personaId) {
            this.fullRebuild(flowData, personaId);
            this.renderedPersona = personaId;
        } else {
            this.updateStateUI(flowData, personaId);
        }
    }

    fullRebuild(flowData, personaId) {
        if (this.titleElement) {
            this.titleElement.textContent = flowData.title;
        }

        // Remove any legacy wrapper
        const legacyWrapper = document.getElementById('progressStepperWrapper');
        if (legacyWrapper) legacyWrapper.remove();

        this.container.innerHTML = '';
        this.stepElements = [];

        this.renderProgressIndicator(flowData.steps.length, personaId);

        flowData.steps.forEach((step, index) => {
            const stepNum = index + 1;
            const stepEl  = this.createStepElement(step, stepNum, flowData.steps, personaId);
            this.stepElements.push(stepEl);
            this.container.appendChild(stepEl);
        });
    }

    updateStateUI(flowData, personaId) {
        // Update progress counter text only — no innerHTML replacement
        const progressCount = this.container.querySelector('.progress-count');
        if (progressCount) {
            const completedCount = Math.min(this.appState.currentStep - 1, flowData.steps.length);
            progressCount.textContent = `${completedCount} of ${flowData.steps.length} steps completed`;
        }

        flowData.steps.forEach((step, index) => {
            const stepNum = index + 1;
            const stepEl  = this.stepElements[index];
            if (!stepEl) return;

            const isCompleted = stepNum < this.appState.currentStep;
            const isActive    = stepNum === this.appState.currentStep;
            const accessible  = stepNum <= this.appState.currentStep;

            // ── Update step-item classes ──────────────────────────────────────
            stepEl.classList.remove('completed', 'active', 'pending', 'step-item--locked');
            if (['first-time', 'regular'].includes(personaId)) {
                if (isCompleted)      stepEl.classList.add('completed');
                else if (isActive)    stepEl.classList.add('active');
                else                  stepEl.classList.add('pending');
            }
            if (!accessible) stepEl.classList.add('step-item--locked');

            // ── Update ARIA attributes ────────────────────────────────────────
            stepEl.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            stepEl.setAttribute('aria-disabled',  accessible ? 'false' : 'true');
            stepEl.setAttribute('title',           accessible ? 'Go to this step' : 'Complete previous steps first');

            // ── Refresh action buttons without destroying the full structure ──
            const contentContainer = stepEl.querySelector('.step-content');
            if (contentContainer) {
                const newExtraHtml = this.getExtraContentHtml(step, stepNum, isCompleted, personaId);
                const oldActions   = contentContainer.querySelector('.step-actions');
                if (oldActions) {
                    oldActions.outerHTML = newExtraHtml;
                } else if (newExtraHtml) {
                    contentContainer.insertAdjacentHTML('beforeend', newExtraHtml);
                }
            }
        });
    }

    // ─── Progress Indicator ───────────────────────────────────────────────────

    renderProgressIndicator(totalSteps, personaId) {
        if (!['first-time', 'regular', 'candidate'].includes(personaId)) return;

        const completedCount = Math.min(this.appState.currentStep - 1, totalSteps);
        const html = `
            <div class="progress-text" aria-live="polite" aria-atomic="false">
                <strong>Progress: </strong><span class="progress-count">${completedCount} of ${totalSteps} steps completed</span>
            </div>`;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    // ─── Step Element Creation ────────────────────────────────────────────────

    createStepElement(step, stepNum, steps, personaId) {
        const stepEl = document.createElement('div');

        const isCompleted = stepNum < this.appState.currentStep;
        const isActive    = stepNum === this.appState.currentStep;
        const accessible  = stepNum <= this.appState.currentStep;

        // Determine state class
        let stateClass = '';
        const numMatch  = step.title.match(/^\d+/);
        let indicator   = numMatch ? numMatch[0] : '*';

        if (['first-time', 'regular'].includes(personaId)) {
            if (isCompleted) {
                stateClass = 'completed';
                indicator  = '<span class="material-icons-round step-indicator-icon">check</span>';
            } else if (isActive) {
                stateClass = 'active';
            } else {
                stateClass = 'pending';
            }
        }

        stepEl.className = `step-item ${stateClass}${!accessible ? ' step-item--locked' : ''}`.trim();

        if (['first-time', 'regular', 'candidate'].includes(personaId)) {
            stepEl.setAttribute('role',          'button');
            stepEl.setAttribute('tabindex',      '0');
            stepEl.setAttribute('aria-expanded', isActive    ? 'true'  : 'false');
            stepEl.setAttribute('aria-disabled', accessible  ? 'false' : 'true');
            stepEl.setAttribute('title',         accessible  ? 'Go to this step' : 'Complete previous steps first');
        }

        // Calendar badge (no inline styles on the link itself — handled by .calendar-badge CSS)
        let calendarHtml = '';
        if (step.date) {
            const calLink = CalendarService.generateGoogleCalendarLink(step.title, step.desc, step.date);
            calendarHtml = `
                <a href="${calLink}" target="_blank" rel="noopener noreferrer"
                   class="calendar-badge"
                   title="Add to Google Calendar"
                   aria-label="Add ${escapeHTML(step.dateLabel)} to Google Calendar">
                    <span class="material-icons-round" aria-hidden="true">event</span>
                    Add ${escapeHTML(step.dateLabel)}
                </a>`;
        }

        const extraContentHtml = this.getExtraContentHtml(step, stepNum, isCompleted, personaId);

        stepEl.innerHTML = `
            <div class="step-indicator" aria-hidden="true">${indicator}</div>
            <div class="step-content">
                <div class="step-header">
                    <div class="step-title">${escapeHTML(step.title)}</div>
                </div>
                <div class="step-desc">${escapeHTML(step.desc)}</div>
                ${calendarHtml}
                ${extraContentHtml}
            </div>`;

        return stepEl;
    }

    // ─── Extra Content Routing ────────────────────────────────────────────────

    /**
     * Returns the HTML for the action area of a step.
     * All button states are now driven by CSS classes — zero inline styles.
     */
    getExtraContentHtml(step, stepNum, isCompleted, personaId) {
        if (personaId === 'first-time')  return this._getFirstTimeHtml(step, stepNum, isCompleted);
        if (personaId === 'regular')     return this._getRegularHtml(step, stepNum, isCompleted);
        if (personaId === 'candidate')   return this._getCandidateHtml(step, stepNum, isCompleted);
        return '';
    }

    /**
     * Resolves CSS class and disabled attribute for a mark-complete button.
     * @returns {{ cls: string, disabled: string, title: string }}
     */
    _btnState(stepNum, isCompleted) {
        if (isCompleted) {
            return { cls: 'mark-complete-btn--done', disabled: 'disabled aria-disabled="true"', title: 'Step already completed' };
        }
        if (stepNum > this.appState.currentStep) {
            return { cls: 'mark-complete-btn--locked', disabled: 'disabled aria-disabled="true"', title: 'Complete previous steps first' };
        }
        return { cls: '', disabled: '', title: 'Mark this step as complete' };
    }

    // ─── First-Time Voter Templates ───────────────────────────────────────────

    _getFirstTimeHtml(step, stepNum, isCompleted) {
        const { cls, disabled, title } = this._btnState(stepNum, isCompleted);

        const templates = {
            'ft-1': `
                <div class="step-actions">
                    <p class="micro-prompt">Are you already registered?</p>
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">
                            ${isCompleted ? 'Completed ✔' : "Yes, I'm registered"}
                        </button>
                        <a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Check Eligibility / Register
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Government Website</p>
                </div>`,
            'ft-2': `
                <div class="step-actions">
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">
                            ${isCompleted ? 'Completed ✔' : 'Mark as Complete'}
                        </button>
                        <a href="https://electoralsearch.eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Search Your Name in Electoral Roll
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Government Website</p>
                </div>`,
            'ft-3': `
                <div class="step-actions">
                    <p class="micro-prompt">Do you have a valid ID?</p>
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">
                            ${isCompleted ? 'Completed ✔' : 'Yes, I have it'}
                        </button>
                        <a href="https://eci.gov.in/voter/voter-services/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            View Accepted ID Documents
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Government Website</p>
                </div>`,
            'ft-4': `
                <div class="step-actions">
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">
                            ${isCompleted ? 'Completed ✔' : 'Mark as Complete'}
                        </button>
                        <a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Find Official Polling Booth Info
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Government Website</p>
                </div>`
        };
        return templates[step.id] || '';
    }

    // ─── Regular Voter Templates ──────────────────────────────────────────────

    _getRegularHtml(step, stepNum, isCompleted) {
        const { cls, disabled, title } = this._btnState(stepNum, isCompleted);
        const btnText = isCompleted ? 'Completed ✔' : 'Mark as Complete';

        const templates = {
            'rv-1': `
                <div class="step-actions">
                    <p class="micro-prompt">Changed address recently?</p>
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">${btnText}</button>
                        <a href="https://electoralsearch.eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Verify Electoral Roll
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Source</p>
                </div>`,
            'rv-2': `
                <div class="step-actions">
                    <p class="micro-prompt">Know your polling station?</p>
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">${btnText}</button>
                        <a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Locate Polling Station
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Source</p>
                </div>`,
            'rv-3': `
                <div class="step-actions">
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">${btnText}</button>
                        <a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Election Commission Info
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                    <p class="helper-text">Official Source</p>
                </div>`
        };
        return templates[step.id] || '';
    }

    // ─── Candidate Templates ──────────────────────────────────────────────────

    _getCandidateHtml(step, stepNum, isCompleted) {
        const { cls, disabled, title } = this._btnState(stepNum, isCompleted);
        const btnText = isCompleted ? 'Completed ✔' : 'Mark as Complete';
        const state   = this.appState.stepState;

        if (step.id === 'c-1') {
            const allDocsChecked = state['doc1'] && state['doc2'] && state['doc3'];
            let docBtnCls = cls, docBtnDisabled = disabled, docBtnTitle = title;
            if (!isCompleted && !allDocsChecked) {
                docBtnCls      = 'mark-complete-btn--locked';
                docBtnDisabled = 'disabled aria-disabled="true"';
                docBtnTitle    = 'Check all documents first';
            }

            return `
                <div class="step-actions">
                    <p class="micro-prompt">Have you prepared your documents?</p>
                    <ul class="candidate-checklist" role="group" aria-label="Document Checklist">
                        <li class="checklist-item ${state['doc1'] ? 'checked' : ''}"
                            data-id="doc1" role="checkbox" aria-checked="${state['doc1'] ? 'true' : 'false'}" tabindex="0">
                            <span class="material-icons-round checkbox-icon" aria-hidden="true">
                                ${state['doc1'] ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            Nomination form
                        </li>
                        <li class="checklist-item ${state['doc2'] ? 'checked' : ''}"
                            data-id="doc2" role="checkbox" aria-checked="${state['doc2'] ? 'true' : 'false'}" tabindex="0">
                            <span class="material-icons-round checkbox-icon" aria-hidden="true">
                                ${state['doc2'] ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            Affidavit
                        </li>
                        <li class="checklist-item ${state['doc3'] ? 'checked' : ''}"
                            data-id="doc3" role="checkbox" aria-checked="${state['doc3'] ? 'true' : 'false'}" tabindex="0">
                            <span class="material-icons-round checkbox-icon" aria-hidden="true">
                                ${state['doc3'] ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            Identity Proof
                        </li>
                    </ul>
                    ${!isCompleted ? `
                    <div class="info-box" role="status">
                        <span class="material-icons-round" aria-hidden="true">info</span>
                        Check all required documents to unlock the next step.
                    </div>` : ''}
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${docBtnCls}"
                                data-step="${stepNum}" ${docBtnDisabled} title="${docBtnTitle}">${btnText}</button>
                        <a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Download Forms
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                </div>`;
        }

        if (step.id === 'c-2') {
            const isApproved = state['c2_approved'];
            let approvalBtnCls = cls, approvalBtnDisabled = disabled, approvalBtnTitle = title;
            if (!isCompleted && !isApproved) {
                approvalBtnCls      = 'mark-complete-btn--locked';
                approvalBtnDisabled = 'disabled aria-disabled="true"';
                approvalBtnTitle    = 'Wait for approval status';
            }
            return `
                <div class="step-actions">
                    <p class="micro-prompt">Current Scrutiny Status:</p>
                    <div class="status-row">
                        <span class="status-badge ${isApproved ? 'approved' : 'review'}" aria-live="polite">
                            ${isApproved ? 'Approved' : 'Under Review'}
                        </span>
                        <button class="text-button simulate-status-btn ${isApproved ? 'simulate-status-btn--done' : ''}"
                                title="${isApproved ? 'Approval confirmed' : 'Simulate checking for status update'}"
                                aria-label="${isApproved ? 'Approval confirmed' : 'Check for scrutiny status update'}">
                            <span class="material-icons-round" aria-hidden="true">${isApproved ? 'check_circle' : 'refresh'}</span>
                            ${isApproved ? 'Status Updated' : 'Check Update'}
                        </button>
                    </div>
                    ${!isCompleted ? `
                    <div class="info-box" role="status">
                        <span class="material-icons-round" aria-hidden="true">info</span>
                        Application must be approved to proceed.
                    </div>` : ''}
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${approvalBtnCls}"
                                data-step="${stepNum}" ${approvalBtnDisabled} title="${approvalBtnTitle}">${btnText}</button>
                        <a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Official Notification Portal
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                </div>`;
        }

        if (step.id === 'c-3') {
            const mccExpanded = state['mcc_expanded'];
            return `
                <div class="step-actions">
                    <div class="highlight-block" id="mccHighlight" role="button" tabindex="0"
                         aria-expanded="${mccExpanded ? 'true' : 'false'}">
                        <div class="highlight-block-header">
                            <strong>Model Code of Conduct Active</strong>
                            <span class="material-icons-round toggle-icon" aria-hidden="true">
                                ${mccExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                        </div>
                        <p class="mcc-details ${mccExpanded ? '' : 'hidden'}">
                            No new government schemes can be announced. Campaigning must be ethical and transparent.
                        </p>
                    </div>
                    <div class="info-box" role="status">
                        <span class="material-icons-round" aria-hidden="true">warning</span>
                        Campaigning must stop strictly 48 hours before polling begins.
                    </div>
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">${btnText}</button>
                        <a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Read MCC Guidelines
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                </div>`;
        }

        if (step.id === 'c-4') {
            return `
                <div class="step-actions">
                    <p class="micro-prompt">Final Day Action Plan:</p>
                    <div class="polling-counting-split">
                        <div class="split-card">
                            <div class="split-card-header">
                                <span class="material-icons-round text-primary" aria-hidden="true">how_to_vote</span>
                                <h4>Polling</h4>
                            </div>
                            <p>Deploy polling agents to assigned booths. Ensure fair voting processes.</p>
                        </div>
                        <div class="split-card">
                            <div class="split-card-header">
                                <span class="material-icons-round text-secondary" aria-hidden="true">analytics</span>
                                <h4>Counting</h4>
                            </div>
                            <p>Attend counting centers. Monitor EVM unsealing and verify totals.</p>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="secondary-button btn-small mark-complete-btn ${cls}"
                                data-step="${stepNum}" ${disabled} title="${title}">
                            ${isCompleted ? 'Election Concluded ✔' : 'Complete Election Cycle'}
                        </button>
                        <a href="https://results.eci.gov.in/" target="_blank" rel="noopener noreferrer"
                           class="primary-button btn-small" title="Open official website in new tab">
                            Live Results Portal
                            <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                        </a>
                    </div>
                </div>`;
        }

        return '';
    }

    // ─── Event Delegation ─────────────────────────────────────────────────────

    /**
     * Sets up a SINGLE delegated listener on the container.
     * Called once in the constructor — never re-attached on re-renders.
     */
    _setupDelegatedListeners() {
        this.container.addEventListener('click',   (e) => this._handleDelegatedClick(e));
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._handleDelegatedClick(e);
            }
        });
    }

    _handleDelegatedClick(e) {
        const target = e.target;

        // ── Mark-Complete Button ──────────────────────────────────────────────
        const completeBtn = target.closest('.mark-complete-btn');
        if (completeBtn) {
            e.stopPropagation();
            if (completeBtn.disabled || completeBtn.getAttribute('aria-disabled') === 'true') return;
            const stepNum = parseInt(completeBtn.getAttribute('data-step'), 10);
            if (stepNum === this.appState.currentStep) {
                this.appState.setStep(stepNum + 1);
            }
            return;
        }

        // ── Candidate: Checklist Item ─────────────────────────────────────────
        const checklistItem = target.closest('.checklist-item');
        if (checklistItem) {
            e.stopPropagation();
            const docId = checklistItem.getAttribute('data-id');
            if (docId) this.appState.toggleStepState(docId);
            return;
        }

        // ── Candidate: Simulate Status Button ────────────────────────────────
        const simBtn = target.closest('.simulate-status-btn');
        if (simBtn) {
            e.stopPropagation();
            this.appState.setStepState('c2_approved', true);
            return;
        }

        // ── Candidate: MCC Accordion Toggle ──────────────────────────────────
        const mccHighlight = target.closest('#mccHighlight');
        if (mccHighlight) {
            e.stopPropagation();
            this.appState.toggleStepState('mcc_expanded');
            return;
        }

        // ── Calendar / External links — let them propagate ────────────────────
        if (target.closest('.calendar-badge') || target.closest('.primary-button')) return;

        // ── Step-Item Header Click ────────────────────────────────────────────
        const stepItem = target.closest('.step-item');
        if (stepItem) {
            const stepIndex = this.stepElements.indexOf(stepItem);
            if (stepIndex === -1) return;
            const stepNum = stepIndex + 1;
            if (stepNum <= this.appState.currentStep) {
                this.appState.setStep(stepNum);
            }
        }
    }
}
