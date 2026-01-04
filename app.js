// Global variables to store data
let scpDatabase = [];
let personnelData = [];
let incidentsData = [];
let translations = {};
let currentLanguage = 'es';

// Settings
let settings = {
    language: 'es',
    theme: 'green',
    effects: {
        crt: true,
        scanlines: true,
        glitch: true,
        grid: true
    }
};

// Load all data when page loads
async function loadData() {
    try {
        // Load SCPs
        const scpsResponse = await fetch('scps.json');
        scpDatabase = await scpsResponse.json();
        
        // Load Personnel
        const personnelResponse = await fetch('personnel.json');
        personnelData = await personnelResponse.json();
        
        // Load Incidents
        const incidentsResponse = await fetch('incidents.json');
        incidentsData = await incidentsResponse.json();
        
        // Load Translations
        const translationsResponse = await fetch('translations.json');
        translations = await translationsResponse.json();
        
        // Load saved settings
        loadSettings();
        
        // Initialize the interface
        init();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty arrays if files can't be loaded
        init();
    }
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('scpSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        applySettings();
    }
}

// Apply settings
function applySettings() {
    // Apply language
    changeLanguage(settings.language, false);
    
    // Apply theme
    changeTheme(settings.theme, false);
    
    // Apply effects
    toggleEffect('crt', settings.effects.crt, false);
    toggleEffect('scanlines', settings.effects.scanlines, false);
    toggleEffect('glitch', settings.effects.glitch, false);
    toggleEffect('grid', settings.effects.grid, false);
}

// Save settings
function saveSettings() {
    localStorage.setItem('scpSettings', JSON.stringify(settings));
    addLog(translations[currentLanguage].settings.settingsSaved);
}

// Reset settings
function resetSettings() {
    settings = {
        language: 'es',
        theme: 'green',
        effects: {
            crt: true,
            scanlines: true,
            glitch: true,
            grid: true
        }
    };
    localStorage.removeItem('scpSettings');
    applySettings();
    addLog('Settings reset to defaults');
}

// Change language
function changeLanguage(lang, save = true) {
    currentLanguage = lang;
    settings.language = lang;
    
    // Update active button
    document.querySelectorAll('[id^="lang-"]').forEach(btn => btn.classList.remove('active'));
    document.getElementById('lang-' + lang).classList.add('active');
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Re-render dynamic content
    renderSCPList();
    renderPersonnel();
    renderIncidents();
    
    if (save) {
        saveSettings();
    }
}

// Get translation by key
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    for (const k of keys) {
        value = value?.[k];
    }
    return value;
}

// Change theme
function changeTheme(theme, save = true) {
    settings.theme = theme;
    
    // Update active button
    document.querySelectorAll('[id^="theme-"]').forEach(btn => btn.classList.remove('active'));
    document.getElementById('theme-' + theme).classList.add('active');
    
    // Apply theme class
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (theme !== 'green') {
        document.body.classList.add('theme-' + theme);
    }
    
    if (save) {
        saveSettings();
    }
}

// Toggle effects
function toggleEffect(effect, state = null, save = true) {
    const checkbox = document.getElementById('toggle-' + effect);
    if (checkbox) {
        if (state !== null) {
            checkbox.checked = state;
        }
        settings.effects[effect] = checkbox.checked;
        
        // Apply effect
        if (checkbox.checked) {
            document.body.classList.remove('no-' + effect);
        } else {
            document.body.classList.add('no-' + effect);
        }
    }
    
    if (save) {
        saveSettings();
    }
}

// Initialize
function init() {
    renderSCPList();
    renderPersonnel();
    renderIncidents();
    startSystemLog();
}

// Login
function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simulated login
    if (username && password) {
        addLog(getTranslation('logs.userAuth') + ': ' + username);
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainInterface').classList.add('active');
    }
    return false;
}

function guestAccess() {
    addLog(getTranslation('logs.guestAccess'));
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainInterface').classList.add('active');
}

