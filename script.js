// SELECTORS
const modals = document.querySelectorAll('.modal');
const addBtn = document.getElementById('add-worker-btn');
const closemodal = document.querySelectorAll('.close-Modal-btn');
const addForum = document.getElementById('addForum');
const detailsmodal = document.getElementById('details-model');
const workerForm = addForum.querySelector('form');
const unassignedList = document.getElementById('unassigned-list');
const rooms = document.querySelectorAll('.room');
const countSpan = document.getElementById('unassigned-count');
const expContainer = document.querySelector('.exp-container');
const expItem = document.querySelector('.exp-item');
const addExpBtn = document.getElementById('add-exp-btn');
const previewimg = document.getElementById('previewimg');
const imgUrl = document.getElementById('img-url');
const assigncontainer = document.querySelector('.assign');
const addroombtn = document.querySelectorAll('.add-room-btn');
const addmodal = document.getElementById('add-modal');
const search = document.getElementById('Search');
const filterRole = document.getElementById('filterRole');

//ZONE PERMISSIONS & LIMITS
const zonePermissions = {
    "conference": ["Manager","Réceptionnistes","Techniciens IT","Agents de sécurité","Nettoyage","Autres rôles"],
    "personnel": ["Manager","Réceptionnistes","Techniciens IT","Agents de sécurité","Nettoyage","Autres rôles"],
    "servers": ["Techniciens IT","Manager","Nettoyage"],
    "security": ["Agents de sécurité","Manager","Nettoyage"],
    "Réception": ["Réceptionnistes","Manager","Nettoyage","Autres rôles"],
    "archive": ["Manager","Réceptionnistes","Techniciens IT","Agents de sécurité"]
};
const zonelimit = {
    "conference": 6,
    "personnel": 3,
    "servers": 3,
    "security": 3,
    "Réception": 10,
    "archive": 2
};

//LOAD DATA
let workersData = JSON.parse(localStorage.getItem('workSphereData')) || { nextWorkerId:1, workers:[] };
DisplayStaff(workersData.workers);

//FUNCTIONS

// Display staff in sidebar
function DisplayStaff(workersArray){
    unassignedList.innerHTML = '';
    const unassigned = workersArray.filter(staff => !staff.zone);
    unassigned.forEach(staff=>{
        const stafItem = document.createElement('div');
        stafItem.addEventListener('click',()=>{ detailsmodal.classList.remove('hidden'); showData(staff); });
        stafItem.classList.add('Member','w-full','shadow-md','rounded-lg','flex','justify-between','bg-gray-200');
        stafItem.innerHTML = `
            <div class="flex">
                <img src="${staff.photo||'img/Profil.jpg'}" class="rounded-full w-8 h-8 m-2 md:m-3 md:w-14 md:h-14 object-cover">
                <h3 class="font-bold text-xs md:text-lg mt-1 md:mt-3 md:ml-4">${staff.name} <br> 
                    <span class="md:text-[.8rem] text-gray-400">${staff.role}</span>
                </h3>
            </div>`;
        unassignedList.appendChild(stafItem);
    });
    countSpan.textContent = unassigned.length;
}

// Show details modal
function showData(staff){
    const img = detailsmodal.querySelector('img');
    const name = detailsmodal.querySelector('.name');
    const email = detailsmodal.querySelector('.email');
    const role = detailsmodal.querySelector('.role');
    const phone = detailsmodal.querySelector('.phone');
    const place = detailsmodal.querySelector('.Actual-place');
    const Experience = detailsmodal.querySelector('.Experience');
    const deleteBtn = detailsmodal.querySelector('.Delete-btn');

    Experience.innerHTML = '';
    name.textContent = staff.name;
    email.textContent = staff.email;
    role.textContent = staff.role;
    phone.textContent = staff.phone;
    place.textContent = staff.zone || 'Non assigné';
    img.src = staff.photo || 'img/Profil.jpg';

    staff.experiences.forEach(exp=>{
        Experience.innerHTML += `<div>
            <p>Poste: <span>${exp.title}</span></p>
            <p>Entreprise: <span>${exp.entreprise}</span></p>
            <p>Start date: <span>${exp.startDate}</span></p>
            <p>End date: <span>${exp.endDate}</span></p><br>
        </div>`;
    });

    deleteBtn.onclick = ()=>deletestaff(staff);
}

