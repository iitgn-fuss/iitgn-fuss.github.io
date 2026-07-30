/**
 * Interactive Terminal for Dr. Gayatri's PhD Celebration Page
 * FUSS Group @ IIT Gandhinagar
 */

document.addEventListener('DOMContentLoaded', () => {
  initInteractiveTerminal();
});

function initInteractiveTerminal() {
  const termBody = document.getElementById('terminalBody');
  if (!termBody) return;

  // Track terminal state
  let whoamiExecuted = false;

  // Initial output rendering
  termBody.innerHTML = `
    <div class="term-line">
      <span class="term-prompt">$</span> <span style="color:#f8fafc; font-weight:600;">git commit -m "Finally Dr."</span>
    </div>
    <div class="term-output-text">[main 7f3a92b] Finally Dr. — Thesis defended with distinction.</div>
    
    <div id="termHistory"></div>

    <div class="term-prompt-line" id="activePromptLine">
      <span class="term-prompt">$</span>
      <input type="text" id="termInput" class="term-input" autocomplete="off" spellcheck="false" placeholder="type 'whoami'..." autofocus />
    </div>
  `;

  const termInput = document.getElementById('termInput');
  const termHistory = document.getElementById('termHistory');
  const activePromptLine = document.getElementById('activePromptLine');

  if (!termInput || !termHistory) return;

  // Focus terminal input when clicking anywhere inside terminal
  termBody.addEventListener('click', () => {
    termInput.focus();
  });

  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = termInput.value.trim();
      termInput.value = '';

      if (!command) return;

      // Append command to history
      const cmdHistoryLine = document.createElement('div');
      cmdHistoryLine.className = 'term-line';
      cmdHistoryLine.innerHTML = `<span class="term-prompt">$</span> <span style="color:#f8fafc;">${escapeHTML(command)}</span>`;
      termHistory.appendChild(cmdHistoryLine);

      // Handle whoami command
      if (command.toLowerCase() === 'whoami') {
        const respLine = document.createElement('div');
        respLine.className = 'term-output-text';
        respLine.style.color = '#f59e0b';
        respLine.style.fontSize = '1.15rem';
        respLine.style.fontWeight = '700';
        respLine.style.margin = '4px 0 10px 20px';
        respLine.innerHTML = 'dr-gayatri';
        termHistory.appendChild(respLine);

        if (!whoamiExecuted) {
          whoamiExecuted = true;
          const statusLine = document.createElement('div');
          statusLine.className = 'term-muted-text';
          statusLine.style.lineHeight = '1.6';
          statusLine.innerHTML = `
            <span style="background:rgba(16,185,129,0.2); color:#34d399; padding:2px 8px; border-radius:4px; font-weight:700;">PASS</span> <strong>Degree:</strong> Doctor of Philosophy (Ph.D.)<br>
            <span style="background:rgba(245,158,11,0.2); color:#fbbf24; padding:2px 8px; border-radius:4px; font-weight:700;">HONOR</span> <strong>Fellowships:</strong> Google PhD Fellow & PMRF Fellow<br>
            <span style="background:rgba(6,182,212,0.2); color:#38bdf8; padding:2px 8px; border-radius:4px; font-weight:700;">LAB</span> <strong>Group:</strong> FUSS Group, IIT Gandhinagar
          `;
          termHistory.appendChild(statusLine);
        }
      } else {
        // Output prompt to use whoami
        const errorLine = document.createElement('div');
        errorLine.className = 'term-muted-text';
        errorLine.style.color = '#ef4444';
        errorLine.innerHTML = `zsh: command not found: ${escapeHTML(command)}. Please type <strong>whoami</strong>`;
        termHistory.appendChild(errorLine);
      }

      // Scroll to bottom
      termBody.scrollTop = termBody.scrollHeight;
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
