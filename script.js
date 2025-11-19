
// Configuration des zones et restrictions
const ZONE_CONFIG = {
    conference: { name: 'Salle de conférence', limit: 10, required: false },
    reception: { name: 'Réception', limit: 2, required: true },
    serveurs: { name: 'Salle des serveurs', limit: 3, required: true },
    securite: { name: 'Salle de sécurité', limit: 2, required: true },
    personnel: { name: 'Salle du personnel', limit: 15, required: false },
    archives: { name: 'Salle d\'archives', limit: 2, required: true }
};

// Restrictions par rôle
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

// État de l'application
let workers = [];
let nextWorkerId = 1;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initializeEventListeners();
    renderAll();
    updateRequiredZones();
    initializeDragAndDrop(); // NOUVEAU
});

// Écouteurs d'événements
function initializeEventListeners() {
    // Bouton ajouter employé
    document.getElementById('validation').addEventListener('click', openAddModal);
    
    // Fermeture modales
    document.getElementById('closeModal').addEventListener('click', closeAddModal);
    document.getElementById('closeProfileModal').addEventListener('click', closeProfileModal);
    document.getElementById('closeZoneSelector').addEventListener('click', closeZoneSelector);
    
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            closeAddModal();
            closeProfileModal();
            closeZoneSelector();
        });
    }
    
    // Formulaire d'ajout
    document.getElementById('addWorkerForm').addEventListener('submit', handleAddWorker);
    
    // Prévisualisation photo
    document.getElementById('workerPhoto').addEventListener('input', updatePhotoPreview);
    
    // Bouton ajouter expérience
    document.getElementById('addExperienceBtn').addEventListener('click', addExperienceField);
    
    // Boutons + des zones
    document.querySelectorAll('.plusbtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const zone = e.target.dataset.zone;
            openZoneSelector(zone);
        });
    });
}

// Gestion du stockage localStorage
function saveToStorage() {
    localStorage.setItem('workSphereData', JSON.stringify({
        workers: workers,
        nextWorkerId: nextWorkerId
    }));
}

function loadFromStorage() {
    const saved = localStorage.getItem('workSphereData');
    if (saved) {
        const data = JSON.parse(saved);
        workers = data.workers || [];
        nextWorkerId = data.nextWorkerId || 1;
    }
}

// Modale d'ajout
function openAddModal() {
    document.getElementById('validationForm').classList.add('active');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.add('active');
    document.getElementById('addWorkerForm').reset();
    document.getElementById('experiencesList').innerHTML = '';
    document.getElementById('profileimg').classList.remove('active');
}

function closeAddModal() {
    document.getElementById('validationForm').classList.remove('active');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
}

// Prévisualisation photo
function updatePhotoPreview() {
    const url = document.getElementById('workerPhoto').value;
    const img = document.getElementById('profileimg');
    if (url) {
        img.src = url;
        img.classList.add('active');
        img.onerror = () => {
            img.classList.remove('active');
        };
    } else {
        img.classList.remove('active');
    }
}

// Gestion des expériences
function addExperienceField() {
    const container = document.getElementById('experiencesList');
    const div = document.createElement('div');
    div.className = 'experience-item';
    div.innerHTML = `
        <input type="text" placeholder="Poste / Entreprise" required>
        <input type="text" placeholder="Période (ex: 2020-2022)" required>
        <button type="button" class="remove-experience-btn">×</button>
    `;
    div.querySelector('.remove-experience-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
}

// Ajout d'un employé
function handleAddWorker(e) {
    e.preventDefault();
    
    const name = document.getElementById('workerName').value.trim();
    const role = document.getElementById('workerRole').value;
    const photo = document.getElementById('workerPhoto').value.trim();
    const email = document.getElementById('workerEmail').value.trim();
    const phone = document.getElementById('workerPhone').value.trim();
    
    // Récupération des expériences
    const experiences = [];
    document.querySelectorAll('.experience-item').forEach(item => {
        const inputs = item.querySelectorAll('input');
        if (inputs[0].value && inputs[1].value) {
            experiences.push({
                position: inputs[0].value.trim(),
                period: inputs[1].value.trim()
            });
        }
    });
    
    const worker = {
        id: nextWorkerId++,
        name: name,
        role: role,
        photo: photo || '',
        email: email,
        phone: phone,
        experiences: experiences,
        zone: null
    };
    
    workers.push(worker);
    saveToStorage();
    renderAll();
    updateRequiredZones();
    closeAddModal();
}

// Vérifier si un employé peut être dans une zone
function canAssignToZone(worker, zone) {
    const allowedZones = ROLE_RESTRICTIONS[worker.role] || [];
    return allowedZones.includes(zone);
}

// Obtenir les employés éligibles pour une zone
function getEligibleWorkers(zone) {
    return workers.filter(w => !w.zone && canAssignToZone(w, zone));
}

// Ouvrir le sélecteur de zone
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
    
    // Afficher la modale de sélection
    document.getElementById('zoneSelectorTitle').textContent = `Sélectionner un employé - ${zoneData.name}`;
    const listContainer = document.getElementById('zoneSelectorList');
    
    listContainer.innerHTML = eligibleWorkers.map(worker => `
        <div class="pronalinfo" style="cursor: pointer; margin-bottom: 10px;" onclick="selectWorkerForZone(${worker.id}, '${zone}')">
            <img src="${worker.photo || ''}" alt="${worker.name}" onerror="handleImageError(this)">
            <div class="info">
                <h1>${worker.name}</h1>
                <p>${worker.role}</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('zoneSelectorModal').classList.add('active');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.add('active');
}

function selectWorkerForZone(workerId, zone) {
    assignWorkerToZone(workerId, zone);
    closeZoneSelector();
}

function closeZoneSelector() {
    document.getElementById('zoneSelectorModal').classList.remove('active');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
}

// Assigner un employé à une zone
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

// Retirer un employé d'une zone
function removeWorkerFromZone(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
        worker.zone = null;
        saveToStorage();
        renderAll();
        updateRequiredZones();
    }
}

// Afficher le profil d'un employé
function showWorkerProfile(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    const zoneName = worker.zone ? ZONE_CONFIG[worker.zone].name : 'Non assigné';
    
    const experiencesHtml = worker.experiences.length > 0
        ? worker.experiences.map(exp => `
            <div class="experience-item-profile">
                <strong>${exp.position}</strong>
                <span>${exp.period}</span>
            </div>
        `).join('')
        : '<p style="color: #999; text-align: center;">Aucune expérience</p>';
    
    const photoHtml = worker.photo 
        ? `<img src="${worker.photo}" alt="${worker.name}" class="profile-photo" onerror="handleProfileImageError(this)">`
        : `<div class="profile-photo" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 60px;">👤</div>`;
    
    document.getElementById('profileContent').innerHTML = `
        ${photoHtml}
        <div class="profile-name">${worker.name}</div>
        <div class="profile-role">${worker.role}</div>
        <div class="profile-info">
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${worker.email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Téléphone:</span>
                <span class="info-value">${worker.phone}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Localisation:</span>
                <span class="info-value">${zoneName}</span>
            </div>
            <div class="experience-list">
                <h3 style="margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; font-size: 14px;">Expériences</h3>
                ${experiencesHtml}
            </div>
        </div>
    `;
    
    document.getElementById('profileModal').classList.add('active');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
}
