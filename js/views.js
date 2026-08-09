// ===== Views — each tab is a function that returns DOM =====
// Every view takes (params) and returns a root element to render into #view.

const Views = {};

/* ============================================================
   CHAT — persistent conversation history
   ============================================================ */
Views.chat = function () {
  const root = document.createElement('div');
  root.className = 'view view-chat';

  const head = document.createElement('div');
  head.className = 'view-head';
  head.innerHTML = `
    <div>
      <h2 class="view-title">Conversations</h2>
      <p class="view-sub">Your saved threads with Orbit.</p>
    </div>
    <button class="ghost-btn" id="clear-chat" type="button">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
      <span>Clear all</span>
    </button>
  `;
  root.appendChild(head);

  const list = document.createElement('div');
  list.className = 'thread-list';
  list.id = 'thread-list';
  root.appendChild(list);

  function render() {
    const chat = Store.get().chat;
    list.innerHTML = '';

    if (!chat.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.2 7.3L4 21l1.7-5.6A8 8 0 1 1 21 12z"></path></svg>
          </div>
          <p class="empty-title">No conversations yet</p>
          <p class="empty-sub">Start a chat from the Home tab — your messages will be saved here automatically.</p>
        </div>`;
      return;
    }

    // Group messages by day
    const groups = {};
    chat.forEach((m) => {
      const day = new Date(m.ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      (groups[day] = groups[day] || []).push(m);
    });

    Object.entries(groups).forEach(([day, msgs]) => {
      const section = document.createElement('div');
      section.className = 'thread-section';
      section.innerHTML = `<div class="thread-day">${day}</div>`;
      msgs.forEach((m) => {
        const row = document.createElement('div');
        row.className = `thread-row ${m.role}`;
        const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        row.innerHTML = `
          <div class="thread-meta">
            <span class="thread-who">${m.role === 'user' ? 'You' : 'Orbit'}</span>
            <span class="thread-time">${time}</span>
          </div>
          <div class="thread-text"></div>`;
        row.querySelector('.thread-text').textContent = m.text;
        section.appendChild(row);
      });
      list.appendChild(section);
    });
  }

  root.querySelector('#clear-chat').addEventListener('click', () => {
    if (confirm('Delete all saved conversations? This cannot be undone.')) {
      Store.clearChat();
      render();
    }
  });

  render();
  return root;
};

/* ============================================================
   MEMORY — permanent memories Orbit remembers
   ============================================================ */
Views.memory = function () {
  const root = document.createElement('div');
  root.className = 'view view-memory';

  const head = document.createElement('div');
  head.className = 'view-head';
  head.innerHTML = `
    <div>
      <h2 class="view-title">Memory</h2>
      <p class="view-sub">Permanent notes you have asked Orbit to remember.</p>
    </div>`;
  root.appendChild(head);

  const composer = document.createElement('form');
  composer.className = 'memory-composer';
  composer.innerHTML = `
    <input type="text" id="memory-input" placeholder="Tell Orbit to remember… (e.g. 'I prefer dark roast coffee')" autocomplete="off">
    <button type="submit" class="send-btn" aria-label="Save">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
    </button>`;
  root.appendChild(composer);

  const list = document.createElement('div');
  list.className = 'memory-list';
  list.id = 'memory-list';
  root.appendChild(list);

  function render() {
    const mems = Store.get().memories;
    list.innerHTML = '';
    if (!mems.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3V7a4 4 0 0 0-4-4z"></path></svg>
          </div>
          <p class="empty-title">Nothing remembered yet</p>
          <p class="empty-sub">Type something above and Orbit will keep it forever.</p>
        </div>`;
      return;
    }

    mems.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      const when = new Date(m.ts).toLocaleString();
      card.innerHTML = `
        <div class="memory-text"></div>
        <div class="memory-foot">
          <span class="memory-time">${when}</span>
          <button class="icon-btn small" data-id="${m.id}" aria-label="Delete">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
          </button>
        </div>`;
      card.querySelector('.memory-text').textContent = m.text;
      card.querySelector('button').addEventListener('click', () => {
        Store.deleteMemory(m.id);
        render();
      });
      list.appendChild(card);
    });
  }

  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = composer.querySelector('#memory-input');
    const text = input.value.trim();
    if (!text) return;
    Store.addMemory(text);
    input.value = '';
    render();
  });

  render();
  return root;
};

/* ============================================================
   HEALTH — medications + water tracker
   ============================================================ */
