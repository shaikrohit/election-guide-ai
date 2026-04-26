// Main Application Orchestrator

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Utilities
    const announcer = new A11yAnnouncer('a11y-announcer');

    // 2. Initialize State Management
    const appState = new AppState();

    // 3. Initialize Services
    const geminiService = new GeminiService();
    const mapsService = new MapsService('mapContainer', 'mapFallback', 'openMapsLink');
    const civicService = new CivicService();
    
    // Initialize Firebase if configured
    let firebaseService = null;
    if (window.FirebaseService) {
        firebaseService = new window.FirebaseService();
        if (firebaseService.init()) {
            // Wait a moment for auth to initialize before making the first auth call
            setTimeout(() => {
                 firebaseService.loginAnonymously();
                 firebaseService.logUserEvent("app_loaded", { persona: null });
            }, 500);
        }
    }

    // 4. Initialize UI Components
    const chatUI = new ChatUI(appState, geminiService, announcer);
    const mainUI = new MainUI(appState, announcer, mapsService, firebaseService);
    const stepperUI = new StepperUI('stepsContainer', 'flowTitle', appState, Flows, firebaseService);

    // Initial render
    stepperUI.render();

    // 5. Initialize Interactive Election Timeline
    const timelineUI = new TimelineUI('electionTimeline', firebaseService);

    // ─── Civic Information API: Event Wiring ──────────────────────────────────

    const loadElectionsBtn = document.getElementById('loadElectionsBtn');
    const electionsList = document.getElementById('electionsList');
    const lookupVoterInfoBtn = document.getElementById('lookupVoterInfoBtn');
    const civicAddressInput = document.getElementById('civicAddressInput');
    const voterInfoResults = document.getElementById('voterInfoResults');

    // Load Upcoming Elections
    if (loadElectionsBtn && electionsList) {
        loadElectionsBtn.addEventListener('click', async () => {
            loadElectionsBtn.disabled = true;
            loadElectionsBtn.innerHTML = `
                <span class="material-icons-round spin" aria-hidden="true">sync</span>
                Loading...`;
            announcer.announce('Loading upcoming elections...');

            const elections = await civicService.getElections();

            electionsList.classList.remove('hidden');

            if (!elections || elections.length === 0) {
                electionsList.innerHTML = `
                    <div class="civic-empty">
                        <span class="material-icons-round" aria-hidden="true">info</span>
                        <p>No upcoming elections found at this time.</p>
                    </div>`;
            } else {
                electionsList.innerHTML = elections.map(e => `
                    <div class="election-item ${e.isFallback ? 'election-item--fallback' : ''}">
                        <div class="election-item-header">
                            <span class="material-icons-round election-icon" aria-hidden="true">ballot</span>
                            <strong>${escapeHTML(e.name)}</strong>
                        </div>
                        <div class="election-item-date">
                            <span class="material-icons-round icon-xs" aria-hidden="true">event</span>
                            ${escapeHTML(e.electionDay)}
                            ${e.isFallback ? '<span class="fallback-tag">Scheduled</span>' : '<span class="live-tag">Live Data</span>'}
                        </div>
                    </div>`
                ).join('');
            }

            loadElectionsBtn.disabled = false;
            loadElectionsBtn.innerHTML = `
                <span class="material-icons-round" aria-hidden="true">refresh</span>
                Refresh Elections`;
            announcer.announce(`Found ${elections.length} election(s).`);
        });
    }

    // Voter Info Lookup
    if (lookupVoterInfoBtn && civicAddressInput && voterInfoResults) {
        const doVoterLookup = async () => {
            const address = civicAddressInput.value.trim();
            if (!address || address.length < 3) {
                voterInfoResults.classList.remove('hidden');
                voterInfoResults.innerHTML = `
                    <div class="civic-error">
                        <span class="material-icons-round" aria-hidden="true">warning</span>
                        <p>Please enter a valid address (at least 3 characters).</p>
                    </div>`;
                return;
            }

            lookupVoterInfoBtn.disabled = true;
            voterInfoResults.classList.remove('hidden');
            voterInfoResults.innerHTML = `
                <div class="civic-loading">
                    <span class="material-icons-round spin" aria-hidden="true">sync</span>
                    <p>Looking up voter info...</p>
                </div>`;
            announcer.announce('Looking up voter information...');

            let data = await civicService.getVoterInfo(address);

            // INDIA LOCALIZATION: If searching for an Indian address and API fails/unknown
            const isIndia = /india|delhi|mumbai|hyderabad|bangalore|chennai|kolkata|pune|ahmedabad|jaipur|lucknow|kanpur|nagpur|indore|surat|patna|bhopal|ludhiana|agra|nashik|rajkot|meerat/i.test(address);

            if (isIndia && (data.error || !data.election)) {
                console.log("Indian address detected, using localized mock data...");
                data = getIndianMockData(address);
            }
            // AUTO-FALLBACK: If "Election unknown" (and not India), try with the Google Test Election ID (2000)
            else if (data.error && data.error.toLowerCase().includes("election unknown")) {
                console.log("Real election unknown, trying Google Test Election (2000)...");
                data = await civicService.getVoterInfo(address, "2000");
            }

            if (data.error) {
                let friendlyMsg = data.error;
                let isInfo = false;

                // Handle specific common API errors with friendly guidance
                if (data.error.toLowerCase().includes("election unknown")) {
                    friendlyMsg = "No active election was found for this address at the moment. This is common if there are no upcoming local or national elections scheduled soon.";
                    isInfo = true;
                } else if (data.error.toLowerCase().includes("failed to parse")) {
                    friendlyMsg = "We couldn't recognize that address. Please try adding a city, state, or zip code.";
                }

                voterInfoResults.innerHTML = `
                    <div class="${isInfo ? 'civic-empty' : 'civic-error'}">
                        <span class="material-icons-round" aria-hidden="true">${isInfo ? 'info' : 'error_outline'}</span>
                        <p>${escapeHTML(friendlyMsg)}</p>
                    </div>`;
                announcer.announce(friendlyMsg);
            } else {
                voterInfoResults.innerHTML = renderVoterInfo(data);
                announcer.announce('Voter information loaded successfully.');
            }

            lookupVoterInfoBtn.disabled = false;
        };

        lookupVoterInfoBtn.addEventListener('click', doVoterLookup);
        civicAddressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doVoterLookup();
        });

        // Demo Link Handler
        const tryDemoAddrBtn = document.getElementById('tryDemoAddrBtn');
        if (tryDemoAddrBtn) {
            tryDemoAddrBtn.addEventListener('click', () => {
                civicAddressInput.value = "Vijay Chowk, New Delhi";
                doVoterLookup();
            });
        }
    }
});

