
//  CONFIG
const ZONE_CONFIG = {
    conference: { name: 'Salle de conférence', required: false },
    reception: { name: 'Réception', required: true },
    serveurs: { name: 'Salle des serveurs', required: true },
    securite: { name: 'Salle de sécurité', required: true },
    personnel: { name: 'Salle du personnel', required: false },
    archives: { name: "Salle d'archives", required: true }
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

let workers = [];
let nextWorkerId = 1;
let draggedWorker = null;

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initializeEventListeners();
    renderAll();
    updateRequiredZones();
});

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
            console.warn('Erreur parse storage', err);
            workers = [];
            nextWorkerId = 1;
        }
    }
}

function initializeEventListeners() {
    document.getElementById('validation').addEventListener('click', openAddModal);
    document.getElementById('closeModal').addEventListener('click', closeAddModal);
    document.getElementById('closeProfileModal').addEventListener('click', closeProfileModal);
    document.getElementById('closeZoneSelector').addEventListener('click', closeZoneSelector);
    
    document.getElementById('modalOverlay').addEventListener('click', () => {
        closeAddModal();
        closeProfileModal();
        closeZoneSelector();
    });

    document.getElementById('addWorkerForm').addEventListener('submit', handleAddWorker);
    document.getElementById('workerPhoto').addEventListener('input', updatePhotoPreview);
    document.getElementById('addExperienceBtn').addEventListener('click', addExperienceField);

    document.querySelectorAll('.plusbtn').forEach(btn => {
        btn.addEventListener('click', (e) => openZoneSelector(e.currentTarget.dataset.zone));
    });

    document.getElementById('workerName').addEventListener('input', (e) => {
        showError('workerName', 'errorName', validateName(e.target.value.trim()) ? '' : 'Nom invalide (min 3 lettres).');
    });

    document.getElementById('workerEmail').addEventListener('input', (e) => {
        showError('workerEmail', 'errorEmail', validateEmail(e.target.value.trim()) ? '' : 'Email invalide.');
    });

    document.getElementById('workerPhone').addEventListener('input', (e) => {
        showError('workerPhone', 'errorPhone', validatePhone(e.target.value.trim()) ? '' : 'Téléphone invalide.');
    });

    document.getElementById('workerPhoto').addEventListener('input', (e) => {
        showError('workerPhoto', 'errorPhoto', validatePhoto(e.target.value.trim()) ? '' : 'URL d\'image invalide.');
    });
}

function openAddModal() {
    document.getElementById('validationForm').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('addWorkerForm').reset();
    document.getElementById('experiencesList').innerHTML = '';
    document.getElementById('profileimg').classList.remove('active');

    // Reset form title and handler
    document.querySelector('#validationForm .btncancel h1').textContent = 'Ajouter un Employé';
    const form = document.getElementById('addWorkerForm');
    form.onsubmit = handleAddWorker;

    ['errorName','errorEmail','errorPhone','errorPhoto'].forEach(id => {
        const el = document.getElementById(id);
        el.textContent = '';
        el.classList.add('hidden');
    });
}