function logout() {
    addLog(getTranslation('logs.userLogout'));
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainInterface').classList.remove('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Navigation
function showSection(section) {
    // Update buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    
    addLog(getTranslation('logs.accessingSection') + ': ' + section.toUpperCase());
}

// Render SCP List
function renderSCPList() {
    const container = document.getElementById('scpList');
    if (!container) return;
    
    const classText = getTranslation('database.class');
    
    container.innerHTML = scpDatabase.map(scp => `
        <div class="scp-card" onclick="showSCPDetails('${scp.number}')">
            <div class="scp-number">${scp.number}</div>
            <div class="scp-class ${scp.class}">${classText}: ${scp.class.toUpperCase()}</div>
            <div class="scp-name">"${scp.name}"</div>
        </div>
    `).join('');
}

// Show SCP Details
function showSCPDetails(number) {
    const scp = scpDatabase.find(s => s.number === number);
    if (!scp) return;
    
    const modal = document.getElementById('scpModal');
    const content = document.getElementById('modalContent');
    
    const objectClassText = getTranslation('database.objectClass');
    const descriptionText = getTranslation('modal.description');
    const containmentText = getTranslation('modal.containment');
    const addendumText = getTranslation('modal.addendum');
    const classifiedText = getTranslation('modal.furtherClassified');
    
    content.innerHTML = `
        <span class="modal-close" onclick="closeModal()">&times;</span>
        <h2 style="font-size: 42px; color: var(--warning-red); margin-bottom: 20px;">${scp.number}</h2>
        <h3 style="font-size: 32px; color: var(--scp-blue); margin-bottom: 20px;">"${scp.name}"</h3>
        <div class="scp-class ${scp.class}" style="font-size: 24px;">${objectClassText}: ${scp.class.toUpperCase()}</div>
        
        <div class="info-section">
            <h3>${descriptionText}</h3>
            <p>${scp.description}</p>
        </div>
        
        <div class="info-section">
            <h3>${containmentText}</h3>
            <p>${scp.containment}</p>
            <p>${scp.procedures}</p>
        </div>
        
        <div class="info-section">
            <h3>${addendumText}</h3>
            <p>${scp.addendum}</p>
        </div>
        
        <div class="classified">
            ${classifiedText}
        </div>
    `;
    
    modal.classList.add('active');
    addLog('Accessing SCP file: ' + number);
}

function closeModal() {
    document.getElementById('scpModal').classList.remove('active');
}

// Render Personnel
function renderPersonnel() {
    const tbody = document.getElementById('personnelList');
    if (!tbody) return;
    
    tbody.innerHTML = personnelData.map(person => {
        const statusText = getTranslation(`personnel.${person.status}`);
        return `
            <tr>
                <td>${person.id}</td>
                <td>${person.name}</td>
                <td>${person.clearance}</td>
                <td>${person.department}</td>
                <td class="status-${person.status}">${statusText ? statusText.toUpperCase() : person.status.toUpperCase()}</td>
            </tr>
        `;
    }).join('');
}

// Render Incidents
function renderIncidents() {
    const container = document.getElementById('incidentsList');
    if (!container) return;
    
    const severityText = getTranslation('incidents.severity');
    const subjectText = getTranslation('incidents.subject');
    
    container.innerHTML = incidentsData.map(incident => `
        <div class="info-section" style="margin: 15px 0;">
            <h3 style="color: var(--warning-red);">${incident.id} - ${severityText}: ${incident.severity}</h3>
            <p><span class="timestamp">[${incident.date}]</span> ${subjectText}: ${incident.subject}</p>
            <p>${incident.description}</p>
        </div>
    `).join('');
}

// System Log
function addLog(message, type = 'info') {
    const logContainer = document.getElementById('systemLog');
    if (!logContainer) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function startSystemLog() {
    addLog(getTranslation('logs.systemInit'));
    addLog(getTranslation('logs.databaseOnline'));
    addLog(getTranslation('logs.securityActive'));
    
    // Random log entries
    setInterval(() => {
        const logKeys = [
            'logs.containmentCheck',
            'logs.monitoring',
            'logs.personnelShift',
            'logs.backupOperational',
            'logs.scanningAnomalies',
            'logs.securitySweep'
        ];
        const randomKey = logKeys[Math.floor(Math.random() * logKeys.length)];
        addLog(getTranslation(randomKey));
    }, 8000);
    
    // Occasional warnings
    setInterval(() => {
        if (Math.random() > 0.7) {
            addLog(getTranslation('logs.anomalyDetected'), 'warning');
        }
    }, 15000);
}

// Close modal on click outside
window.onclick = function(event) {
    const modal = document.getElementById('scpModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Load data and initialize on page load
window.onload = loadData;