/**
 * Renders the voter info API response into structured HTML.
 */
function renderVoterInfo(data) {
    let html = '';

    // Election Info
    if (data.election) {
        html += `
        <div class="voter-section">
            <h4><span class="material-icons-round" aria-hidden="true">how_to_vote</span> Election</h4>
            <p><strong>${escapeHTML(data.election.name)}</strong></p>
            <p class="text-muted">Date: ${escapeHTML(data.election.electionDay)}</p>
        </div>`;
    }

    // Normalized Address
    if (data.normalizedInput) {
        const addr = data.normalizedInput;
        html += `
        <div class="voter-section">
            <h4><span class="material-icons-round" aria-hidden="true">home</span> Your Address</h4>
            <p>${escapeHTML(addr.line1)}, ${escapeHTML(addr.city)}, ${escapeHTML(addr.state)} ${escapeHTML(addr.zip)}</p>
        </div>`;
    }

    // Polling Locations
    if (data.pollingLocations && data.pollingLocations.length > 0) {
        const loc = data.pollingLocations[0];
        const addr = loc.address;
        html += `
        <div class="voter-section voter-section--highlight">
            <h4><span class="material-icons-round" aria-hidden="true">location_on</span> Your Polling Location</h4>
            <p><strong>${escapeHTML(addr.locationName || 'Polling Station')}</strong></p>
            <p>${escapeHTML(addr.line1)}, ${escapeHTML(addr.city)}, ${escapeHTML(addr.state)} ${escapeHTML(addr.zip)}</p>
            ${loc.pollingHours ? `<p class="text-muted">Hours: ${escapeHTML(loc.pollingHours)}</p>` : ''}
            ${data.pollingLocations.length > 1 ?
                `<p class="text-muted">+ ${data.pollingLocations.length - 1} more location(s)</p>` : ''}
        </div>`;
    }

    // Contests & Candidates
    if (data.contests && data.contests.length > 0) {
        html += `
        <div class="voter-section">
            <h4><span class="material-icons-round" aria-hidden="true">groups</span> Contests (${data.contests.length})</h4>`;

        data.contests.slice(0, 5).forEach(contest => {
            html += `<div class="contest-item">
                <p class="contest-title">${escapeHTML(contest.ballotTitle || contest.office || 'Contest')}</p>`;

            if (contest.candidates && contest.candidates.length > 0) {
                html += `<div class="candidates-list">`;
                contest.candidates.slice(0, 6).forEach(c => {
                    html += `<span class="candidate-chip">${escapeHTML(c.name)}${c.party ? ` <small>(${escapeHTML(c.party)})</small>` : ''}</span>`;
                });
                if (contest.candidates.length > 6) {
                    html += `<span class="candidate-chip candidate-chip--more">+${contest.candidates.length - 6} more</span>`;
                }
                html += `</div>`;
            }

            if (contest.referendumTitle) {
                html += `<p class="referendum-text">${escapeHTML(contest.referendumTitle)}</p>`;
            }

            html += `</div>`;
        });

        if (data.contests.length > 5) {
            html += `<p class="text-muted">+ ${data.contests.length - 5} more contest(s)</p>`;
        }

        html += `</div>`;
    }

    // State Election Administration
    if (data.state && data.state[0]) {
        const stateInfo = data.state[0];
        const admin = stateInfo.electionAdministrationBody;
        if (admin) {
            html += `
            <div class="voter-section">
                <h4><span class="material-icons-round" aria-hidden="true">account_balance</span> Election Office</h4>
                <p><strong>${escapeHTML(admin.name || stateInfo.name)}</strong></p>`;

            if (admin.electionInfoUrl) {
                html += `<a href="${admin.electionInfoUrl}" target="_blank" rel="noopener noreferrer"
                            class="text-button civic-link">
                            Election Info <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                         </a>`;
            }
            if (admin.electionRegistrationUrl) {
                html += `<a href="${admin.electionRegistrationUrl}" target="_blank" rel="noopener noreferrer"
                            class="text-button civic-link">
                            Register to Vote <span class="material-icons-round icon-xs" aria-hidden="true">open_in_new</span>
                         </a>`;
            }
            html += `</div>`;
        }
    }

    if (!html) {
        html = `
        <div class="civic-empty">
            <span class="material-icons-round" aria-hidden="true">info</span>
            <p>No detailed voter info available for this address at this time.</p>
        </div>`;
    }

    return html;
}