Views.health = function () {
  const root = document.createElement('div');
  root.className = 'view view-health';

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Health</h2>
        <p class="view-sub">Medications and daily hydration.</p>
      </div>
    </div>

    <section class="panel">
      <header class="panel-head">
        <h3 class="panel-title">Water tracker</h3>
        <span class="panel-sub" id="water-summary"></span>
      </header>
      <div class="water-tracker">
        <div class="water-bar"><div class="water-fill" id="water-fill"></div></div>
        <div class="water-actions">
          <button class="ghost-btn" id="water-minus" type="button" aria-label="Remove a glass">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <span class="water-count" id="water-count">0 / 8</span>
          <button class="primary-btn" id="water-plus" type="button">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add a glass
          </button>
          <button class="ghost-btn" id="water-reset" type="button" title="Reset today">Reset</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h3 class="panel-title">Medications</h3>
          <p class="panel-sub">Tablets you take regularly.</p>
        </div>
      </header>

      <form class="med-form" id="med-form">
        <input type="text" id="med-name" placeholder="Tablet name (e.g. Metformin)" required>
        <input type="text" id="med-mg"   placeholder="mg (e.g. 500 mg)" required>
        <input type="text" id="med-time" placeholder="Timing (e.g. After breakfast)" required>
        <button type="submit" class="primary-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add
        </button>
      </form>

      <div class="med-list" id="med-list"></div>
    </section>
  `;

  function renderWater() {
    const w = Store.getWater();
    root.querySelector('#water-count').textContent = `${w.count} / ${w.goal}`;
    const pct = Math.min(100, (w.count / w.goal) * 100);
    root.querySelector('#water-fill').style.width = pct + '%';
    const left = Math.max(0, w.goal - w.count);
    root.querySelector('#water-summary').textContent = left === 0
      ? 'Goal reached for today'
      : `${left} glass${left === 1 ? '' : 'es'} to go`;
  }

  function renderMeds() {
    const list = root.querySelector('#med-list');
    const meds = Store.get().medications;
    list.innerHTML = '';
    if (!meds.length) {
      list.innerHTML = `<div class="empty-state small">
        <p class="empty-sub">No medications added yet. Add your first tablet above.</p>
      </div>`;
      return;
    }
    meds.forEach((m) => {
      const row = document.createElement('div');
      row.className = 'med-card';
      row.innerHTML = `
        <div class="med-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"></rect><line x1="8" y1="8" x2="8" y2="8"></line></svg>
        </div>
        <div class="med-info">
          <div class="med-name"></div>
          <div class="med-meta">
            <span class="med-pill"></span>
            <span class="med-timing"></span>
          </div>
        </div>
        <button class="icon-btn small" aria-label="Delete medication">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
        </button>`;
      row.querySelector('.med-name').textContent = m.name;
      row.querySelector('.med-pill').textContent = m.mg;
      row.querySelector('.med-timing').textContent = m.timing;
      row.querySelector('button').addEventListener('click', () => {
        Store.deleteMedication(m.id);
        renderMeds();
      });
      list.appendChild(row);
    });
  }

  root.querySelector('#water-plus').addEventListener('click',  () => { Store.addWater();    renderWater(); });
  root.querySelector('#water-minus').addEventListener('click', () => { Store.removeWater(); renderWater(); });
  root.querySelector('#water-reset').addEventListener('click', () => { Store.resetWater();  renderWater(); });

  root.querySelector('#med-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name   = root.querySelector('#med-name').value.trim();
    const mg     = root.querySelector('#med-mg').value.trim();
    const timing = root.querySelector('#med-time').value.trim();
    if (!name || !mg || !timing) return;
    Store.addMedication(name, mg, timing);
    root.querySelector('#med-name').value = '';
    root.querySelector('#med-mg').value = '';
    root.querySelector('#med-time').value = '';
    renderMeds();
  });

  renderWater();
  renderMeds();
  return root;
};

/* ============================================================
   PROJECTS — future project ideas
   ============================================================ */
Views.projects = function () {
  const root = document.createElement('div');
  root.className = 'view view-projects';

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Projects</h2>
        <p class="view-sub">Future ideas and ongoing work.</p>
      </div>
    </div>

    <form class="project-form" id="project-form">
      <input type="text" id="proj-title" placeholder="Project name" required>
      <input type="text" id="proj-desc"  placeholder="Short description (optional)">
      <button type="submit" class="primary-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add project
      </button>
    </form>

    <div class="project-list" id="project-list"></div>
  `;

  function render() {
    const list = root.querySelector('#project-list');
    const projects = Store.get().projects;
    list.innerHTML = '';
    if (!projects.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 9h18"></path></svg>
          </div>
          <p class="empty-title">No projects yet</p>
          <p class="empty-sub">Capture ideas for things you want to build or work on later.</p>
        </div>`;
      return;
    }
    projects.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const when = new Date(p.ts).toLocaleDateString();
      card.innerHTML = `
        <div class="project-head">
          <div class="project-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4z"></path><line x1="9" y1="3" x2="9" y2="17"></line><line x1="15" y1="7" x2="15" y2="21"></line></svg>
          </div>
          <div class="project-title"></div>
          <button class="icon-btn small" aria-label="Delete project">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
          </button>
        </div>
        <div class="project-desc"></div>
        <div class="project-foot">
          <span class="status-pill" data-status="${p.status}">${p.status}</span>
          <span class="project-date">${when}</span>
        </div>`;
      card.querySelector('.project-title').textContent = p.title;
      const desc = p.description || 'No description yet.';
      card.querySelector('.project-desc').textContent = desc;
      card.querySelector('button').addEventListener('click', () => {
        Store.deleteProject(p.id);
        render();
      });
      list.appendChild(card);
    });
  }

  root.querySelector('#project-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = root.querySelector('#proj-title').value.trim();
    const desc  = root.querySelector('#proj-desc').value.trim();
    if (!title) return;
    Store.addProject(title, desc);
    root.querySelector('#proj-title').value = '';
    root.querySelector('#proj-desc').value = '';
    render();
  });

  render();
  return root;
};

/* ============================================================
   TASKS — persistent todo list
   ============================================================ */
Views.tasks = function () {
  const root = document.createElement('div');
  root.className = 'view view-tasks';

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Tasks</h2>
        <p class="view-sub">Your permanent to-do list.</p>
      </div>
    </div>

    <form class="task-form" id="task-form">
      <input type="text" id="task-input" placeholder="Add a new task…" required autocomplete="off">
      <button type="submit" class="primary-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add
      </button>
    </form>

    <div class="task-list" id="task-list"></div>
  `;

  function render() {
    const list = root.querySelector('#task-list');
    const tasks = Store.get().tasks;
    list.innerHTML = '';
    if (!tasks.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <p class="empty-title">No tasks yet</p>
          <p class="empty-sub">Tasks you add will be saved permanently — even after refresh.</p>
        </div>`;
      return;
    }
    tasks.forEach((t) => {
      const row = document.createElement('label');
      row.className = 'task-row' + (t.done ? ' is-done' : '');
      row.innerHTML = `
        <input type="checkbox" ${t.done ? 'checked' : ''}>
        <span class="task-text"></span>
        <button class="icon-btn small" type="button" aria-label="Delete task">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>`;
      row.querySelector('.task-text').textContent = t.text;
      row.querySelector('input').addEventListener('change', () => {
        Store.toggleTask(t.id);
        render();
      });
      row.querySelector('button').addEventListener('click', (e) => {
        e.preventDefault();
        Store.deleteTask(t.id);
        render();
      });
      list.appendChild(row);
    });
  }

  root.querySelector('#task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = root.querySelector('#task-input');
    const text = input.value.trim();
    if (!text) return;
    Store.addTask(text);
    input.value = '';
    render();
  });

  render();
  return root;
};

/* ============================================================
   SETTINGS — theme, font, app connection
   ============================================================ */
Views.settings = function () {
  const root = document.createElement('div');
  root.className = 'view view-settings';
  const s = Store.get().settings;

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Settings</h2>
        <p class="view-sub">Personalize Orbit to your taste.</p>
      </div>
    </div>

    <section class="panel">
      <header class="panel-head">
        <h3 class="panel-title">Appearance</h3>
        <p class="panel-sub">Theme and typography.</p>
      </header>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Theme</div>
          <div class="setting-desc">Light or dark interface.</div>
        </div>
        <div class="segmented" id="theme-seg">
          <button data-value="dark"  class="${s.theme === 'dark'  ? 'is-on' : ''}">Dark</button>
          <button data-value="light" class="${s.theme === 'light' ? 'is-on' : ''}">Light</button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Font</div>
          <div class="setting-desc">Interface typeface.</div>
        </div>
        <div class="segmented" id="font-seg">
          <button data-value="Inter"          class="${s.font === 'Inter'          ? 'is-on' : ''}">Inter</button>
          <button data-value="Space Grotesk"  class="${s.font === 'Space Grotesk'  ? 'is-on' : ''}">Space Grotesk</button>
          <button data-value="JetBrains Mono" class="${s.font === 'JetBrains Mono' ? 'is-on' : ''}">JetBrains</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <header class="panel-head">
        <h3 class="panel-title">Health goals</h3>
        <p class="panel-sub">Daily hydration target.</p>
      </header>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Water goal (glasses/day)</div>
          <div class="setting-desc">How many glasses of water you want to drink each day. Default is 8.</div>
        </div>
        <input type="number" id="water-goal" min="1" max="30" value="${Store.get().water.goal || 8}" style="width: 100px;">
      </div>
    </section>

    <section class="panel">
      <header class="panel-head">
        <h3 class="panel-title">App connection</h3>
        <p class="panel-sub">Connect Orbit to Google Gemini (free tier — no credit card needed).</p>
      </header>

      <div class="setting-row column">
        <div class="setting-info">
          <div class="setting-label">Gemini API Key</div>
          <div class="setting-desc">Stored locally in your browser. Get a free one at <code>aistudio.google.com/apikey</code> (starts with <code>AIza</code>).</div>
        </div>
        <input type="password" id="api-key" placeholder="AIza..." value="${s.apiKey || ''}" autocomplete="off">
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Model</div>
          <div class="setting-desc">Which Gemini model to chat with. All have a free tier.</div>
        </div>
        <div class="segmented" id="model-seg">
          <button data-value="gemini-2.0-flash"     class="${(s.model || 'gemini-2.0-flash') === 'gemini-2.0-flash'     ? 'is-on' : ''}">2.0 Flash</button>
          <button data-value="gemini-2.5-flash"     class="${s.model === 'gemini-2.5-flash'     ? 'is-on' : ''}">2.5 Flash</button>
          <button data-value="gemini-1.5-flash"     class="${s.model === 'gemini-1.5-flash'     ? 'is-on' : ''}">1.5 Flash</button>
        </div>
      </div>

      <div class="setting-row column">
        <div class="setting-info">
          <div class="setting-label">System prompt (optional)</div>
          <div class="setting-desc">Custom instructions for Orbit's personality.</div>
        </div>
        <input type="text" id="api-system" placeholder="You are Orbit, a focused AI assistant." value="${s.systemPrompt || 'You are Orbit, a focused AI assistant. Be concise and helpful.'}">
      </div>
    </section>

    <section class="panel danger">
      <header class="panel-head">
        <h3 class="panel-title">Reset</h3>
        <p class="panel-sub">Clear all local data: chat, memory, health, projects, tasks, settings.</p>
      </header>
      <button class="danger-btn" id="reset-all">Reset everything</button>
    </section>
  `;

  function applyTheme() {
    const { theme, font } = Store.get().settings;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty('--font-sans', `'${font}', -apple-system, BlinkMacSystemFont, sans-serif`);
  }

  root.querySelectorAll('#theme-seg button').forEach((b) => {
    b.addEventListener('click', () => {
      Store.setSetting('theme', b.dataset.value);
      applyTheme();
      root.querySelectorAll('#theme-seg button').forEach((x) => x.classList.toggle('is-on', x === b));
    });
  });

  root.querySelectorAll('#font-seg button').forEach((b) => {
    b.addEventListener('click', () => {
      Store.setSetting('font', b.dataset.value);
      applyTheme();
      root.querySelectorAll('#font-seg button').forEach((x) => x.classList.toggle('is-on', x === b));
    });
  });

  // ----- Gemini connection handlers -----
  root.querySelector('#api-key').addEventListener('change', (e) => {
    const k = e.target.value.trim();
    Store.setSetting('apiKey', k);
    if (k) console.log('Gemini API key saved locally');
  });

  root.querySelector('#api-system').addEventListener('change', (e) => {
    Store.setSetting('systemPrompt', e.target.value.trim());
  });

  root.querySelectorAll('#model-seg button').forEach((b) => {
    b.addEventListener('click', () => {
      Store.setSetting('model', b.dataset.value);
      root.querySelectorAll('#model-seg button').forEach((x) => x.classList.toggle('is-on', x === b));
    });
  });

  root.querySelector('#water-goal').addEventListener('change', (e) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) {
      Store.setWaterGoal(v);
      e.target.value = Store.get().water.goal;
    }
  });

  root.querySelector('#reset-all').addEventListener('click', () => {
    if (confirm('This will delete ALL local data. Continue?')) {
      Store.reset();
      applyTheme();
      location.reload();
    }
  });

  applyTheme();
  return root;
};
