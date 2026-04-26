// utils/formatting.js

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

/**
 * Safely renders markdown into a DOM element.
 * @param {string} text - The markdown text.
 * @param {HTMLElement} container - The element to render into.
 */
function renderMarkdown(text, container) {
    container.textContent = ''; 
    if (!text) return;
    
    const lines = text.split('\n');
    let ul = null;

    function renderInlineMarkdown(line, el) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const strong = document.createElement('strong');
                strong.textContent = part.slice(2, -2);
                el.appendChild(strong);
            } else {
                el.appendChild(document.createTextNode(part));
            }
        });
    }

    lines.forEach(line => {
        if (line.match(/^[\*\-]\s+(.*)$/) || line.match(/^\d+\.\s+(.*)$/)) {
            if (!ul) {
                ul = document.createElement('ul');
                ul.className = 'md-list';
                container.appendChild(ul);
            }
            const li = document.createElement('li');
            renderInlineMarkdown(line.replace(/^[\*\-]\s+/, '').replace(/^\d+\.\s+/, ''), li);
            ul.appendChild(li);
        } else {
            ul = null;
            if (line.trim() !== '') {
                const p = document.createElement('p');
                p.className = 'md-paragraph';
                renderInlineMarkdown(line, p);
                container.appendChild(p);
            }
        }
    });
}

function renderElectionInfo(elections, container) {
    if (!elections || elections.length === 0) {
        container.innerHTML = `<div class="card error-msg" data-translate>No upcoming elections found for this address.</div>`;
        return;
    }

    container.innerHTML = elections.map(e => `
        <div class="card result-card">
            <div class="card-header">
                <h4 data-translate>${e.name}</h4>
                <button class="tts-btn" onclick="new TTSService().speak('${e.name}. Scheduled for ${e.electionDay}')" aria-label="Read Aloud">
                    <span class="material-icons-round">volume_up</span>
                </button>
            </div>
            <p><strong data-translate>Date:</strong> ${e.electionDay}</p>
        </div>
    `).join('');
}

function renderPollingInfo(pollingStations, container) {
    if (!pollingStations || pollingStations.length === 0) {
        container.innerHTML = `<div class="card warning-msg" data-translate>No specific polling locations returned for this address.</div>`;
        return;
    }

    container.innerHTML = pollingStations.map(ps => `
        <div class="card result-card">
            <div class="card-header">
                <h4 data-translate>${ps.address.locationName || 'Polling Station'}</h4>
                <button class="tts-btn" onclick="new TTSService().speak('${ps.address.locationName || 'Polling Station'} at ${ps.address.line1}')" aria-label="Read Aloud">
                    <span class="material-icons-round">volume_up</span>
                </button>
            </div>
            <p>${ps.address.line1}, ${ps.address.city}</p>
        </div>
    `).join('');
}

function renderAnalysisResult(analysis, container) {
    if (!analysis || !analysis.entities) return;
    const entities = analysis.entities.slice(0, 3).map(e => `<span class="tag">${e.name}</span>`).join('');
    const div = document.createElement('div');
    div.className = 'analysis-box';
    div.innerHTML = `<span class="analysis-label">Topic Analysis:</span> ${entities}`;
    container.appendChild(div);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHTML, renderMarkdown, renderElectionInfo, renderPollingInfo, renderAnalysisResult };
}