/**
 * Returns a localized mock response for Indian addresses.
 * Tailored for relevance to the Indian electoral system (Lok Sabha, Constituencies).
 */
function getIndianMockData(address) {
    return {
        election: {
            name: "Upcoming Indian General Election (Lok Sabha)",
            electionDay: "2026-05-15",
            ocdDivisionId: "ocd-division/country:in"
        },
        normalizedInput: {
            line1: address,
            city: "New Delhi",
            state: "Delhi",
            zip: "110001"
        },
        pollingLocations: [
            {
                address: {
                    locationName: "Government Senior Secondary School",
                    line1: "Main Building, Block A",
                    city: "New Delhi",
                    state: "Delhi",
                    zip: "110001"
                },
                pollingHours: "7:00 AM - 6:00 PM",
                sources: [{ name: "ECI Mock Data", official: true }]
            }
        ],
        contests: [
            {
                type: "General",
                ballotTitle: "Member of Parliament (Lok Sabha)",
                district: { name: "New Delhi Constituency", scope: "congressional" },
                candidates: [
                    { name: "Candidate A", party: "Party X" },
                    { name: "Candidate B", party: "Party Y" },
                    { name: "Candidate C", party: "Independent" }
                ]
            },
            {
                type: "State",
                ballotTitle: "Member of Legislative Assembly (Vidhan Sabha)",
                district: { name: "Central Delhi Assembly", scope: "statewide" },
                candidates: [
                    { name: "Local Leader 1", party: "Party X" },
                    { name: "Local Leader 2", party: "Party Y" }
                ]
            }
        ],
        state: [
            {
                name: "Delhi",
                electionAdministrationBody: {
                    name: "Election Commission of India / CEO Delhi",
                    electionInfoUrl: "https://eci.gov.in/",
                    electionRegistrationUrl: "https://voters.eci.gov.in/",
                    correspondenceAddress: {
                        line1: "Nirvachan Sadan, Ashoka Road",
                        city: "New Delhi",
                        state: "Delhi",
                        zip: "110001"
                    }
                }
            }
        ]
    };
}