function closeAddModal() {
    document.getElementById('validationForm').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
    
    // Reset form title and handler to default
    document.querySelector('#validationForm .btncancel h1').textContent = 'Ajouter un Employé';
    const form = document.getElementById('addWorkerForm');
    form.onsubmit = handleAddWorker;
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
        <button onclick="openEditModal(${workerId})" class="edit-profile-btn">
            MODIFIER
        </button>
    `;

    document.getElementById('profileModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function openEditModal(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    closeProfileModal();

    document.getElementById('validationForm').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');

    document.querySelector('#validationForm .btncancel h1').textContent = 'Modifier un Employé';
    
    document.getElementById('workerName').value = worker.name;
    document.getElementById('workerRole').value = worker.role;
    document.getElementById('workerPhoto').value = worker.photo || '';
    document.getElementById('workerEmail').value = worker.email;
    document.getElementById('workerPhone').value = worker.phone;

    if (worker.photo) {
        const img = document.getElementById('profileimg');
        img.src = worker.photo;
        img.classList.add('active');
    }

    const expList = document.getElementById('experiencesList');
    expList.innerHTML = '';
    if (worker.experiences && worker.experiences.length > 0) {
        worker.experiences.forEach(exp => {
            addExperienceField();
            const lastExp = expList.lastElementChild;
            lastExp.querySelector('.exp-position').value = exp.position;
            lastExp.querySelector('.exp-start').value = exp.start;
            lastExp.querySelector('.exp-end').value = exp.end || '';
        });
    }

    const form = document.getElementById('addWorkerForm');
    form.onsubmit = (e) => handleEditWorker(e, workerId);
}

function handleEditWorker(e, workerId) {
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

    const experiences = [];
    let experiencesAreValid = true;

    document.querySelectorAll('.experience-item').forEach(item => {
        const position = item.querySelector('.exp-position').value.trim();
        const startVal = item.querySelector('.exp-start').value.trim();
        const endVal = item.querySelector('.exp-end').value.trim();
        const errorP = item.querySelector('.exp-error');

        errorP.style.display = 'none';

        if (!position) {
            errorP.textContent = 'Le poste est requis.';
            errorP.style.display = 'block';
            experiencesAreValid = false;
            return;
        }
        if (!startVal) {
            errorP.textContent = 'La date de début est requise.';
            errorP.style.display = 'block';
            experiencesAreValid = false;
            return;
        }
        if (!isStartBeforeOrEqualEnd(startVal, endVal)) {
            errorP.textContent = 'La date de début doit être antérieure ou égale à la date de fin.';
            errorP.style.display = 'block';
            experiencesAreValid = false;
            return;
        }

        experiences.push({ position, start: startVal, end: endVal || null });
    });

    if (!experiencesAreValid) return;

    const worker = workers.find(w => w.id === workerId);
    if (worker) {
        // Keep the zone when editing
        const currentZone = worker.zone;
        
        worker.name = name;
        worker.role = role;
        worker.photo = photo || '';
        worker.email = email;
        worker.phone = phone;
        worker.experiences = experiences;
        worker.zone = currentZone;

        saveToStorage();
        renderAll();
        closeAddModal();
    }
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
}

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

function addExperienceField() {
    const container = document.getElementById('experiencesList');
    const div = document.createElement('div');
    div.className = 'experience-item';
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
    
    div.querySelector('.remove-experience-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);

    const startInput = div.querySelector('.exp-start');
    const endInput = div.querySelector('.exp-end');
    const errorP = div.querySelector('.exp-error');

    const checkDates = () => {
        errorP.style.display = 'none';
        if (startInput.value && endInput.value && !isStartBeforeOrEqualEnd(startInput.value, endInput.value)) {
            errorP.textContent = 'La date de début doit être antérieure ou égale à la date de fin.';
            errorP.style.display = 'block';
        }
    };

    startInput.addEventListener('input', checkDates);
    endInput.addEventListener('input', checkDates);
}

function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

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
    return /^[A-Za-zÀ-ÿ\s'-]{3,50}$/.test(name);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^\+?[0-9]{8,15}$/.test(phone);
}

function validatePhoto(url) {
    if (!url) return true;
    return /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp))$/i.test(url);
}

function isStartBeforeOrEqualEnd(startValue, endValue) {
    if (!startValue) return false;
    if (!endValue) return true;

    const [sY, sM] = startValue.split('-').map(Number);
    const [eY, eM] = endValue.split('-').map(Number);

    if (sY < eY) return true;
    if (sY > eY) return false;
    return sM <= eM;
}

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

    const experiences = [];
    let experiencesAreValid = true;

    document.querySelectorAll('.experience-item').forEach(item => {
        const position = item.querySelector('.exp-position').value.trim();
        const startVal = item.querySelector('.exp-start').value.trim();
        const endVal = item.querySelector('.exp-end').value.trim();
        const errorP = item.querySelector('.exp-error');

        errorP.style.display = 'none';

        if (!position) {
            errorP.textContent = 'Le poste est requis.';
            errorP.style.display = 'block';
            experiencesAreValid = false;
            return;
        }
        if (!startVal) {
            errorP.textContent = 'La date de début est requise.';
            errorP.style.display = 'block';
            experiencesAreValid = false;
            return;
        }
        if (!isStartBeforeOrEqualEnd(startVal, endVal)) {
            errorP.textContent = 'La date de début doit être antérieure ou égale à la date de fin.';
            errorP.style.display = 'block';
            experiencesAreValid = false;
            return;
        }

        experiences.push({ position, start: startVal, end: endVal || null });
    });

    if (!experiencesAreValid) return;

    workers.push({
        id: nextWorkerId++,
        name,
        role,
        photo: photo || '',
        email,
        phone,
        experiences,
        zone: null
    });

    saveToStorage();
    renderAll();
    updateRequiredZones();
    closeAddModal();
}

function canAssignToZone(worker, zone) {
    return (ROLE_RESTRICTIONS[worker.role] || []).includes(zone);
}

function getEligibleWorkers(zone) {
    return workers.filter(w => !w.zone && canAssignToZone(w, zone));
}

function openZoneSelector(zone) {
    const eligibleWorkers = getEligibleWorkers(zone);

    if (eligibleWorkers.length === 0) {
        alert('Aucun employé disponible pour cette zone.');
        return;
    }

    document.getElementById('zoneSelectorTitle').textContent = `Sélectionner un employé - ${ZONE_CONFIG[zone].name}`;
    document.getElementById('zoneSelectorList').innerHTML = eligibleWorkers.map(worker => {
        const photoHtml = worker.photo 
            ? `<img src="${escapeHtml(worker.photo)}" alt="${escapeHtml(worker.name)}" class="worker-photo-sidebar" onerror="this.outerHTML='<div class=\\'default-avatar-sidebar\\'>👤</div>';">`
            : `<div class="default-avatar-sidebar">👤</div>`;
        
        return `
            <div class="pronalinfo" style="cursor:pointer; margin-bottom:10px;" onclick="selectWorkerForZone(${worker.id}, '${zone}')">
                ${photoHtml}
                <div class="info"><h1>${escapeHtml(worker.name)}</h1><p>${escapeHtml(worker.role)}</p></div>
            </div>
        `;
    }).join('');

    document.getElementById('zoneSelectorModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function selectWorkerForZone(workerId, zone) {
    assignWorkerToZone(workerId, zone);
    closeZoneSelector();
}

function closeZoneSelector() {
    document.getElementById('zoneSelectorModal').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
}

function assignWorkerToZone(workerId, zone) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

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
        if (getEligibleWorkers(zone).length === 0) btn.classList.add('disabled');
        else btn.classList.remove('disabled');
    });
}

function updateZoneCounters() {
    Object.keys(ZONE_CONFIG).forEach(zone => {
        const zoneElement = document.querySelector(`.${zone}`);
        const currentCount = workers.filter(w => w.zone === zone).length;

        const old = zoneElement.querySelector('.zone-counter');
        if (old) old.remove();

        if (currentCount > 0) {
            const counter = document.createElement('div');
            counter.className = 'zone-counter';
            counter.textContent = `${currentCount}`;
            zoneElement.appendChild(counter);
        }
    });
}

function updateRequiredZones() {
    Object.keys(ZONE_CONFIG).forEach(zone => {
        const zoneData = ZONE_CONFIG[zone];
        const zoneElement = document.querySelector(`.${zone}`);
        const currentCount = workers.filter(w => w.zone === zone).length;
        
        if (zoneData.required && currentCount === 0) zoneElement.classList.add('empty-required');
        else zoneElement.classList.remove('empty-required');
    });
}

function initializeDragAndDrop() {
    ['conference', 'reception', 'serveurs', 'securite', 'personnel', 'archives'].forEach(zone => {
        const zoneElement = document.querySelector(`.${zone}`);
        zoneElement.classList.remove('drag-over');

        zoneElement.ondragover = (e) => {
            e.preventDefault();
            if (draggedWorker && canAssignToZone(draggedWorker, zone)) {
                zoneElement.classList.add('drag-over');
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

    document.querySelectorAll('.pronalinfo, .pronalinfor').forEach(el => {
        el.setAttribute('draggable', 'true');
        el.ondragstart = (e) => {
            draggedWorker = workers.find(w => w.id === parseInt(e.currentTarget.getAttribute('data-worker-id')));
            e.currentTarget.style.opacity = '0.5';
        };
        el.ondragend = (e) => {
            e.currentTarget.style.opacity = '1';
            draggedWorker = null;
        };
    });
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.showWorkerProfile = showWorkerProfile;
window.openEditModal = openEditModal;
window.removeWorkerFromZone = removeWorkerFromZone;
window.selectWorkerForZone = selectWorkerForZone;
window.handleImageError = handleImageError;
window.handleProfileImageError = handleProfileImageError;