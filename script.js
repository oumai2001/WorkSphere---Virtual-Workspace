//  CONFIG
const ZONE_CONFIG = {
    conference: { name: 'Salle de conférence', limit: 10, required: false },
    reception: { name: 'Réception', limit: 2, required: true },
    serveurs: { name: 'Salle des serveurs', limit: 3, required: true },
    securite: { name: 'Salle de sécurité', limit: 2, required: true },
    personnel: { name: 'Salle du personnel', limit: 15, required: false },
    archives: { name: "Salle d'archives", limit: 2, required: true }
};

const ROLE_RESTRICTIONS = {
    'Réceptionniste': ['reception'],
    'Technicien IT': ['serveurs'],
    'Agent de sécurité': ['securite'],
    'Manager': ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'],
    'Nettoyage': ['conference', 'reception', 'serveurs', 'securite', 'personnel'],
    'FS Developer': ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'],
    'Comptable': ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'],
    'RH': ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'],
    'Commercial': ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives']
};

//  ETAT 
let workers = [];
let nextWorkerId = 1;
let draggedWorker = null;

// INIT 
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initializeEventListeners();
    renderAll();
    updateRequiredZones();
});

// STORAGE 
function saveToStorage() {
    localStorage.setItem('workSphereData', JSON.stringify({
        workers: workers,
        nextWorkerId: nextWorkerId
    }));
}

function loadFromStorage() {
    const saved = localStorage.getItem('workSphereData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            workers = Array.isArray(data.workers) ? data.workers : [];
            nextWorkerId = typeof data.nextWorkerId === 'number' ? data.nextWorkerId : 1;
        } catch (err) {
            console.warn('Erreur parse storage, reset.', err);
            workers = [];
            nextWorkerId = 1;
        }
    }
}

// EVENTS 
function initializeEventListeners() {
    const addBtn = document.getElementById('validation');
    if (addBtn) addBtn.addEventListener('click', openAddModal);

    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAddModal);

    const closeProfileBtn = document.getElementById('closeProfileModal');
    if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeProfileModal);

    const closeZoneSelectorBtn = document.getElementById('closeZoneSelector');
    if (closeZoneSelectorBtn) closeZoneSelectorBtn.addEventListener('click', closeZoneSelector);

    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeAddModal();
            closeProfileModal();
            closeZoneSelector();
        });
    }

    const addForm = document.getElementById('addWorkerForm');
    if (addForm) addForm.addEventListener('submit', handleAddWorker);

    const photoInput = document.getElementById('workerPhoto');
    if (photoInput) photoInput.addEventListener('input', updatePhotoPreview);

    const addExpBtn = document.getElementById('addExperienceBtn');
    if (addExpBtn) addExpBtn.addEventListener('click', addExperienceField);

    document.querySelectorAll('.plusbtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const zone = e.currentTarget.dataset.zone;
            openZoneSelector(zone);
        });
    });

    const nameInput = document.getElementById('workerName');
    if (nameInput) nameInput.addEventListener('input', () => {
        const v = nameInput.value.trim();
        showError('workerName', 'errorName', validateName(v) ? '' : 'Nom invalide (min 3 lettres).');
    });

    const emailInput = document.getElementById('workerEmail');
    if (emailInput) emailInput.addEventListener('input', () => {
        const v = emailInput.value.trim();
        showError('workerEmail', 'errorEmail', validateEmail(v) ? '' : 'Email invalide.');
    });

    const phoneInput = document.getElementById('workerPhone');
    if (phoneInput) phoneInput.addEventListener('input', () => {
        const v = phoneInput.value.trim();
        showError('workerPhone', 'errorPhone', validatePhone(v) ? '' : 'Téléphone invalide.');
    });

    if (photoInput) photoInput.addEventListener('input', () => {
        const v = photoInput.value.trim();
        showError('workerPhoto', 'errorPhoto', validatePhoto(v) ? '' : 'URL d\'image invalide.');
    });
}

//MODALS 
function openAddModal() {
    const modal = document.getElementById('validationForm');
    if (modal) modal.classList.add('active');
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('active');

    const form = document.getElementById('addWorkerForm');
    if (form) form.reset();

    const expList = document.getElementById('experiencesList');
    if (expList) expList.innerHTML = '';
    const img = document.getElementById('profileimg');
    if (img) {
        img.src = '';
        img.classList.remove('active');
    }

    ['errorName','errorEmail','errorPhone','errorPhoto'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });
}

