const UI = {
    chat: document.getElementById('chatDisplay'),
    input: document.getElementById('userInput'),
    send: document.getElementById('sendBtn'),
    theme: document.getElementById('themeSwitcher'),
    loader: document.getElementById('app-loader'),
    suggest: document.getElementById('suggestArea'),
    install: document.getElementById('installBtn')
};

let kamus = null;
let deferredPrompt;

// Initialize App
async function init() {
    try {
        const res = await fetch('kamus_dayak.json');
        const data = await res.json();
        kamus = data.kamus;

        setTimeout(() => {
            UI.loader.style.opacity = '0';
            setTimeout(() => UI.loader.remove(), 500);
            renderMsg("Halo! Nelsen siap bantu terjemahan Dayak kamu.", 'ai');
        }, 1000);
    } catch (e) {
        console.error("Gagal sinkronisasi database.");
    }
}

// Chat
function renderMsg(text, type) {
    const bbl = document.createElement('div');
    bbl.className = `bubble ${type}`;
    bbl.textContent = text;
    UI.chat.appendChild(bbl);
    UI.chat.scrollTo({ top: UI.chat.scrollHeight, behavior: 'smooth' });
}

function translator(str) {
    const q = str.toLowerCase().trim();
    if (!kamus) return "Database sedang sibuk.";

    const words = q.split(/\s+/);
    let matched = false;
    
    const result = words.map(w => {
        const out = kamus["id-dayak"][w] || kamus["dayak-id"][w];
        if (out) { matched = true; return Array.isArray(out) ? out[0] : out; }
        return w;
    });

    return matched ? result.join(' ') : `Maaf bro, kata "${str}" belum ada di database Nelsen.`;
}

async function processInput() {
    const val = UI.input.value.trim();
    if (!val) return;

    renderMsg(val, 'user');
    UI.input.value = '';
    UI.suggest.innerHTML = '';

    const typing = document.createElement('div');
    typing.className = 'bubble ai';
    typing.textContent = '...';
    UI.chat.appendChild(typing);

    setTimeout(() => {
        typing.remove();
        renderMsg(translator(val), 'ai');
    }, 600);
}

// Events
UI.send.onclick = processInput;
UI.input.onkeypress = (e) => e.key === 'Enter' && processInput();

UI.theme.onclick = () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.getElementById('theme-icon').textContent = isLight ? '🌙' : '☀️';
};

// Suggestion Engine
UI.input.oninput = () => {
    const val = UI.input.value.toLowerCase();
    UI.suggest.innerHTML = '';
    if (val.length < 2) return;

    const pool = [...Object.keys(kamus["id-dayak"]), ...Object.keys(kamus["dayak-id"])];
    const matches = pool.filter(k => k.startsWith(val)).slice(0, 5);

    matches.forEach(m => {
        const chip = document.createElement('div');
        chip.textContent = m;
        chip.onclick = () => { UI.input.value = m; processInput(); };
        UI.suggest.appendChild(chip);
    });
};

// PWA Install Logic
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    UI.install.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
    console.log('PWA sudah diinstall');
    UI.install.style.display = 'none';
});

UI.install.onclick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    UI.install.style.display = 'none';
};

init();