// Validate form
function validateForm(formData){
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if(!nameRegex.test(formData.name)){ alert('Nom invalide'); return false; }
    if(!emailRegex.test(formData.email)){ alert('Email invalide'); return false; }
    if(!phoneRegex.test(formData.phone)){ alert('Numéro invalide'); return false; }

    for(let exp of formData.experiences){
        if(new Date(exp.startDate) >= new Date(exp.endDate)){
            alert('Date de début doit être antérieure à la date de fin');
            return false;
        }
    }
    return true;
}

// Add experience field
addExpBtn.addEventListener('click',()=>{
    const cloneExp = expItem.cloneNode(true);
    cloneExp.querySelectorAll('input').forEach(input=>input.value='');
    const count = expContainer.querySelectorAll('.exp-item').length +1;
    cloneExp.querySelector('h4').textContent = `Expérience ${count}`;
    cloneExp.querySelector('.remove-exp-btn').classList.remove('hidden');
    cloneExp.querySelector('.remove-exp-btn').onclick = ()=>cloneExp.remove();
    expContainer.appendChild(cloneExp);
});

// Add 
workerForm.addEventListener('submit', e=>{
    e.preventDefault();

    const experiences = [];
    expContainer.querySelectorAll('.exp-item').forEach(item=>{
        experiences.push({
            poste: item.querySelector('.exp-poste').value,
            entreprise: item.querySelector('.exp-entreprise').value,
            startDate: item.querySelector('.exp-start').value,
            endDate: item.querySelector('.exp-end').value
        });
    });

    const worker = {
        id: workersData.nextWorkerId,
        name: workerForm.querySelector('input[type="text"]').value,
        role: workerForm.querySelector('#Role').value,
        photo: imgUrl.value || 'img/Profil.jpg',
        email: workerForm.querySelector('input[type="email"]').value,
        phone: workerForm.querySelector('input[type="tel"]').value,
        experiences: experiences,
        zone: null
    };

    if(!validateForm(worker)) return;

    workersData.workers.push(worker);
    workersData.nextWorkerId++;

    addForum.classList.add('hidden');
    workerForm.reset();
    localStorage.setItem('workSphereData',JSON.stringify(workersData));
    DisplayStaff(workersData.workers);
});

//  MODALS 
modals.forEach(mdl=>mdl.addEventListener('click',e=>{
    if(e.target.classList.contains('modal')) mdl.classList.add('hidden');
}));
closemodal.forEach(close=>close.addEventListener('click',()=>{ close.closest('.modal').classList.add('hidden'); }));
addBtn.addEventListener('click',()=>addForum.classList.remove('hidden'));
imgUrl.addEventListener('change', e=> previewimg.src = e.target.value || 'img/Profil.jpg');

//SEARCH  
search.addEventListener('keyup', e=>{
    const val = search.value.toUpperCase();
    const filtered = workersData.workers.filter(w=>w.name.toUpperCase().includes(val));
    DisplayStaff(filtered);
});

//ROOM ASSIGNMENT
addroombtn.forEach(btn=>{
    btn.addEventListener('click', e=>{
        const roomName = btn.getAttribute('room-name');
        const room = btn.parentElement.querySelector('.room');
        addmodal.classList.remove('hidden');
        showWorker(roomName,room);
    });
});

