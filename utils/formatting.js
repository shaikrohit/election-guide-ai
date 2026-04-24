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
