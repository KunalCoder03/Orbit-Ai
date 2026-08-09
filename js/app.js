// ===== Orbit — main app controller =====
// - Routes between Home (chat) and tab views
// - Wires chat messages to persistent Store
// - Wires attach menu popover
// - Bootstraps theme from stored settings

(function () {
  const navItems   = document.querySelectorAll('.nav-item');
  const content    = document.getElementById('content');
  const hero       = document.getElementById('hero');
  const viewHost   = document.getElementById('view-host');
  const chatLog    = document.getElementById('chat-log');
  const chatInput  = document.getElementById('chat-input');
  const composer   = document.getElementById('chat-box');
  const sendBtn    = document.getElementById('send-btn');
  const micBtn     = document.getElementById('mic-btn');
  const cards      = document.querySelectorAll('.suggestion');
  const attachBtn  = document.getElementById('attach-btn');
  const attachMenu = document.getElementById('attach-menu');
  const newChatBtn = document.getElementById('new-chat-btn');
  const breadcrumb = document.getElementById('breadcrumb');

  const VIEW_TITLES = {
    home: 'Home', chat: 'Chat', memory: 'Memory',
    health: 'Health', projects: 'Projects', tasks: 'Tasks', settings: 'Settings'
  };

  let currentView = 'home';

  // ----------------------------------------------------------------
  // Theme / font bootstrap
  // ----------------------------------------------------------------
  function applyTheme() {
    const s = Store.get().settings;
    document.documentElement.dataset.theme = s.theme || 'dark';
    document.documentElement.style.setProperty('--font-sans', `'${s.font || 'Inter'}', -apple-system, BlinkMacSystemFont, sans-serif`);
  }
  applyTheme();

  // ----------------------------------------------------------------
  // Router
  // ----------------------------------------------------------------
  function setView(name, opts = {}) {
    currentView = name;

    navItems.forEach((n) => n.classList.toggle('is-active', n.dataset.view === name));
    breadcrumb.querySelector('.crumb-current').textContent = VIEW_TITLES[name] || name;

    if (name === 'home') {
      viewHost.hidden = true;
      viewHost.innerHTML = '';
      content.hidden = false;
    } else {
      content.hidden = true;
      viewHost.hidden = false;
      const fn = Views[name];
      viewHost.innerHTML = '';
      if (fn) viewHost.appendChild(fn(opts));
    }
  }

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      setView(item.dataset.view);
    });
  });

  newChatBtn.addEventListener('click', () => {
    setView('home');
    chatInput.value = '';
    chatInput.focus();
  });

  // ----------------------------------------------------------------
  // Chat (Home) logic — wires to Store
  // ----------------------------------------------------------------
  function addMessage(text, who) {
    const msg = document.createElement('div');
    msg.className = `msg ${who}`;
    msg.textContent = text;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addRichMessage(m) {
    if (m.image) {
      addMessageWithImage(m);
    } else {
      addMessage(m.text, m.role);
    }
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg ai typing';
    msg.innerHTML = '<span></span><span></span><span></span>';
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msg;
  }

  function enterChatMode() {
    content.classList.add('is-chat');
    requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
  }

  function renderChatHistory() {
    chatLog.innerHTML = '';
    const chat = Store.get().chat;
    chat.forEach((m) => addRichMessage(m));
    if (chat.length) enterChatMode();
  }

  async function realAIReply(userText) {
    const settings = Store.get().settings;
    const apiKey = settings.apiKey;

    if (!apiKey) {
      // Fall back to hint if no key configured
      const reply = `You said: "${userText}". Add your Gemini API key in Settings → App connection to make this real. Get a free one at aistudio.google.com/apikey.`;
      Store.addMessage('ai', reply);
      Orb.setState('speaking');
      addMessage(reply, 'ai');
      setTimeout(() => Orb.setState('idle'), 1400);
      return;
    }

    Orb.setState('thinking');
    const indicator = addTyping();

    try {
      const model = settings.model || 'gemini-2.0-flash';
      const systemPrompt = settings.systemPrompt || 'You are Orbit, a focused AI assistant. Be concise and helpful.';

      // Build Gemini contents array from local chat history
      // Gemini uses "user" / "model" roles (not "assistant")
      const history = Store.get().chat.slice(-20).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text || '' }]
      }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: history,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
                 || data.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim()
                 || '(empty reply)';

      indicator.remove();
      Store.addMessage('ai', reply);
      Orb.setState('speaking');
      addMessage(reply, 'ai');
    } catch (err) {
      indicator.remove();
      const errMsg = `⚠️ Gemini error: ${err.message}`;
      Store.addMessage('ai', errMsg);
      addMessage(errMsg, 'ai');
    } finally {
      setTimeout(() => Orb.setState('idle'), 1200);
    }
  }

  function fakeAIReply(userText) {
    // Defers to real Gemini call if key exists, else shows hint
    realAIReply(userText);
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (!content.classList.contains('is-chat')) enterChatMode();
    addMessage(text, 'user');
    Store.addMessage('user', text);
    chatInput.value = '';
    Orb.setState('listening');
    setTimeout(() => fakeAIReply(text), 300);
  }

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (currentView !== 'home') setView('home');
      chatInput.value = card.dataset.prompt || '';
      chatInput.focus();
    });
  });

  composer.addEventListener('submit', (e) => { e.preventDefault(); handleSend(); });
  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  micBtn.addEventListener('click', () => {
    const isRec = micBtn.classList.toggle('is-recording');
    Orb.setState(isRec ? 'listening' : 'idle');
  });

  // ----------------------------------------------------------------
  // Attach menu popover
  // ----------------------------------------------------------------
  function openAttachMenu() {
    const rect = attachBtn.getBoundingClientRect();
    attachMenu.hidden = false;
    const menuRect = attachMenu.getBoundingClientRect();
    let left = rect.left;
    let top  = rect.top - menuRect.height - 8;
    if (top < 8) top = rect.bottom + 8;   // flip below if no room above
    // keep inside viewport
    const maxLeft = window.innerWidth - menuRect.width - 8;
    if (left > maxLeft) left = maxLeft;
    attachMenu.style.left = left + 'px';
    attachMenu.style.top  = top  + 'px';
  }
  function closeAttachMenu() { attachMenu.hidden = true; }

  attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (attachMenu.hidden) openAttachMenu(); else closeAttachMenu();
  });
  attachMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.attach-item');
    if (!item) return;
    const action = item.dataset.action;
    closeAttachMenu();
    handleAttachAction(action);
  });
  document.addEventListener('click', (e) => {
    if (!attachMenu.hidden && !attachMenu.contains(e.target) && e.target !== attachBtn) {
      closeAttachMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !attachMenu.hidden) closeAttachMenu();
  });

  function handleAttachAction(action) {
    if (currentView !== 'home') setView('home');
    if (action === 'camera') {
      openCameraCapture();
      return;
    }
    const labels = {
      photos:   'Add photos & videos to the conversation',
      generate: 'Generate an image from a prompt',
      files:    'Attach a file (document, PDF, code)',
      camera:   'Capture from webcam'
    };
    chatInput.value = labels[action] || '';
    chatInput.focus();
  }

  // ----------------------------------------------------------------
  // Camera capture (webcam) — opens a glass overlay, captures one frame
  // ----------------------------------------------------------------
  let cameraStream = null;
  function openCameraCapture() {
    // If a stream is already open, just reopen the overlay
    if (!document.getElementById('camera-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'camera-overlay';
      overlay.className = 'camera-overlay';
      overlay.innerHTML = `
        <div class="camera-modal glass">
          <header class="camera-head">
            <h3>Capture from webcam</h3>
            <button class="icon-btn small" id="cam-close" aria-label="Close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </header>
          <div class="camera-stage">
            <video id="cam-video" autoplay playsinline muted></video>
            <canvas id="cam-canvas" hidden></canvas>
          </div>
          <footer class="camera-foot">
            <button class="ghost-btn" id="cam-cancel" type="button">Cancel</button>
            <button class="primary-btn" id="cam-snap" type="button">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="4"></circle><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path></svg>
              Capture
            </button>
          </footer>
        </div>`;
      document.body.appendChild(overlay);

      const close = () => closeCameraCapture();
      overlay.querySelector('#cam-close').addEventListener('click', close);
      overlay.querySelector('#cam-cancel').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      overlay.querySelector('#cam-snap').addEventListener('click', snapCamera);
    }

    const overlay = document.getElementById('camera-overlay');
    overlay.classList.add('is-open');

    const video = overlay.querySelector('#cam-video');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support webcam access.');
      closeCameraCapture();
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        cameraStream = stream;
        video.srcObject = stream;
      })
      .catch((err) => {
        console.warn('Camera denied:', err);
        alert('Could not access webcam. Please allow camera permission in your browser settings.');
        closeCameraCapture();
      });
  }

  function closeCameraCapture() {
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.classList.remove('is-open');
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      cameraStream = null;
    }
    const video = document.getElementById('cam-video');
    if (video) video.srcObject = null;
  }

  function snapCamera() {
    const overlay = document.getElementById('camera-overlay');
    if (!overlay) return;
    const video = overlay.querySelector('#cam-video');
    const canvas = overlay.querySelector('#cam-canvas');
    if (!video.videoWidth) {
      alert('Camera not ready yet — please wait a second.');
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    // Inject the captured image as a user message with a thumbnail
    const msg = { id: crypto.randomUUID(), role: 'user', text: '📷 Captured from webcam', ts: Date.now(), image: dataUrl };
    Store.set((s) => { s.chat.push(msg); });
    if (!content.classList.contains('is-chat')) enterChatMode();
    addMessageWithImage(msg);
    closeCameraCapture();
  }

  function addMessageWithImage(msg) {
    const div = document.createElement('div');
    div.className = `msg ${msg.role} msg-image`;
    if (msg.image) {
      const img = document.createElement('img');
      img.src = msg.image;
      img.alt = 'captured';
      img.className = 'msg-thumb';
      div.appendChild(img);
    }
    if (msg.text) {
      const cap = document.createElement('div');
      cap.className = 'msg-caption';
      cap.textContent = msg.text;
      div.appendChild(cap);
    }
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // ----------------------------------------------------------------
  // Bootstrap
  // ----------------------------------------------------------------
  renderChatHistory();
  setView('home');

  // Re-render chat on first focus of input (so new tabs reflect changes)
  chatInput.addEventListener('focus', () => {
    if (currentView === 'home' && !chatLog.children.length) renderChatHistory();
  });
})();

/*
  ===== Connecting a real AI backend =====
  In Views.settings() the API URL is saved to Store.setSetting('apiUrl', ...).
  Replace fakeAIReply in app.js with:

  async function realAIReply(userText) {
    const apiUrl = Store.get().settings.apiUrl || 'http://127.0.0.1:5000/chat';
    Orb.setState('thinking');
    const indicator = addTyping();
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      indicator.remove();
      const reply = data.reply || '(empty reply)';
      Store.addMessage('ai', reply);
      Orb.setState('speaking');
      addMessage(reply, 'ai');
    } catch (err) {
      indicator.remove();
      const errMsg = 'Sorry — I could not reach the server.';
      Store.addMessage('ai', errMsg);
      addMessage(errMsg, 'ai');
    } finally {
      setTimeout(() => Orb.setState('idle'), 1200);
    }
  }
*/
