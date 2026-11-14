let dogs = JSON.parse(localStorage.getItem('welpenDaten')) || [];

function saveData() {
    localStorage.setItem('welpenDaten', JSON.stringify(dogs));
}

// --- MODAL LOGIK (Hinzufügen & Bearbeiten) ---
function openModal(dogId = null) {
    document.getElementById('dog-modal').classList.remove('hidden');
    const title = document.getElementById('modal-title');
    const inputName = document.getElementById('input-name');
    const inputBirthday = document.getElementById('input-birthday');
    const editId = document.getElementById('edit-dog-id');

    if (dogId) {
        const dog = dogs.find(d => d.id === dogId);
        title.textContent = "Hund bearbeiten";
        inputName.value = dog.name;
        inputBirthday.value = dog.birthday;
        editId.value = dog.id;
    } else {
        title.textContent = "Hund hinzufügen";
        inputName.value = '';
        inputBirthday.value = '';
        editId.value = '';
    }
}

function closeModal() {
    document.getElementById('dog-modal').classList.add('hidden');
}

function saveDog() {
    const name = document.getElementById('input-name').value.trim();
    const birthday = document.getElementById('input-birthday').value;
    const editId = document.getElementById('edit-dog-id').value;

    if (!name) { alert("Bitte gib einen Namen ein."); return; }

    if (editId) {
        const dog = dogs.find(d => d.id == editId);
        dog.name = name;
        dog.birthday = birthday;
    } else {
        dogs.push({ id: Date.now(), name: name, birthday: birthday, weights: [] });
    }
    
    saveData();
    closeModal();
    renderAll();
}

function deleteDog(dogId) {
    if (confirm("Diesen Hund wirklich löschen?")) {
        dogs = dogs.filter(d => d.id !== dogId);
        saveData();
        renderAll();
    }
}

// --- DATUMS & STATISTIK BERECHNUNGEN ---
function berechneAlter(geburtsdatum) {
    if (!geburtsdatum) return "Unbekannt";
    const heute = new Date();
    const geburt = new Date(geburtsdatum);
    
    let diffDays = Math.floor((heute - geburt) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Zukunft"; // Falls man sich vertippt
    
    const wochen = Math.floor(diffDays / 7);
    const tage = diffDays % 7;
    
    if (diffDays < 14) {
        return `${diffDays} Tage (${wochen} Wo.)`;
    }
    return `${wochen} Wochen`;
}

function formatDateGerman(dateString) {
    if (!dateString) return "Unbekannt";
    const [y, m, d] = dateString.split('-');
    return `${d}.${m}.${y}`;
}

// --- RENDERING ---
function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`view-${tabId}`).classList.add('active');
    document.querySelector(`.nav-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');

    if (tabId === 'statistiken') renderStats();
}

function renderAll() {
    const container = document.getElementById('app-container');
    const select = document.getElementById('stats-dog-select');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="">-- Bitte wählen --</option>';

    dogs.forEach(dog => {
        // Dropdown für Statistiken füllen
        select.innerHTML += `<option value="${dog.id}">${dog.name}</option>`;

        // Gesamtzunahme berechnen
        let zunahme = 0;
        let statText = "Noch keine Daten";
        if (dog.weights.length > 0) {
            const erstesGewicht = dog.weights[0].value;
            const letztesGewicht = dog.weights[dog.weights.length - 1].value;
            zunahme = (letztesGewicht - erstesGewicht).toFixed(2);
            statText = `Zunahme: ${zunahme > 0 ? '+' : ''}${zunahme} kg`;
        }

        const card = document.createElement('div');
        card.className = 'dog-card';
        card.innerHTML = `
            <div class="card-header">
                <h2>🐕 ${dog.name}</h2>
                <div>
                    <button class="icon-btn" onclick="openModal(${dog.id})">✏️</button>
                    <button class="icon-btn" onclick="deleteDog(${dog.id})">🗑️</button>
                </div>
            </div>
            <div class="dog-info">
                Geb.: ${formatDateGerman(dog.birthday)} | Alter: ${berechneAlter(dog.birthday)}
            </div>
            <div class="stats" style="color: var(--accent); font-weight: bold; margin-bottom: 10px;">${statText}</div>
            <div class="weight-entry">
                <input type="number" step="0.01" id="weight-${dog.id}" placeholder="Gewicht (kg)">
                <button onclick="addWeight(${dog.id})">Eintragen</button>
            </div>
            <div class="history">
                <strong>Verlauf:</strong><br>
                ${dog.weights.map(w => `${w.date}: ${w.value} kg`).join('<br>') || 'Noch keine Einträge.'}
            </div>
        `;
        container.appendChild(card);
    });

    document.getElementById('add-dog-btn').onclick = () => openModal();
}

function addWeight(dogId) {
    const dog = dogs.find(d => d.id === dogId);
    const input = document.getElementById(`weight-${dogId}`);
    
    if (dog && input.value) {
        const heute = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
        dog.weights.push({ date: heute, value: parseFloat(input.value) });
        input.value = '';
        saveData();
        renderAll();
    } else {
        alert("Bitte gib ein gültiges Gewicht ein.");
    }
}

// --- STATISTIK TAB ---
document.getElementById('stats-dog-select').addEventListener('change', renderStats);

function renderStats() {
    const dogId = document.getElementById('stats-dog-select').value;
    const container = document.getElementById('stats-container');

    if (!dogId) {
        container.innerHTML = '<p class="empty-msg">Wähle oben einen Hund aus.</p>';
        return;
    }

    const dog = dogs.find(d => d.id == dogId);
    const w = dog.weights;

    if (w.length < 2) {
        container.innerHTML = '<p class="empty-msg">Trage mindestens 2 Gewichte ein, um Statistiken zu sehen.</p>';
        return;
    }

    const startGewicht = w[0].value;
    const aktGewicht = w[w.length - 1].value;
    const gesamtZunahme = (aktGewicht - startGewicht).toFixed(2);
    
    // Wöchentliche Zunahme berechnen
    const startDatum = new Date(w[0].date.split('.').reverse().join('-'));
    const aktDatum = new Date(w[w.length - 1].date.split('.').reverse().join('-'));
    
    let diffTage = Math.floor((aktDatum - startDatum) / (1000 * 60 * 60 * 24));
    if (diffTage < 1) diffTage = 1; // Verhindert Division durch 0

    const wochenZunahme = ((aktGewicht - startGewicht) / diffTage * 7).toFixed(2);
    const durchschnittsGewicht = (w.reduce((sum, entry) => sum + entry.value, 0) / w.length).toFixed(2);

    container.innerHTML = `
        <div class="stat-box">
            <h3>Aktuelles Gewicht</h3>
            <div class="stat-value">${aktGewicht} kg</div>
        </div>
        <div class="stat-box">
            <h3>Gesamtzunahme</h3>
            <div class="stat-value" style="color: ${gesamtZunahme >= 0 ? 'var(--green)' : 'var(--red)'}">
                ${gesamtZunahme > 0 ? '+' : ''}${gesamtZunahme} kg
            </div>
        </div>
        <div class="stat-box">
            <h3>Ø Zunahme pro Woche</h3>
            <div class="stat-value">${wochenZunahme > 0 ? '+' : ''}${wochenZunahme} kg</div>
        </div>
        <div class="stat-box">
            <h3>Durchschnittsgewicht (aller Einträge)</h3>
            <div class="stat-value">${durchschnittsGewicht} kg</div>
        </div>
    `;
}

// Initiale Anzeige
renderAll();