function showWorker(roomName, room){
    assigncontainer.innerHTML = '';
    const roomLimit = zonelimit[roomName];
    if(room.childElementCount >= roomLimit){ alert(`Zone pleine (${roomLimit} max)`); addmodal.classList.add('hidden'); return; }

    const canAssign = workersData.workers.filter(w=> zonePermissions[roomName].includes(w.role) && !w.zone );
    canAssign.forEach(staff=>{
        const stafItem = document.createElement('div');
        stafItem.classList.add('Member','shadow-md','rounded-lg','flex','justify-between','bg-gray-200');
        stafItem.innerHTML = `
            <div class="flex">
                <img src="${staff.photo}" class="rounded-full w-8 h-8 m-2 md:m-3 md:w-14 md:h-14 object-cover">
                <h3 class="font-bold text-[.8rem] md:text-lg mt-1 md:mt-3 md:ml-4">${staff.name} <br>
                    <span class="md:text-[.8rem] text-gray-400">${staff.role}</span>
                </h3>
            </div>`;
        assigncontainer.appendChild(stafItem);

        stafItem.addEventListener('click', ()=>{
            if(room.childElementCount >= roomLimit){ alert(`Zone pleine (${roomLimit} max)`); return; }
            const roomItem = stafItem.cloneNode(true);
            roomItem.style.transform = "scale(0.8)";
            roomItem.innerHTML = `
                <div class="relative flex flex-col justify-center items-center p-2">
                    <img src="${staff.photo}" class="rounded-full w-6 h-6 md:w-14 md:h-14 object-cover">
                    <h3 class="font-bold text-sm text-center">${staff.name.split(' ')[0]} <br>
                        <span class="md:text-xs text-gray-400">${staff.role}</span>
                    </h3>
                    <button class="remove-staff absolute top-0 right-1 cursor-pointer text-red-500 text-lg">&times;</button>
                </div>`;
            room.appendChild(roomItem);
            staff.zone = roomName;
            localStorage.setItem('workSphereData', JSON.stringify(workersData));
            DisplayStaff(workersData.workers);
            addmodal.classList.add('hidden');

            roomItem.querySelector('.remove-staff').addEventListener('click', e=>{
                e.stopPropagation();
                roomItem.remove();
                staff.zone = null;
                localStorage.setItem('workSphereData', JSON.stringify(workersData));
                DisplayStaff(workersData.workers);
            });

            roomItem.addEventListener('click', ()=>{ detailsmodal.classList.remove('hidden'); showData(staff); });
        });
    });
}

//LOAD ASSIGNED WORKERS
function loadAssignedWorkers(){
    workersData.workers.forEach(staff=>{
        if(!staff.zone) return;
        const roomBtn = document.querySelector(`[room-name="${staff.zone}"]`);
        if(!roomBtn) return;
        const room = roomBtn.parentElement.querySelector('.room');
        const roomItem = document.createElement('div');
        roomItem.style.transform = "scale(0.8)";
        roomItem.innerHTML = `
            <div class="relative flex flex-col justify-center items-center p-2 bg-gray-200 rounded-xl">
                <img src="${staff.photo}" class="rounded-full w-6 h-6 md:w-14 md:h-14 object-cover">
                <h3 class="font-bold text-sm text-center">${staff.name.split(' ')[0]} <br>
                    <span class="md:text-xs text-gray-400">${staff.role}</span>
                </h3>
                <button class="remove-staff absolute top-0 right-1 cursor-pointer text-red-500 text-lg">&times;</button>
            </div>`;
        room.appendChild(roomItem);

        roomItem.querySelector('.remove-staff').addEventListener('click', e=>{
            e.stopPropagation();
            roomItem.remove();
            staff.zone = null;
            localStorage.setItem('workSphereData', JSON.stringify(workersData));
            DisplayStaff(workersData.workers);
        });

        roomItem.addEventListener('click', ()=>{ detailsmodal.classList.remove('hidden'); showData(staff); });
    });
}
loadAssignedWorkers();