/**
 * Dr. Gayatri PhD Defense — Interactive Script
 * Terminal typewriter, confetti, toast notifications, scroll reveal
 */

document.addEventListener('DOMContentLoaded', () => {
  initURLBarProgress();
  initRefreshButton();
  initStarBookmark();
  initCookieToast();
  initLockToast();
  initTerminalTypewriter();
  initScrollReveal();
});

/* ===== URL BAR LOADING PROGRESS ===== */
function initURLBarProgress() {
  const bar = document.getElementById('urlProgress');
  if (bar) {
    setTimeout(() => bar.classList.add('loading'), 200);
  }
}

/* ===== REFRESH BUTTON ===== */
function initRefreshButton() {
  const btn = document.getElementById('refreshBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.classList.add('spin-once');
    setTimeout(() => location.reload(), 500);
  });
}

/* ===== STAR BOOKMARK TOGGLE ===== */
function initStarBookmark() {
  const star = document.getElementById('starBtn');
  if (!star) return;
  star.addEventListener('click', () => {
    const isFilled = star.classList.toggle('bookmarked');
    star.classList.toggle('fa-regular', !isFilled);
    star.classList.toggle('fa-solid', isFilled);
    showToast(isFilled ? '⭐ Bookmarked!' : 'Bookmark removed');
  });
}

/* ===== COOKIE ICON TOAST ===== */
function initCookieToast() {
  const cookie = document.getElementById('cookieBtn');
  if (!cookie) return;
  cookie.addEventListener('click', () => {
    showToast('🍪 Gayatri studies these! No tracking here.');
  });
}

/* ===== LOCK ICON TOAST ===== */
function initLockToast() {
  const lock = document.getElementById('lockBtn');
  if (!lock) return;
  lock.addEventListener('click', () => {
    showToast('🔒 Connection to Dr. Gayatri is secure ✓');
  });
}

/* ===== TOAST NOTIFICATION ===== */
let toastTimer = null;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove('show');
  // Force reflow
  void toast.offsetWidth;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ===== TERMINAL TYPEWRITER + INTERACTIVE WHOAMI ===== */
function initTerminalTypewriter() {
  const termBody = document.getElementById('terminalBody');
  if (!termBody) return;

  termBody.innerHTML = '';

  const gitLine = '$ git commit -m "Finally Dr."';
  const gitOutput = '[main 7f3a92b] Finally Dr. — Thesis defended with distinction.';

  // Phase 1: Typewriter the git commit line
  const line1 = document.createElement('div');
  line1.className = 'term-line';
  const promptSpan = document.createElement('span');
  promptSpan.className = 'term-prompt';
  promptSpan.textContent = '$';
  const textSpan = document.createElement('span');
  textSpan.style.cssText = 'color:#f1f5f9; font-weight:600; margin-left:8px;';
  const cursorSpan = document.createElement('span');
  cursorSpan.className = 'cursor-blink';
  line1.appendChild(promptSpan);
  line1.appendChild(textSpan);
  line1.appendChild(cursorSpan);
  termBody.appendChild(line1);

  const commandText = 'git commit -m "Finally Dr."';
  let charIndex = 0;

  function typeChar() {
    if (charIndex < commandText.length) {
      textSpan.textContent += commandText[charIndex];
      charIndex++;
      setTimeout(typeChar, 35 + Math.random() * 45);
    } else {
      // Done typing — remove cursor, show output
      cursorSpan.remove();
      setTimeout(showGitOutput, 400);
    }
  }

  function showGitOutput() {
    const outLine = document.createElement('div');
    outLine.className = 'term-output-text';
    outLine.textContent = gitOutput;
    outLine.style.opacity = '0';
    termBody.appendChild(outLine);
    requestAnimationFrame(() => {
      outLine.style.transition = 'opacity 0.4s';
      outLine.style.opacity = '1';
    });

    // Phase 2: Show interactive prompt
    setTimeout(showPrompt, 600);
  }

  function showPrompt() {
    const historyDiv = document.createElement('div');
    historyDiv.id = 'termHistory';
    termBody.appendChild(historyDiv);

    const promptLine = document.createElement('div');
    promptLine.className = 'term-prompt-line';
    promptLine.innerHTML = `
      <span class="term-prompt">$</span>
      <input type="text" id="termInput" class="term-input" autocomplete="off" spellcheck="false" placeholder="type 'whoami'..." />
    `;
    termBody.appendChild(promptLine);

    const input = document.getElementById('termInput');
    let whoamiDone = false;

    termBody.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const cmd = input.value.trim();
      input.value = '';
      if (!cmd) return;

      const history = document.getElementById('termHistory');

      // Echo command
      const cmdLine = document.createElement('div');
      cmdLine.className = 'term-line';
      cmdLine.innerHTML = `<span class="term-prompt">$</span> <span style="color:#f1f5f9;">${escapeHTML(cmd)}</span>`;
      history.appendChild(cmdLine);

      if (cmd.toLowerCase() === 'whoami') {
        // Animated reveal
        const resp = document.createElement('div');
        resp.className = 'term-output-text';
        resp.style.cssText = 'color:#f59e0b; font-size:1.1rem; font-weight:700; margin:4px 0 8px 18px; opacity:0; transition:opacity 0.4s;';
        resp.textContent = 'dr-gayatri';
        history.appendChild(resp);
        requestAnimationFrame(() => resp.style.opacity = '1');

        if (!whoamiDone) {
          whoamiDone = true;
          // Show status details
          setTimeout(() => {
            const status = document.createElement('div');
            status.className = 'term-muted-text';
            status.style.opacity = '0';
            status.style.transition = 'opacity 0.4s';
            status.innerHTML = `
              <span style="background:rgba(16,185,129,0.2);color:#34d399;padding:2px 8px;border-radius:4px;font-weight:700;">PASS</span> <strong>Degree:</strong> Doctor of Philosophy<br>
              <span style="background:rgba(245,158,11,0.2);color:#fbbf24;padding:2px 8px;border-radius:4px;font-weight:700;">HONOR</span> <strong>Fellowships:</strong> Google PhD Fellow & PMRF<br>
              <span style="background:rgba(6,182,212,0.2);color:#38bdf8;padding:2px 8px;border-radius:4px;font-weight:700;">LAB</span> <strong>Group:</strong> FUSS @ IIT Gandhinagar
            `;
            history.appendChild(status);
            requestAnimationFrame(() => status.style.opacity = '1');
          }, 300);

          // Fire confetti!
          setTimeout(fireConfetti, 500);
        }
      } else {
        const err = document.createElement('div');
        err.className = 'term-muted-text';
        err.style.color = '#f87171';
        err.innerHTML = `zsh: command not found: ${escapeHTML(cmd)}. Try <strong style="color:#34d399;">whoami</strong>`;
        history.appendChild(err);
      }

      termBody.scrollTop = termBody.scrollHeight;
    });
  }

  setTimeout(typeChar, 800);
}

/* ===== CONFETTI ENGINE ===== */
function fireConfetti() {
  let canvas = document.getElementById('confettiCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confettiCanvas';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#059669', '#d97706', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
  const particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -18 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.35 + Math.random() * 0.15,
      opacity: 1,
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;

      if (frame > 60) p.opacity -= 0.012;
      if (p.opacity <= 0) return;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;
    if (alive && frame < 200) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}

/* ===== UTIL ===== */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c)
  );
}