function closeAddModal() {
    const modal = document.getElementById('validationForm');
    if (modal) modal.classList.remove('active');
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function showWorkerProfile(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const zoneName = worker.zone ? ZONE_CONFIG[worker.zone].name : 'Non assigné';
    let experiencesHtml = '';
    
    if (worker.experiences && worker.experiences.length > 0) {
        experiencesHtml = worker.experiences.map(exp => {
            const period = exp.start ? (exp.end ? `${exp.start} — ${exp.end}` : `${exp.start} — Present`) : '';
            return `
                <div class="experience-item-profile">
                    <strong>${escapeHtml(exp.position)}</strong>
                    <span class="experience-period">${period}</span>
                </div>
            `;
        }).join('');
    } else {
        experiencesHtml = '<p class="no-experience">Aucune expérience</p>';
    }

    const photoHtml = worker.photo
        ? `<img src="${escapeHtml(worker.photo)}" alt="${escapeHtml(worker.name)}" class="profile-photo" onerror="handleProfileImageError(this)">`
        : `<div class="profile-photo profile-photo-default">👤</div>`;

    document.getElementById('profileContent').innerHTML = `
        <div class="profile-header-top">
            ${photoHtml}
            <div class="profile-title-section">
                <div class="profile-name">${escapeHtml(worker.name)}</div>
                <div class="profile-role">${escapeHtml(worker.role)}</div>
            </div>
        </div>
        <div class="profile-details">
            <div class="profile-section">
                <h3 class="section-title">Informations de contact</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-content">
                            <span class="info-label">Email : </span>
                            <span class="info-value">${escapeHtml(worker.email)}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-content">
                            <span class="info-label">Téléphone : </span>
                            <span class="info-value">${escapeHtml(worker.phone)}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-content">
                            <span class="info-label">Localisation : </span>
                            <span class="info-value">${zoneName}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="profile-section">
                <h3 class="section-title">Expériences professionnelles</h3>
                <div class="experiences-container">
                    ${experiencesHtml}
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('active');
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
}

// - PHOTO PREVIEW & ERRORS 

function updatePhotoPreview() {
    const url = document.getElementById('workerPhoto').value.trim();
    const img = document.getElementById('profileimg');
    if (url) {
        img.src = url;
        img.classList.add('active');
        img.onerror = () => img.classList.remove('active');
    } else {
        img.classList.remove('active');
    }
}

function handleImageError(img) {
    img.src = '';
    img.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.style.fontSize = '24px';
    img.textContent = '👤';
}

function handleProfileImageError(img) {
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'profile-photo';
    placeholder.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.fontSize = '60px';
    placeholder.textContent = '👤';
    img.parentNode.insertBefore(placeholder, img);
}

//EXPERIENCES UI 
function addExperienceField() {
    const container = document.getElementById('experiencesList');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'experience-item';
    div.style.marginBottom = '10px';
    div.innerHTML = `
        <input type="text" placeholder="Poste / Entreprise" class="exp-position" required style="width:100%; margin-bottom:6px;" />
        <div class="exp-dates" style="display:flex; gap:8px; align-items:center;">
            <div style="display:flex; flex-direction:column;">
                <label style="font-size:12px;">Début</label>
                <input type="month" class="exp-start" required>
            </div>
            <div style="display:flex; flex-direction:column;">
                <label style="font-size:12px;">Fin (laisser vide = en cours)</label>
                <input type="month" class="exp-end">
            </div>
            <button type="button" class="remove-experience-btn" title="Supprimer" style="height:32px; align-self:flex-end;">×</button>
        </div>
        <p class="exp-error text-red-500 text-sm mt-1" style="display:none;"></p>
    `;
    const removeBtn = div.querySelector('.remove-experience-btn');
    removeBtn.addEventListener('click', () => div.remove());
    container.appendChild(div);

    const startInput = div.querySelector('.exp-start');
    const endInput = div.querySelector('.exp-end');
    const errorP = div.querySelector('.exp-error');

    const checkDates = () => {
        errorP.style.display = 'none';
        if (startInput.value && endInput.value) {
            if (!isStartBeforeOrEqualEnd(startInput.value, endInput.value)) {
                errorP.textContent = 'La date de début doit être antérieure ou égale à la date de fin.';
                errorP.style.display = 'block';
            }
        }
    };

    startInput.addEventListener('input', checkDates);
    endInput.addEventListener('input', checkDates);
}

//  VALIDATIONS 
function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    if (!input || !error) return;

    if (message) {
        input.classList.add('border-red-500');
        input.classList.remove('border-green-500');
        error.textContent = message;
        error.classList.remove('hidden');
    } else {
        input.classList.remove('border-red-500');
        input.classList.add('border-green-500');
        error.textContent = '';
        error.classList.add('hidden');
    }
}

function validateName(name) {
    const regex = /^[A-Za-zÀ-ÿ\s'-]{3,50}$/;
    return regex.test(name);
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePhone(phone) {
    const regex = /^\+?[0-9]{8,15}$/;
    return regex.test(phone);
}

function validatePhoto(url) {
    if (!url) return true;
    const regex = /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp))$/i;
    return regex.test(url);
}

function isStartBeforeOrEqualEnd(startValue, endValue) {
    if (!startValue) return false;
    if (!endValue) return true; 

    const sParts = startValue.split('-').map(Number);
    const eParts = endValue.split('-').map(Number);

    const sY = sParts[0], sM = sParts[1] || 1, sD = sParts[2] || 1;
    const eY = eParts[0], eM = eParts[1] || 1, eD = eParts[2] || 1;

    if ([sY,sM,eY,eM].some(n => isNaN(n))) return false;

    if (sY < eY) return true;
    if (sY > eY) return false;
    if (sM < eM) return true;
    if (sM > eM) return false;
    return sD <= eD;
}

//  HANDLE ADD WORKER (MAIN) 
function handleAddWorker(e) {
    e.preventDefault();

    const name = document.getElementById('workerName').value.trim();
    const role = document.getElementById('workerRole').value;
    const photo = document.getElementById('workerPhoto').value.trim();
    const email = document.getElementById('workerEmail').value.trim();
    const phone = document.getElementById('workerPhone').value.trim();

    let isValid = true;

    if (!validateName(name)) {
        showError('workerName','errorName','Nom invalide (lettres seulement, min 3 caractères).');
        isValid = false;
    } else showError('workerName','errorName','');

    if (!validateEmail(email)) {
        showError('workerEmail','errorEmail','Email invalide.');
        isValid = false;
    } else showError('workerEmail','errorEmail','');

    if (!validatePhone(phone)) {
        showError('workerPhone','errorPhone','Téléphone invalide (8 à 15 chiffres).');
        isValid = false;
    } else showError('workerPhone','errorPhone','');

    if (!validatePhoto(photo)) {
        showError('workerPhoto','errorPhoto','URL d\'image invalide (jpg|png|gif|webp...).');
        isValid = false;
    } else showError('workerPhoto','errorPhoto','');

    if (!role) {
        alert('Veuillez choisir un rôle.');
        isValid = false;
    }

    if (!isValid) return;

    const expNodes = Array.from(document.querySelectorAll('.experience-item'));
    const experiences = [];
    let experiencesAreValid = true;

    for (const item of expNodes) {
        const positionInput = item.querySelector('.exp-position');
        const startInput = item.querySelector('.exp-start');
        const endInput = item.querySelector('.exp-end');
        const errorP = item.querySelector('.exp-error');

        if (errorP) { errorP.style.display = 'none'; errorP.textContent = ''; }

        const position = positionInput ? positionInput.value.trim() : '';
        const startVal = startInput ? startInput.value.trim() : '';
        const endVal = endInput ? endInput.value.trim() : '';

        if (!position) {
            if (errorP) { errorP.textContent = 'Le poste est requis.'; errorP.style.display = 'block'; }
            experiencesAreValid = false;
            continue;
        }
        if (!startVal) {
            if (errorP) { errorP.textContent = 'La date de début est requise.'; errorP.style.display = 'block'; }
            experiencesAreValid = false;
            continue;
        }

        if (!isStartBeforeOrEqualEnd(startVal, endVal)) {
            if (errorP) { errorP.textContent = 'La date de début doit être antérieure ou égale à la date de fin.'; errorP.style.display = 'block'; }
            experiencesAreValid = false;
            continue;
        }

        experiences.push({
            position: position,
            start: startVal,
            end: endVal || null
        });
    }

    if (!experiencesAreValid) {
        const expSection = document.getElementById('experiencesList');
        if (expSection) expSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Create worker object and save
    const worker = {
        id: nextWorkerId++,
        name,
        role,
        photo: photo || '',
        email,
        phone,
        experiences,
        zone: null
    };

    workers.push(worker);
    saveToStorage();
    renderAll();
    updateRequiredZones();
    closeAddModal();
}

// ZONE / ASSIGN 
function canAssignToZone(worker, zone) {
    const allowed = ROLE_RESTRICTIONS[worker.role] || [];
    return allowed.includes(zone);
}

function getEligibleWorkers(zone) {
    return workers.filter(w => !w.zone && canAssignToZone(w, zone));
}

function openZoneSelector(zone) {
    const eligibleWorkers = getEligibleWorkers(zone);
    const zoneData = ZONE_CONFIG[zone];
    const currentCount = workers.filter(w => w.zone === zone).length;

    if (currentCount >= zoneData.limit) {
        alert(`La limite de ${zoneData.limit} employés est atteinte pour cette zone.`);
        return;
    }
    if (eligibleWorkers.length === 0) {
        alert('Aucun employé disponible pour cette zone.');
        return;
    }

    document.getElementById('zoneSelectorTitle').textContent = `Sélectionner un employé - ${zoneData.name}`;
    const listContainer = document.getElementById('zoneSelectorList');
    listContainer.innerHTML = eligibleWorkers.map(worker => `
        <div class="pronalinfo" style="cursor:pointer; margin-bottom:10px;" onclick="selectWorkerForZone(${worker.id}, '${zone}')">
            <img src="${escapeHtml(worker.photo || '')}" alt="${escapeHtml(worker.name)}" onerror="handleImageError(this)">
            <div class="info"><h1>${escapeHtml(worker.name)}</h1><p>${escapeHtml(worker.role)}</p></div>
        </div>
    `).join('');

    document.getElementById('zoneSelectorModal').classList.add('active');
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('active');
}

function selectWorkerForZone(workerId, zone) {
    assignWorkerToZone(workerId, zone);
    closeZoneSelector();
}

function closeZoneSelector() {
    document.getElementById('zoneSelectorModal').classList.remove('active');
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function assignWorkerToZone(workerId, zone) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const zoneData = ZONE_CONFIG[zone];
    const currentCount = workers.filter(w => w.zone === zone).length;

    if (currentCount >= zoneData.limit) {
        alert(`La limite de ${zoneData.limit} employés est atteinte.`);
        return;
    }
    if (!canAssignToZone(worker, zone)) {
        alert(`${worker.name} ne peut pas être assigné à cette zone.`);
        return;
    }

    worker.zone = zone;
    saveToStorage();
    renderAll();
    updateRequiredZones();
}

function removeWorkerFromZone(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    worker.zone = null;
    saveToStorage();
    renderAll();
    updateRequiredZones();
}

//  RENDER 
function renderAll() {
    renderUnassignedWorkers();
    renderZoneWorkers();
    updateZoneButtons();
    updateZoneCounters();
    initializeDragAndDrop(); 
}

function renderUnassignedWorkers() {
    const container = document.getElementById('persolist');
    const unassigned = workers.filter(w => !w.zone);

    if (unassigned.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>Aucun personnel non assigné</p></div>';
        return;
    }

    container.innerHTML = unassigned.map(worker => {
        const photoHtml = worker.photo 
            ? `<img src="${escapeHtml(worker.photo)}" alt="${escapeHtml(worker.name)}" class="worker-photo-sidebar" onerror="this.outerHTML='<div class=\\'default-avatar-sidebar\\'>👤</div>';">`
            : `<div class="default-avatar-sidebar">👤</div>`;
        
        return `
            <div class="pronalinfo" data-worker-id="${worker.id}" onclick="showWorkerProfile(${worker.id})">
                ${photoHtml}
                <div class="info"><h1>${escapeHtml(worker.name)}</h1><p>${escapeHtml(worker.role)}</p></div>
            </div>
        `;
    }).join('');
}

function renderZoneWorkers() {
    ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'].forEach(zone => {
        const container = document.getElementById(`${zone}list`);
        const zoneWorkers = workers.filter(w => w.zone === zone);
        container.innerHTML = zoneWorkers.map(worker => {
            const photoHtml = worker.photo 
                ? `<img src="${escapeHtml(worker.photo)}" alt="${escapeHtml(worker.name)}" class="worker-photo" onerror="this.outerHTML='<div class=\\'default-avatar\\'>👤</div>';">`
                : `<div class="default-avatar">👤</div>`;
            
            return `
                <div class="pronalinfor" data-worker-id="${worker.id}" onclick="showWorkerProfile(${worker.id})">
                    <button class="remove-from-zone" onclick="event.stopPropagation(); removeWorkerFromZone(${worker.id})" title="Retirer">×</button>
                    ${photoHtml}
                    <div class="info"><h1>${escapeHtml(worker.name)}</h1><p>${escapeHtml(worker.role)}</p></div>
                </div>
            `;
        }).join('');
    });
}
function updateZoneButtons() {
    Object.keys(ZONE_CONFIG).forEach(zone => {
        const btn = document.querySelector(`.plusbtn[data-zone="${zone}"]`);
        if (!btn) return;
        const zoneData = ZONE_CONFIG[zone];
        const currentCount = workers.filter(w => w.zone === zone).length;
        const eligibleCount = getEligibleWorkers(zone).length;

        if (currentCount >= zoneData.limit || eligibleCount === 0) btn.classList.add('disabled');
        else btn.classList.remove('disabled');
    });
}

function updateZoneCounters() {
    Object.keys(ZONE_CONFIG).forEach(zone => {
        const zoneElement = document.querySelector(`.${zone}`);
        if (!zoneElement) return;
        const currentCount = workers.filter(w => w.zone === zone).length;
        const zoneData = ZONE_CONFIG[zone];

        const old = zoneElement.querySelector('.zone-counter');
        if (old) old.remove();

        if (currentCount > 0) {
            const counter = document.createElement('div');
            counter.className = 'zone-counter';
            counter.textContent = `${currentCount}/${zoneData.limit}`;
            zoneElement.appendChild(counter);
        }

        if (currentCount >= zoneData.limit) zoneElement.classList.add('zone-limit-reached');
        else zoneElement.classList.remove('zone-limit-reached');
    });
}

function updateRequiredZones() {
    Object.keys(ZONE_CONFIG).forEach(zone => {
        const zoneData = ZONE_CONFIG[zone];
        const zoneElement = document.querySelector(`.${zone}`);
        if (!zoneElement) return;
        const currentCount = workers.filter(w => w.zone === zone).length;
        if (zoneData.required && currentCount === 0) zoneElement.classList.add('empty-required');
        else zoneElement.classList.remove('empty-required');
    });
}

//  DRAG & DROP 
function initializeDragAndDrop() {

    const zones = ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'];

    zones.forEach(zone => {
        const zoneElement = document.querySelector(`.${zone}`);
        if (!zoneElement) return;

        zoneElement.classList.remove('drag-over');

        zoneElement.ondragover = (e) => {
            e.preventDefault();
            if (draggedWorker && canAssignToZone(draggedWorker, zone)) {
                const zoneData = ZONE_CONFIG[zone];
                const currentCount = workers.filter(w => w.zone === zone).length;
                if (currentCount < zoneData.limit) zoneElement.classList.add('drag-over');
            }
        };
        zoneElement.ondragleave = (e) => {
            e.preventDefault();
            zoneElement.classList.remove('drag-over');
        };
        zoneElement.ondrop = (e) => {
            e.preventDefault();
            zoneElement.classList.remove('drag-over');
            if (!draggedWorker) return;

            const zoneData = ZONE_CONFIG[zone];
            const currentCount = workers.filter(w => w.zone === zone).length;
            if (currentCount >= zoneData.limit) {
                alert(`La limite de ${zoneData.limit} employés est atteinte pour cette zone.`);
                return;
            }
            if (!canAssignToZone(draggedWorker, zone)) {
                alert(`${draggedWorker.name} ne peut pas être assigné à cette zone.`);
                return;
            }

            draggedWorker.zone = zone;
            saveToStorage();
            renderAll();
            updateRequiredZones();
        };
    });

    const sidebar = document.getElementById('persolist');
    if (sidebar) {
        sidebar.ondragover = (e) => { e.preventDefault(); sidebar.style.background = '#f0f8ff'; };
        sidebar.ondragleave = (e) => { e.preventDefault(); sidebar.style.background = ''; };
        sidebar.ondrop = (e) => {
            e.preventDefault();
            sidebar.style.background = '';
            if (draggedWorker && draggedWorker.zone) {
                draggedWorker.zone = null;
                saveToStorage();
                renderAll();
                updateRequiredZones();
            }
        };
    }

    document.querySelectorAll('.pronalinfo, .pronalinfor').forEach(el => {
        el.setAttribute('draggable', 'true');

        el.ondragstart = (e) => {
            const workerId = parseInt(e.currentTarget.getAttribute('data-worker-id'));
            draggedWorker = workers.find(w => w.id === workerId);
            e.currentTarget.style.opacity = '0.5';
        };

        el.ondragend = (e) => {
            e.currentTarget.style.opacity = '1';
            draggedWorker = null;
        };
    });
}

// HELPERS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// GLOBALS FOR INLINE HANDLERS 
window.showWorkerProfile = showWorkerProfile;
window.removeWorkerFromZone = removeWorkerFromZone;
window.selectWorkerForZone = selectWorkerForZone;
window.handleImageError = handleImageError;
window.handleProfileImageError = handleProfileImageError;