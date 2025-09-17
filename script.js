// script.js (FINAL VERSION with Plan A implemented)
// --- Configuration ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvl5lYY1LssljDNJJyGuAGsLd3D0sbGSs4QTZxgz2PAZJ38EpsHzEk740LGiQ5AMok/exec";
let allActivities = [];
const currentDate = new Date();

let staffData = [];

const localProfileImages = { '盧英云': '盧英云.png', '陳詩芸': '陳詩芸.jpg', '楊宜婷': '楊宜婷.png','黃惠津': '黃惠津.png','王嬿茹': '王嬿茹.png','侯昱瑾': '侯昱瑾.png','高瑞穗': '高瑞穗.png','林盟淦': '林盟淦.png','吳曉琪': '吳曉琪.png','許淑怡': '許淑怡.png','林汶秀': '林汶秀.png','林淑雅': '林淑雅.png','廖家德': '廖家德.jpg','劉雯': '劉雯.jpg','楊依玲': '楊依玲.png','李迎真': '李迎真.png','蔡長志': '蔡長志.png','郭妍伶': '郭妍伶.png'};

const groupData = {
    'teaching-center': '教學中心', 'fdc': '教師培育中心', 'resident': '住院醫師訓練小組',
    'clerk': '實習醫學生訓練小組', 'pgy': 'PGY訓練組', 'csc': '臨床技能中心',
    'allied-health': '醫事人員訓練小組', 'chart-review': '病歷審查小組'
};

// --- State Variables ---
let currentUnitFilter = 'all'; 
let currentGroupFilter = 'all';
let currentStatusFilter = 'all';
let currentMemberFilter = 'all';
let currentYearFilter = 'all';
let currentMonthFilter = 'all';
let currentSearchTerm = '';
let calendarDate = new Date();

// --- Helper Functions ---
const getStatusColor = (status) => ({ completed: 'bg-green-500', active: 'bg-purple-500', overdue: 'bg-red-500', planning: 'bg-yellow-500' }[status] || 'bg-gray-500');
const getStatusText = (status) => ({ completed: '已完成', active: '進行中', overdue: '逾期', planning: '規劃中' }[status] || '未知');
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('zh-TW') : '';
const getTypeText = (type) => ({ project: '專案', task: '任務', activity: '活動', meeting: '會議' }[type] || '項目');
const getTypeStyle = (type, status) => {
    switch(type) {
        case 'project': return 'text-blue-700';
        case 'task': return 'text-green-700';
        case 'activity': return 'text-purple-700';
        case 'meeting': return status === 'completed' ? 'text-gray-400' : 'text-indigo-700';
        default: return 'text-gray-500';
    }
};

// --- Rendering Functions ---
function renderUnitTabs() {
    const tabsContainer = document.getElementById('unitTabs');
    if (!staffData || staffData.length === 0) return;

    const units = ['all', ...new Set(staffData.map(s => s.unit).filter(Boolean))];
    
    tabsContainer.innerHTML = units.map(unit => {
        const unitName = unit === 'all' ? '全部單位' : unit;
        return `<button onclick="filterByUnit('${unit}')" id="tab-unit-${unit}" class="unit-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${unit === currentUnitFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">${unitName}</button>`;
    }).join('');
}

function renderGroupTabs(membersToConsider) {
    const tabsContainer = document.getElementById('groupTabs');
    const groups = [...new Set(membersToConsider.map(s => s.group).filter(Boolean))];

    if (groups.length <= 1 && currentUnitFilter !== 'all') {
        tabsContainer.innerHTML = '';
        tabsContainer.style.padding = '0';
        return;
    }
    tabsContainer.style.padding = '0.75rem 0';
    
    let buttonsHTML = '';
    if(groups.length > 0) {
        buttonsHTML += `<button onclick="filterByGroup('all')" id="tab-all" class="group-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${'all' === currentGroupFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">全部組別</button>`;
    }

    buttonsHTML += groups.map(key => {
        const value = groupData[key] || key;
        return `<button onclick="filterByGroup('${key}')" id="tab-${key}" class="group-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${key === currentGroupFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">${value}</button>`
    }).join('');
    tabsContainer.innerHTML = buttonsHTML;
}

function renderYearFilter() {
    const yearFilterSelect = document.getElementById('yearFilter');
    const years = ['all', ...new Set(allActivities.map(item => item.startDate ? new Date(item.startDate).getFullYear() : null).filter(Boolean))].sort();
    yearFilterSelect.innerHTML = years.map(year => `<option value="${year}">${year === 'all' ? '全部年份' : `${year}年`}</option>`).join('');
    yearFilterSelect.value = currentYearFilter;
}

function renderMonthFilter() {
    const monthFilterSelect = document.getElementById('monthFilter');
    const months = ['all', 1,2,3,4,5,6,7,8,9,10,11,12];
    monthFilterSelect.innerHTML = months.map(m => `<option value="${m}">${m === 'all' ? '全部月份' : `${m}月`}</option>`).join('');
    monthFilterSelect.value = currentMonthFilter;
}

function renderItems(itemsToRender) {
    const itemsList = document.getElementById('itemsList');
    let filteredItems = itemsToRender;

    if (currentStatusFilter !== 'all') {
        filteredItems = itemsToRender.filter(p => p.status === currentStatusFilter);
    }

    if (filteredItems.length === 0) {
        itemsList.innerHTML = `<div class="text-center text-gray-400 py-8 col-span-full">
            <i class="fas fa-folder-open fa-3x mb-4"></i>
            <p class="font-semibold">沒有符合條件的項目</p>
            <p class="text-sm mt-1">請嘗試調整篩選條件</p>
        </div>`;
        return;
    }

    itemsList.innerHTML = filteredItems.map(item => {
        const checklist = item.checklist || [];
        const totalSteps = checklist.length;
        const completedSteps = checklist.filter(c => c.completed).length;

        const progressChange = item.progress - (item.lastWeekProgress || 0);
        const progressChangeHTML = progressChange > 0
            ? `<span class="bg-green-100 text-green-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">▲ ${progressChange}%</span>`
            : progressChange < 0
                ? `<span class="bg-red-100 text-red-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">▼ ${Math.abs(progressChange)}%</span>`
                : `<span class="text-gray-400 text-xs font-medium ml-2">—</span>`;

        const checklistHTML = totalSteps > 0 
            ? checklist.map(cp => `
                <li class="flex items-center ${cp.completed ? 'text-emerald-300' : 'text-gray-400'}">
                    <span class="w-5 text-left">${cp.completed ? '✓' : '○'}</span>
                    <span>${cp.name}</span>
                </li>`).join('')
            : '<li>無定義的檢查點</li>';

        return `
        <div class="bg-white border rounded-xl p-4 flex flex-col h-full shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${item.status === 'overdue' ? 'overdue-glow' : 'border-gray-200'}">
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-lg text-gray-900 mb-1">${item.name} <span class="text-sm font-medium ${getTypeStyle(item.type, item.status)}">(${getTypeText(item.type)})</span></h4>
                        ${item.description ? `<p class="text-sm text-gray-500 mt-1 mb-2 whitespace-pre-wrap">${item.description}</p>` : ''}
                        <p class="text-sm text-gray-600">主要負責: ${item.assignees.join(', ')}</p>
                        ${item.collaborators && item.collaborators.length > 0 ? `<p class="text-sm text-gray-600">協助: ${item.collaborators.join(', ')}</p>` : ''}
                    </div>
                    <div class="flex items-center space-x-2 ml-2">
                        <span class="flex items-center text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor(item.status)} text-white">${getStatusText(item.status)}</span>
                    </div>
                </div>
            </div>
            
            <div class="mt-auto border-t border-gray-100 pt-3">
                <div class="mb-3">
                    <div class="flex justify-between items-center text-sm mb-1">
                        <span class="text-gray-600 font-semibold">進度: ${item.progress}%</span>
                        ${progressChangeHTML}
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="progress-bar h-2.5 rounded-full ${getStatusColor(item.status)}" style="width: ${item.progress}%"></div>
                    </div>
                    <div class="relative group">
                        <p class="text-sm text-gray-600 mt-1 cursor-pointer">檢查點: ${completedSteps}/${totalSteps}</p>
                        <div class="absolute bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                            <h4 class="font-bold mb-2 border-b border-b-slate-600 pb-1">標準化流程</h4>
                            <ul class="space-y-1 mt-2">${checklistHTML}</ul>
                            <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>日期: ${formatDate(item.startDate)} - ${item.deadline ? formatDate(item.deadline) : '無'}</span>
                    ${item.status === 'overdue' ? '<span class="text-red-600 font-medium">⚠️ 已逾期</span>' : ''}
                </div>

                ${item.helpMessage ? `
                <div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start space-x-3">
                    <span class="text-xl pt-1">😭</span>
                    <div>
                        <p class="font-semibold text-red-800 text-sm">需要協助：</p>
                        <p class="text-sm text-red-700 whitespace-pre-wrap">${item.helpMessage}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>`;
    }).join('');
}

function renderTeamMembers(members, allItems) {
    const teamMembersDiv = document.getElementById('teamMembers');
    if (!members || members.length === 0) {
        teamMembersDiv.innerHTML = `<p class="text-center text-gray-500 py-4">此篩選條件下無成員</p>`;
        return;
    }

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    const todayStr = `${String(todayMonth).padStart(2, '0')}/${String(todayDate).padStart(2, '0')}`;

    teamMembersDiv.innerHTML = members.map(memberInfo => {
        const name = memberInfo.name;
        const memberItems = allItems.filter(t => t.assignees.includes(name) || (t.collaborators && t.collaborators.includes(name)));
        const overdueCount = memberItems.filter(t => t.status === 'overdue').length;
        const projectCount = memberItems.filter(item => item.type === 'project').length;
        const taskCount = memberItems.filter(item => item.type === 'task').length;
        const isActive = name === currentMemberFilter;

        const isBirthday = memberInfo.birthday === todayStr;
        
        const birthdayContainerClass = isBirthday ? 'birthday-container' : '';
        const birthdayHatHTML = isBirthday ? '<div class="birthday-hat"></div>' : '';
        const confettiHTML = isBirthday ? Array.from({length: 9}).map((_, i) => `<div class="confetti"></div>`).join('') : '';

        return `
        <div onclick="filterByMember('${name}')" class="group relative ${birthdayContainerClass} flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 ${isActive ? 'bg-blue-100 shadow-md' : 'hover:bg-gray-100 hover:shadow-md hover:scale-105'}">
            
            <div class="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-48 p-4 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-30">
                <img src="${localProfileImages[name] ? localProfileImages[name] : `https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}`}" alt="${name}" class="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-blue-300 object-cover shadow-md" onerror="this.src='https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}'; this.onerror=null;">
                <p class="font-bold text-center text-gray-900 text-lg">${name}</p>
                <a href="#" onclick="viewMemberHistory('${name}', event)" class="block w-full text-center bg-blue-600 text-white font-semibold py-1.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm mt-3">檢視個人歷程</a>
                <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white"></div>
            </div>

            ${confettiHTML}
            <div class="flex items-center min-w-0">
                <div class="relative flex-shrink-0">
                    ${birthdayHatHTML}
                    ${localProfileImages[name] ? `<img src="${localProfileImages[name]}" alt="${name}" class="w-10 h-10 rounded-full object-cover" onerror="this.onerror=null;this.replaceWith(this.parentElement.querySelector('.initial-avatar'))" />` : `<div class="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-semibold initial-avatar">${name.charAt(0)}</div>`}
                </div>
                <div class="ml-3 min-w-0">
                    <p class="font-medium text-gray-900 truncate">${name}</p>
                    <div class="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                        <span>專案: ${projectCount}</span>
                        <span>任務: ${taskCount}</span>
                    </div>
                </div>
            </div>
            <div class="text-right flex-shrink-0 ml-2">
                ${overdueCount > 0 ? `<span class="text-xs font-bold text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">${overdueCount}</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

function updateStats(itemsToCount) {
    const projectsAndTasks = allActivities.filter(item => item.type === 'project' || item.type === 'task');
    const activitiesAndMeetings = allActivities.filter(item => item.type === 'activity' || item.type === 'meeting');

    document.getElementById('totalTasks').textContent = projectsAndTasks.length;
    document.getElementById('activeTasks').textContent = projectsAndTasks.filter(t => t.status === 'active').length;
    document.getElementById('overdueTasks').textContent = projectsAndTasks.filter(t => t.status === 'overdue').length;
    document.getElementById('completedTasks').textContent = allActivities.filter(t => t.status === 'completed').length;
    document.getElementById('activityCount').textContent = activitiesAndMeetings.length;
}

function renderDashboard() {
    let itemsForYear = allActivities;
    if (currentYearFilter !== 'all') {
         itemsForYear = allActivities.filter(item => item.startDate && new Date(item.startDate).getFullYear() == currentYearFilter);
    }
    let itemsForMonth = itemsForYear;
    if (currentMonthFilter !== 'all') {
        itemsForMonth = itemsForYear.filter(item => item.startDate && (new Date(item.startDate).getMonth() + 1) == currentMonthFilter);
    }

    let membersAfterUnitFilter = staffData;
    if (currentUnitFilter !== 'all') {
        membersAfterUnitFilter = staffData.filter(s => s.unit === currentUnitFilter);
    }
    
    renderGroupTabs(membersAfterUnitFilter);

    const membersInGroup = currentGroupFilter === 'all' 
        ? membersAfterUnitFilter 
        : membersAfterUnitFilter.filter(s => s.group === currentGroupFilter);

    const finalVisibleMemberNames = membersInGroup.map(m => m.name);

    let itemsToConsider = itemsForMonth.filter(item => 
        item.assignees.some(assignee => finalVisibleMemberNames.includes(assignee)) ||
        (item.collaborators && item.collaborators.some(collaborator => finalVisibleMemberNames.includes(collaborator)))
    );

    if (currentSearchTerm) {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        itemsToConsider = itemsToConsider.filter(item => 
            item.name.toLowerCase().includes(lowerCaseTerm) ||
            (item.description && item.description.toLowerCase().includes(lowerCaseTerm))
        );
    }

    let itemsToDisplay = itemsToConsider;
    if (currentMemberFilter !== 'all') {
        itemsToDisplay = itemsToConsider.filter(item => 
            item.assignees.includes(currentMemberFilter) || 
            (item.collaborators && item.collaborators.includes(currentMemberFilter))
        );
    }
    
    itemsToDisplay.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    updateStats(allActivities);
    renderTeamMembers(membersInGroup, itemsForMonth);
    renderItems(itemsToDisplay.filter(item => item.type === 'project' || item.type === 'task'));
}

function filterByUnit(unit) {
    currentUnitFilter = unit;
    currentGroupFilter = 'all'; 
    currentMemberFilter = 'all'; 
    
    document.querySelectorAll('.unit-tab-btn').forEach(btn => {
        btn.classList.toggle('tab-active', btn.id === `tab-unit-${unit.replace(/\s/g, '-')}`);
        btn.classList.toggle('bg-gray-100', btn.id !== `tab-unit-${unit.replace(/\s/g, '-')}`);
        btn.classList.toggle('hover:bg-gray-200', btn.id !== `tab-unit-${unit.replace(/\s/g, '-')}`);
    });

    renderDashboard();
}

function filterBySearch(term) { currentSearchTerm = term; renderDashboard(); }
function filterByYear(year) { currentYearFilter = year; renderDashboard(); }
function filterByMonth(month) { currentMonthFilter = month; renderDashboard(); }

function filterByGroup(groupKey) {
    currentGroupFilter = groupKey;
    currentMemberFilter = 'all'; 
    
    document.querySelectorAll('.group-tab-btn').forEach(btn => {
        btn.classList.toggle('tab-active', btn.id === `tab-${groupKey}`);
    });
    renderDashboard();
}

function filterByMember(memberName) {
    currentMemberFilter = (currentMemberFilter === memberName) ? 'all' : memberName;
    renderDashboard();
}

function filterItemsByStatus(statusFilter, event) {
    currentStatusFilter = statusFilter;
    const colorMap = {
        'all': ['bg-blue-100', 'text-blue-700'], 'planning': ['bg-yellow-100', 'text-yellow-700'],
        'active': ['bg-purple-100', 'text-purple-700'], 'completed': ['bg-green-100', 'text-green-700'],
        'overdue': ['bg-red-100', 'text-red-700'],
    };
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', ...Object.values(colorMap).flat());
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    event.target.classList.add('active', ...colorMap[statusFilter]);
    event.target.classList.remove('bg-gray-100', 'text-gray-700');
    renderDashboard();
}

async function refreshData() {
    renderYearFilter();
    renderMonthFilter();
    renderDashboard();
}

function setupLoginModal() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('login-message');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const btnText = loginSubmitBtn.querySelector('.btn-text');
    const btnSpinner = loginSubmitBtn.querySelector('.btn-spinner');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const openChangePasswordModalBtn = document.getElementById('openChangePasswordModalBtn');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    openChangePasswordModalBtn.addEventListener('click', () => {
        loginModal.classList.add('hidden');
        document.getElementById('changePasswordModal').classList.remove('hidden');
    });

    loginBtn.addEventListener('click', () => {
        loginMessage.textContent = '';
        loginForm.reset();
        loginModal.classList.remove('hidden');
    });
    closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
    loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.add('hidden'); });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = event.target.username.value;
        const password = event.target.password.value;

        loginMessage.textContent = '';
        btnText.textContent = '登入中...';
        btnSpinner.classList.remove('hidden');
        loginSubmitBtn.disabled = true;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify({ action: 'login', username, password }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });

            if (!response.ok) {
                throw new Error(`網路回應錯誤: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'success') {
                const loginData = result.data;
                loginMessage.textContent = '登入成功！即將跳轉...';
                loginMessage.className = 'text-center mb-4 font-medium text-green-500';
                setTimeout(() => {
                    window.location.href = `https://luyun1224.github.io/cmh4200/project-admin.html?user=${encodeURIComponent(loginData.name)}&id=${loginData.employeeId}`;
                }, 1500);
            } else {
                throw new Error(result.message || '帳號或密碼錯誤。');
            }
        } catch (error) {
            console.error("Login Error Details:", error);
            loginMessage.textContent = error.message;
            loginMessage.className = 'text-center mb-4 font-medium text-red-500';
        } finally {
            btnText.textContent = '登入';
            btnSpinner.classList.add('hidden');
            loginSubmitBtn.disabled = false;
        }
    });
}

function setupChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const form = document.getElementById('changePasswordForm');
    const messageDiv = document.getElementById('change-password-message');
    const submitBtn = document.getElementById('changePasswordSubmitBtn');
    const closeBtn = document.getElementById('closeChangePasswordModalBtn');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const employeeId = form.elements.employeeId.value;
        const oldPassword = form.elements.oldPassword.value;
        const newPassword = form.elements.newPassword.value;
        
        messageDiv.textContent = '';
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = '處理中...';
        submitBtn.querySelector('.btn-spinner').classList.remove('hidden');

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify({ action: 'updatePassword', employeeId, oldPassword, newPassword }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });

            if (!response.ok) throw new Error('網路回應錯誤');
            
            const result = await response.json();
            
            if (result.status === 'success') {
                messageDiv.textContent = '密碼更新成功！';
                messageDiv.className = 'text-center mb-4 font-medium text-green-500';
                form.reset();
            } else {
                throw new Error(result.message || '更新失敗');
            }
        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = 'text-center mb-4 font-medium text-red-500';
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = '確認更換';
            submitBtn.querySelector('.btn-spinner').classList.add('hidden');
        }
    });
}

function openActivityModal(resetDate = true) {
    if (resetDate) calendarDate = new Date();
    const modal = document.getElementById('activityModal');
    const content = document.getElementById('activity-content');
    const today = new Date();
    today.setHours(0,0,0,0);

    const itemsForDisplay = allActivities.filter(item => {
        const typeMatch = item.type && (item.type.toLowerCase() === 'activity' || item.type.toLowerCase() === 'meeting');
        return typeMatch;
    });

    const calendarHTML = generateCalendarHTML(calendarDate.getFullYear(), calendarDate.getMonth(), itemsForDisplay);

    if (itemsForDisplay.length === 0) {
        content.innerHTML = calendarHTML + `<p class="text-center text-gray-500 mt-4">目前沒有任何活動。</p>`;
        modal.classList.remove('hidden');
        return;
    }
    
    const sortedItems = itemsForDisplay.slice().sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        const isPastA = (a.deadline ? new Date(a.deadline) : dateA) < today;
        const isPastB = (b.deadline ? new Date(b.deadline) : dateB) < today;
        if (isPastA !== isPastB) return isPastA ? 1 : -1;
        return dateA - dateB;
    });
    
    const buildList = (arr) => {
        if (arr.length === 0) return '<p class="text-center text-gray-500 mt-4">此月份沒有活動列表。</p>';
        let html = '';
        let currentKey = '';
        arr.forEach(item => {
            const d = new Date(item.startDate);
            const key = `${d.getFullYear()}-${d.getMonth()+1}`;
            if (key !== currentKey) {
                if (currentKey) html += '</ul></div>';
                currentKey = key;
                html += `<div class="mt-4"><h3 class="text-2xl font-bold text-purple-700 mb-2">${d.getFullYear()}年${d.getMonth()+1}月</h3><ul class="space-y-4">`;
            }
            const day = d.getDate();
            const range = item.deadline && item.deadline !== item.startDate ? ` - ${formatDate(item.deadline)}` : '';
            const isExpired = (item.deadline ? new Date(item.startDate) : new Date(item.startDate)) < today;
            html += `<li class="relative flex items-start space-x-4 p-2 rounded-lg ${isExpired ? 'bg-gray-100' : 'hover:bg-gray-50'}">
                        ${isExpired ? '<span class="absolute top-1 right-1 text-xs bg-gray-200 text-gray-600 px-1 rounded">已過期</span>' : ''}
                        <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                        <span class="text-xl font-bold text-purple-700">${day}</span>
                        </div>
                        <div class="flex-grow pt-1">
                        <p class="font-semibold text-gray-800">${item.name}</p>
                        <p class="text-sm text-gray-600">日期: ${formatDate(item.startDate)}${range}</p>
                        <p class="text-sm text-gray-500">負責人: ${item.assignees.join(', ')}</p>
                        ${item.collaborators && item.collaborators.length > 0 ? `<p class="text-sm text-gray-500">協助: ${item.collaborators.join(', ')}</p>` : ''}
                        </div>
                        </li>`;
        });
        if (currentKey) html += '</ul></div>';
        return html;
    };

    content.innerHTML = calendarHTML + `<hr class="my-6"/>` + `<div class="space-y-6">${buildList(sortedItems)}</div>`;
    modal.classList.remove('hidden');
}

function showItemsInModal(filterType) {
    const modal = document.getElementById('itemListModal');
    const titleEl = document.getElementById('itemListModalTitle');
    const contentEl = document.getElementById('itemListModalContent');
    
    let itemsToShow = [];
    let modalTitle = '';

    const projectsAndTasks = allActivities.filter(item => item.type === 'project' || item.type === 'task');
    const statusOrder = { 'active': 1, 'planning': 2, 'overdue': 3, 'completed': 4 };

    switch(filterType) {
        case 'total':
            itemsToShow = projectsAndTasks.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
            modalTitle = '總項目列表';
            break;
        case 'active':
            itemsToShow = projectsAndTasks.filter(item => item.status === 'active');
            modalTitle = '進行中項目列表';
            break;
        case 'overdue':
            itemsToShow = projectsAndTasks.filter(item => item.status === 'overdue');
            modalTitle = '逾期項目列表';
            break;
        case 'completed':
            itemsToShow = allActivities.filter(item => item.status === 'completed');
            modalTitle = '已完成項目列表';
            break;
    }

    titleEl.innerHTML = `<i class="fas fa-list-check mr-3"></i> ${modalTitle} (${itemsToShow.length})`;

    if (itemsToShow.length === 0) {
        contentEl.innerHTML = '<p class="text-center text-gray-500 py-4">此類別中沒有項目。</p>';
    } else {
        contentEl.innerHTML = itemsToShow.map(item => `
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
                <p class="font-semibold text-gray-800">${item.name}</p>
                <p class="text-sm text-gray-600">負責人: ${item.assignees.join(', ')}</p>
                <div class="flex justify-between items-center text-xs mt-1">
                    <span class="font-medium ${getTypeStyle(item.type, item.status)}">(${getTypeText(item.type)})</span>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)} text-white">${getStatusText(item.status)}</span>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.remove('hidden');
}

async function getAiSuggestions(memberName = 'all') {
    const aiContent = document.getElementById('ai-suggestion-content');
    
    // --- START: 優化載入提示 ---
    const loadingMessages = [
        "正在準備您的專案數據...",
        "已連線至 AI 引擎...",
        "AI 正在分析風險與機會...",
        "生成個人化決策建議中...",
        "幾乎完成了..."
    ];
    let messageIndex = 0;

    // 立即顯示第一個訊息
    aiContent.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
            <p id="ai-loading-message" class="mt-4 text-gray-600 font-medium">${loadingMessages[0]}</p>
        </div>`;
    
    const loadingMessageElement = document.getElementById('ai-loading-message');

    // 設定一個計時器來依序變換提示訊息
    const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        if(loadingMessageElement) {
            loadingMessageElement.textContent = loadingMessages[messageIndex];
        }
    }, 1500); // 每 1.5 秒換一次
    // --- END: 優化載入提示 ---

    let itemsToAnalyze = allActivities.filter(item => ['project', 'task'].includes(item.type));
    let analysisTarget = "整個團隊";

    if (memberName !== 'all') {
        analysisTarget = memberName;
        itemsToAnalyze = itemsToAnalyze.filter(item => 
            item.assignees.includes(memberName) || 
            (item.collaborators && item.collaborators.includes(memberName))
        );
    }

    const totalCount = itemsToAnalyze.length;
    const overdueItems = itemsToAnalyze.filter(p => p.status === 'overdue');
    const activeItems = itemsToAnalyze.filter(p => p.status === 'active');
    const planningItems = itemsToAnalyze.filter(p => p.status === 'planning');
    const completedItems = itemsToAnalyze.filter(p => p.status === 'completed');
    const highPerformingItems = itemsToAnalyze.filter(p => p.progress > 85 && p.status === 'active');
    const stalledItems = activeItems.filter(p => (p.progress - (p.lastWeekProgress || 0)) <= 0 && p.lastWeekProgress > 0);
    
    const prompt = `
        你是一位頂尖的專案管理與策略顧問，專精於醫療教育領域。請為一位高階經理人，針對 **${analysisTarget}** 的表現，撰寫一份深入的決策摘要。
        請務必使用 **繁體中文**，並根據我提供的 **真實數據** 和 **外部情資**，生成一個包含多元洞見的 JSON 物件。

        **內部數據摘要 (Internal Data):**
        - **分析對象:** ${analysisTarget}
        - **負責總項目數:** ${totalCount}
        - **項目狀態:**
            - 逾期: ${overdueItems.length} 項
            - 進行中: ${activeItems.length} 項
            - 規劃中: ${planningItems.length} 項
            - 已完成: ${completedItems.length} 項
        - **需立即關注的逾期項目:** ${overdueItems.length > 0 ? overdueItems.map(p => `"${p.name}"`).join('; ') : '無'}
        - **進度可能停滯的項目 (一週內無進展):** ${stalledItems.length > 0 ? stalledItems.map(p => `"${p.name}"`).join('; ') : '無'}
        - **表現優異的項目 (進度 > 85%):** ${highPerformingItems.length > 0 ? highPerformingItems.map(p => `"${p.name}"`).join('; ') : '無'}

        **外部情資 (External Intelligence):**
        - **醫療教育趨勢:** 數位轉型和模擬醫學(Simulation-Based Medical Education)是主流，強調使用VR/AR和線上平台提升學習成效。AI輔助診斷與教學日益重要。
        - **專案管理趨勢:** 敏捷(Agile)與混合式專案管理方法論被廣泛採用，以應對快速變化的需求。利用AI工具進行風險預測與資源分配是前緣實踐。

        請基於以上內外部資訊，填充以下 JSON 結構。請提供具體、可執行的分析與建議，而不僅僅是重複數據。
    `;
    
    const geminiPayload = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    healthOverview: {
                        type: "OBJECT",
                        description: "對整體專案組合的健康度進行快速總結。",
                        properties: {
                            summary: { type: "STRING", description: "用1-2句話總結目前專案組合的整體健康度，點出最關鍵的挑戰與優勢。" },
                            ragAnalysis: {
                                type: "ARRAY",
                                description: "RAG燈號分析列表，每個燈號一個物件。",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        status: { type: "STRING", description: "燈號狀態 (例如: 紅燈 (逾期), 黃燈 (進行中), 藍燈 (規劃中), 綠燈 (已完成))" },
                                        count: { type: "NUMBER", description: "該狀態的項目數量" },
                                        example: { type: "STRING", description: "如果是紅燈，提供一個最關鍵的逾期項目名稱作為範例。其他狀態則為空字串。" }
                                    }
                                }
                            }
                        }
                    },
                    opportunities: {
                        type: "ARRAY",
                        description: "根據數據識別出的亮點與機會。",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING", description: "機會點的次標題，例如 '高績效專案' 或 '潛力領域'。" },
                                points: { type: "ARRAY", items: { type: "STRING" }, description: "列出具體的項目或觀察，並說明為何這是個機會點。" }
                            }
                        }
                    },
                    riskAssessment: {
                        type: "ARRAY",
                        description: "需要管理者關注的風險。",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING", description: "風險次標題，例如 '逾期項目衝擊' 或 '進度停滯警示'。" },
                                points: { type: "ARRAY", items: { type: "STRING" }, description: "列出具體的風險項目，並簡要說明其潛在影響。" }
                            }
                        }
                    },
                    recommendations: {
                        type: "ARRAY",
                        description: "基於上述分析，提供給管理者的具體、可操作的建議。",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING", description: "建議的次標題，例如 '優先處理事項' 或 '策略性投入'。" },
                                points: { type: "ARRAY", items: { type: "STRING" }, description: "提出具體的行動步驟，例如召開特定會議、調整資源、引入新工具或方法等。" }
                            }
                        }
                    },
                    industryInsights: {
                        type: "ARRAY",
                        description: "結合外部情資，提供與當前專案相關的宏觀策略洞見。",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING", description: "洞察的次標題，例如 '連結數位轉型趨勢' 或 '導入敏捷管理思維'。" },
                                points: { type: "ARRAY", items: { type: "STRING" }, description: "說明如何將外部趨勢應用於當前專案或未來規劃中。" }
                            }
                        }
                    }
                }
            }
        }
    };

    // ########### START: MODIFIED CODE BLOCK ###########
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getAiSuggestionProxy', payload: geminiPayload })
        });

        // Directly parse the JSON, as the backend will return a JSON body even for errors.
        const result = await response.json();

        // Check for a specific error structure returned from our GAS backend.
        if (result.error) {
            // This is the true error message from the Gemini API or our script.
            throw new Error(result.error.message || '後端回傳未知錯誤');
        }
        
        // Check for the normal, successful Gemini API response structure.
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts[0].text) {
            const jsonText = result.candidates[0].content.parts[0].text;
            const reportData = JSON.parse(jsonText);
            aiContent.innerHTML = renderAiReport(reportData);
        } else {
            // If there's no error and no valid candidate, the response format is unexpected.
            throw new Error("AI 未能提供有效的建議。回應為空或格式不符。");
        }

    } catch (error) {
        console.error("AI Suggestion Error:", error);
        aiContent.innerHTML = `
            <div class="p-4 bg-red-100 text-red-700 rounded-lg">
                <p class="font-bold">無法獲取 AI 建議</p>
                <p>${error.message}</p>
            </div>`;
    } finally {
        // Ensure the loading interval is cleared regardless of success or failure.
        clearInterval(intervalId);
    }
    // ########### END: MODIFIED CODE BLOCK ###########
}

function renderAiReport(data) {
    const { healthOverview = {}, opportunities = [], riskAssessment = [], recommendations = [], industryInsights = [] } = data;
    
    const renderSection = (title, color, icon, content, isEmpty) => {
        if (isEmpty) return '';
        return `
            <div class="mb-6">
                <h3 class="text-lg font-bold ${color} flex items-center mb-3"><i class="fas ${icon} fa-fw mr-3"></i>${title}</h3>
                <div class="pl-5 space-y-4">${content}</div>
            </div>
        `;
    };
    
    const renderList = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return '<p class="text-sm text-gray-500">無具體項目。</p>';
        }
        let listHtml = '<ul class="list-none space-y-2">';
        listHtml += items.map(item => `
            <li class="flex items-start">
                <span class="mr-3 text-gray-500 mt-1.5 text-xs">●</span>
                <span class="text-gray-800 flex-1 text-sm">${item}</span>
            </li>
        `).join('');
        listHtml += '</ul>';
        return listHtml;
    };

    const renderSubSection = (items, defaultColor, iconMap) => {
        if (!Array.isArray(items) || items.length === 0) return '<p class="pl-5 text-sm text-gray-500">無</p>';
        return items.map(section => {
            const icon = iconMap[section.title] || 'fa-lightbulb';
            return `<div class="space-y-2"><strong class="font-bold ${defaultColor} flex items-center text-sm"><i class="fas ${icon} w-5 text-center mr-2"></i>${section.title}</strong><div class="pl-5">${renderList(section.points)}</div></div>`;
        }).join('<hr class="my-4 border-gray-200">');
    };

    const healthContent = `
        <p class="text-gray-700 mb-4">${healthOverview.summary || "無法生成總結。"}</p>
        <ul class="space-y-2 pl-4">
        ${(healthOverview.ragAnalysis || []).map(item => {
            let color = 'text-gray-600', icon = 'fa-info-circle';
            if(item.status.includes('紅') || item.status.includes('逾期')) { color = 'text-red-600'; icon = 'fa-exclamation-triangle'; }
            else if(item.status.includes('黃') || item.status.includes('進行中')) { color = 'text-yellow-600'; icon = 'fa-tasks'; }
            else if(item.status.includes('藍') || item.status.includes('規劃中')) { color = 'text-blue-600'; icon = 'fa-map'; }
            else if(item.status.includes('綠') || item.status.includes('已完成')) { color = 'text-green-600'; icon = 'fa-check-circle'; }
            
            const exampleText = item.example ? ` ("${item.example}")` : '';

            return `<li class="flex items-start">
                        <i class="fas ${icon} ${color} w-5 mt-1 mr-3"></i>
                        <span class="font-semibold text-gray-800">${item.status}: ${item.count} 項${exampleText}</span>
                    </li>`;
        }).join('')}
        </ul>
    `;

    const opportunityContent = renderSubSection(opportunities, 'text-teal-600', {'高績效專案': 'fa-award', '潛力領域': 'fa-search-plus'});
    const riskContent = renderSubSection(riskAssessment, 'text-red-800', {'逾期項目衝擊': 'fa-fire-alt', '進度停滯警示': 'fa-ghost'});
    const recommendationContent = renderSubSection(recommendations, 'text-blue-800', {'優先處理事項': 'fa-star', '策略性投入': 'fa-chess-knight'});
    const insightContent = renderSubSection(industryInsights, 'text-indigo-800', {'連結數位轉型趨勢': 'fa-laptop-medical', '導入敏捷管理思維': 'fa-running'});

    let finalHtml = '<div class="space-y-6">';
    finalHtml += renderSection('專案組合健康度速覽 (RAG 分析)', 'text-gray-700', 'fa-chart-pie', healthContent, !healthOverview.summary);
    finalHtml += renderSection('機會點與亮點', 'text-teal-600', 'fa-sun', opportunityContent, opportunities.length === 0);
    finalHtml += renderSection('風險評估與預警', 'text-red-600', 'fa-shield-alt', riskContent, riskAssessment.length === 0);
    finalHtml += renderSection('具體行動建議', 'text-blue-600', 'fa-user-tie', recommendationContent, recommendations.length === 0);
    finalHtml += renderSection('外部趨勢與策略洞察', 'text-indigo-600', 'fa-globe-asia', insightContent, industryInsights.length === 0);
    finalHtml += '</div>';

    return finalHtml;
}

function generateWeeklySummary() {
    const modal = document.getElementById('weeklySummaryModal');
    const content = document.getElementById('weekly-summary-content');
    content.innerHTML = `<div class="p-8 flex items-center justify-center"><i class="fas fa-spinner fa-spin text-2xl text-green-500 mr-3"></i> 正在生成本週回顧...</div>`;
    
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const projectsAndTasks = allActivities.filter(item => ['project', 'task'].includes(item.type));

    const completedThisWeek = projectsAndTasks.filter(item => {
        if (item.status !== 'completed') return false;
        const completionDate = item.deadline ? new Date(item.deadline) : null;
        if (!completionDate) return false;
        const isRecent = completionDate >= oneWeekAgo && completionDate <= today;
        const wasCompletedBefore = (item.lastWeekProgress || 0) === 100;
        return isRecent && !wasCompletedBefore;
    });

    const progressMade = projectsAndTasks.filter(item =>
        item.status !== 'completed' &&
        item.progress > (item.lastWeekProgress || 0)
    );

    const newlyAdded = projectsAndTasks.filter(item =>
        new Date(item.startDate) >= oneWeekAgo && new Date(item.startDate) <= today
    );
    
    const stalled = projectsAndTasks.filter(item =>
        item.status === 'active' &&
        item.progress === (item.lastWeekProgress || 0)
    );

    const upcomingDeadlines = projectsAndTasks.filter(item =>
        item.deadline &&
        new Date(item.deadline) > today &&
        new Date(item.deadline) <= nextWeek &&
        item.status !== 'completed'
    );
    
    const helpNeeded = projectsAndTasks.filter(item => item.helpMessage && item.helpMessage.trim() !== '');

    let summaryHTML = '';

    const renderSummarySection = (title, icon, color, items, emptyText) => {
        let sectionHTML = `<div class="mb-4">
            <h3 class="text-lg font-bold ${color} flex items-center mb-2"><i class="fas ${icon} fa-fw mr-2"></i>${title} (${items.length})</h3>`;
        if (items.length > 0) {
            sectionHTML += '<ul class="space-y-2 pl-5">';
            sectionHTML += items.map(item =>
                `<li class="text-sm text-gray-800 p-2 bg-gray-50 rounded-md border-l-4 ${color.replace('text-', 'border-')}">
                    <strong>${item.name}</strong> - <span class="text-gray-500">負責人: ${item.assignees.join(', ')}</span>
                    ${title.includes('進度') ? `<span class="font-medium text-green-600"> (+${item.progress - (item.lastWeekProgress || 0)}%)</span>` : ''}
                    ${title.includes('到期') ? `<span class="font-medium text-yellow-800"> (到期日: ${formatDate(item.deadline)})</span>` : ''}
                    ${title.includes('協助') ? `<p class="text-sm text-red-700 mt-1 pl-2 border-l-2 border-red-200 bg-red-50 py-1"><em>"${item.helpMessage}"</em></p>` : ''}
                </li>`
            ).join('');
            sectionHTML += '</ul>';
        } else {
            sectionHTML += `<p class="pl-5 text-sm text-gray-500">${emptyText}</p>`;
        }
        sectionHTML += `</div>`;
        return sectionHTML;
    };

    summaryHTML += renderSummarySection('本週完成項目', 'fa-check-circle', 'text-green-600', completedThisWeek, '本週沒有完成的項目。');
    summaryHTML += renderSummarySection('本週進度更新', 'fa-rocket', 'text-blue-600', progressMade, '本週沒有項目取得進展。');
    summaryHTML += renderSummarySection('本週新增項目', 'fa-lightbulb', 'text-purple-600', newlyAdded, '本週沒有新增項目。');
    summaryHTML += renderSummarySection('下週到期項目', 'fa-clock', 'text-yellow-600', upcomingDeadlines, '下週沒有即將到期的項目。');
    summaryHTML += renderSummarySection('進度停滯項目', 'fa-pause-circle', 'text-orange-500', stalled, '所有項目皆有進展，太棒了！');
    summaryHTML += renderSummarySection('需要協助項目', 'fa-hands-helping', 'text-red-600', helpNeeded, '沒有項目發出求救信號。');

    content.innerHTML = summaryHTML;
}

function setupModal(modalId, openBtnId, closeBtnId, openCallback) {
    const modal = document.getElementById(modalId);
    const openBtn = openBtnId ? document.getElementById(openBtnId) : null;
    const closeBtn = document.getElementById(closeBtnId);

    const open = () => {
        modal.classList.remove('hidden');
        if (openCallback) openCallback();
    };
    const close = () => modal.classList.add('hidden');

    if (openBtn) openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            close();
        }
    });
}

function setupAiModal(){
    const modal = document.getElementById('aiModal');
    const openBtn = document.getElementById('aiBtn');
    const closeBtn = document.getElementById('closeAiModalBtn');
    const filterSelect = document.getElementById('aiMemberFilter');

    const open = () => {
        filterSelect.innerHTML = `<option value="all">總體分析</option>`;
        staffData.forEach(member => {
            filterSelect.innerHTML += `<option value="${member.name}">${member.name}</option>`;
        });
        filterSelect.value = 'all';
        
        modal.classList.remove('hidden');
        getAiSuggestions('all');
    };

    const close = () => modal.classList.add('hidden');

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    filterSelect.addEventListener('change', (e) => {
        getAiSuggestions(e.target.value);
    });
};

function setupActivityModal(){
    setupModal('activityModal', null, 'closeActivityModalBtn');
};

function setupWeeklySummaryModal(){
    setupModal('weeklySummaryModal', 'weeklySummaryBtn', 'closeWeeklySummaryBtn', generateWeeklySummary);
};
function setupItemListModal(){
    setupModal('itemListModal', null, 'closeItemListModalBtn');
};

function navigateCalendar(offset){
    calendarDate.setMonth(calendarDate.getMonth() + offset);
    openActivityModal(false);
};

function generateCalendarHTML(year, month, activities){
    const activitiesByDay = {};
    activities.forEach(item => {
        if (!item.startDate) return;
        const start = new Date(item.startDate);
        const end = item.deadline ? new Date(item.deadline) : new Date(item.startDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!activitiesByDay[day]) activitiesByDay[day] = [];
                activitiesByDay[day].push(item);
            }
        }
    });

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHtml = `<div class="mb-6">
        <div class="flex justify-between items-center mb-4">
            <button onclick="navigateCalendar(-1)" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">&lt;</button>
            <h3 class="text-xl font-bold text-purple-700">${year}年 ${monthNames[month]}</h3>
            <button onclick="navigateCalendar(1)" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">&gt;</button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-sm">`;
    
    daysOfWeek.forEach(day => { calendarHtml += `<div class="font-semibold text-gray-600">${day}</div>`; });
    for (let i = 0; i < firstDay; i++) { calendarHtml += `<div></div>`; }

    for (let day = 1; day <= daysInMonth; day++) {
        const activitiesToday = activitiesByDay[day];
        if (activitiesToday) {
            const tooltipHtml = activitiesToday.map(act => `<li class="truncate">${act.name}</li>`).join('');
            calendarHtml += `<div class="relative group flex items-center justify-center">
                <div class="mx-auto flex items-center justify-center w-8 h-8 rounded-full border-2 border-purple-400 text-purple-700 font-semibold cursor-pointer">${day}</div>
                <span class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">${activitiesToday.length}</span>
                <div class="absolute bottom-full mb-2 w-56 p-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 transform -translate-x-1/2 left-1/2">
                    <ul class="space-y-1">${tooltipHtml}</ul>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                </div>
            </div>`;
        } else {
            calendarHtml += `<div class="flex items-center justify-center w-8 h-8">${day}</div>`;
        }
    }
    calendarHtml += `</div></div>`;
    return calendarHtml;
};

function setupScrollToTop(){
    const btn = document.getElementById('scrollToTopBtn');
    window.onscroll = () => {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    };
    btn.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
};

function viewMemberHistory(name, event) {
    event.stopPropagation();
    if (name === '盧英云') {
        window.open('https://qpig0218.github.io/Ying-Yun/', '_blank');
        return;
    }
    alert(`檢視 ${name} 的個人歷程 (功能開發中)`);
}

function generateDashboardReportHTML() {
    const today = new Date();
    const todayString = today.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
    const thisMonth = today.getMonth() + 1;
    const thisYear = today.getFullYear();

    const itemsThisMonth = allActivities.filter(item => {
        const itemDate = new Date(item.startDate);
        return itemDate.getFullYear() === thisYear && (itemDate.getMonth() + 1) === thisMonth;
    });
    
    const completedProjectsThisMonth = itemsThisMonth.filter(i => i.status === 'completed' && i.type === 'project').length;
    const completedTasksThisMonth = itemsThisMonth.filter(i => i.status === 'completed' && i.type === 'task').length;
    const activeProjectsCount = allActivities.filter(i => i.status === 'active' && i.type === 'project').length;
    const activeTasksCount = allActivities.filter(i => i.status === 'active' && i.type === 'task').length;
    const overdueProjects = allActivities.filter(i => i.status === 'overdue');
    
    const recentlyCompleted = allActivities
        .filter(i => i.status === 'completed' && new Date(i.deadline) <= today && i.type === 'project')
        .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
    const highlightProject = recentlyCompleted.length > 0 ? recentlyCompleted[0] : null;
    
    const milestonesCompleted = itemsThisMonth
        .filter(i => i.status === 'completed' && i.type === 'task')
        .map(i => i.name)
        .slice(0, 2);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const upcomingEvents = allActivities
        .filter(i => {
            const startDate = new Date(i.startDate);
            return i.status !== 'completed' && startDate > today && startDate <= nextWeek;
        })
        .map(i => `[${formatDate(i.startDate)}]: ${i.name}`);

    let reportHTML = `<div class="p-2 space-y-4 text-gray-800">`;
    reportHTML += `<p>您好！這是截至 <strong>${todayString}</strong> 的本月重點彙報。</p>`;

    reportHTML += `<div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 class="font-bold text-yellow-800">⭐ 本月亮點 (Highlights)</h3>
        <ul class="list-none text-sm text-yellow-700 mt-2 space-y-1">`;
    reportHTML += `<li><span class="font-semibold">🎉 專案達標：</span> 本月共完成 <strong>${completedProjectsThisMonth}</strong> 項專案、<strong>${completedTasksThisMonth}</strong> 項任務！</li>`;
    if (highlightProject) {
        reportHTML += `<li><span class="font-semibold">🚀 指標專案上線：</span> 「${highlightProject.name}」已於 ${formatDate(highlightProject.deadline)} 順利完成。</li>`;
    } else {
         reportHTML += `<li><span class="font-semibold">🚀 指標專案上線：</span> 本月尚無指標專案完成。</li>`;
    }
    reportHTML += `</ul></div>`;

    reportHTML += `<div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 class="font-bold text-blue-800">⚙️ 專案進度 (Project Progress)</h3>
        <ul class="list-none text-sm text-blue-700 mt-2 space-y-1">
            <li><strong>進行中專案：</strong> ${activeProjectsCount} 項</li>
            <li><strong>進行中任務：</strong> ${activeTasksCount} 項</li>
            <li><strong>本月完成里程碑：</strong> ${milestonesCompleted.length > 0 ? milestonesCompleted.join(', ') : '無'}</li>
        </ul></div>`;

    if (overdueProjects.length > 0) {
        const riskProject = overdueProjects[0];
        reportHTML += `<div class="p-3 bg-red-50 rounded-lg border border-red-200">
            <h3 class="font-bold text-red-800">⚠️ 風險提示</h3>
            <p class="text-sm text-red-700 mt-1">「${riskProject.name}」目前處於逾期狀態，需負責人 <strong>${riskProject.assignees.join(', ')}</strong> 重點關注。</p>
            </div>`;
    }

    reportHTML += `<div class="p-3 bg-green-50 rounded-lg border border-green-200">
        <h3 class="font-bold text-green-800">🗓️ 下週重點預告 (Coming Up)</h3>`;
    if (upcomingEvents.length > 0) {
        reportHTML += `<ul class="list-none text-sm text-green-700 mt-2 space-y-1">
            ${upcomingEvents.map(e => `<li>${e}</li>`).join('')}
            </ul>`;
    } else {
        reportHTML += `<p class="text-sm text-green-700 mt-1">下週尚無排定重點事項。</p>`;
    }
    reportHTML += `</div>`;

    reportHTML += `<p class="text-xs text-gray-500 text-center pt-2">希望這份彙報對您有幫助！</p>`;
    reportHTML += `</div>`;

    return reportHTML;
}

function setupChatBot() {
    const openBtn = document.getElementById('openChatBot');
    const closeBtn = document.getElementById('closeChatBot');
    const container = document.getElementById('chatBotContainer');
    const messagesDiv = document.getElementById('chatBotMessages');

    openBtn.addEventListener('click', () => {
        container.classList.remove('hidden');
        messagesDiv.innerHTML = `<div class="p-4"><i class="fas fa-spinner fa-spin text-indigo-500"></i> 正在產生報告...</div>`;
        setTimeout(() => {
            messagesDiv.innerHTML = generateDashboardReportHTML();
        }, 100);
    });

    closeBtn.addEventListener('click', () => {
        container.classList.add('hidden');
    });
}

async function initializeDashboard() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorDisplay = document.getElementById('errorDisplay');
    loadingOverlay.classList.remove('hidden');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action: 'getDashboardData' }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);

        const userData = result.data.staffData || [];
        staffData = userData.map(user => ({
            id: user.employeeId,
            name: user.name,
            group: user.group,
            birthday: user.birthday,
            unit: user.unit
        }));
        
        const itemData = result.data.activities || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        allActivities = itemData.map(item => {
            const progress = parseInt(item.progress, 10) || 0;
            const deadline = item.deadline ? new Date(item.deadline) : null;
            let finalStatus = item.status || 'planning';
            if (progress >= 100) {
                finalStatus = 'completed';
            } else if (finalStatus !== 'completed' && deadline && deadline < today) {
                finalStatus = 'overdue';
            }
            return {
                ...item,
                progress: progress,
                status: finalStatus,
                lastWeekProgress: item.lastWeekProgress ? parseInt(item.lastWeekProgress, 10) : 0,
                helpMessage: item.helpMessage || '',
                checklist: Array.isArray(item.checklist) ? item.checklist : [] 
            };
        });

        const urlParams = new URLSearchParams(window.location.search);
        const paramStatus = urlParams.get('status');
        if (paramStatus) currentStatusFilter = paramStatus;

        renderUnitTabs();
        renderYearFilter();
        renderMonthFilter();
        renderDashboard();
        
        if (paramStatus) {
            const btn = document.querySelector(`.filter-btn[onclick*="${paramStatus}"]`);
            if (btn) filterItemsByStatus(paramStatus, { target: btn });
        }
        document.getElementById('openChatBot').classList.remove('hidden');

    } catch (error) {
        console.error("Initialization failed:", error);
        document.getElementById('errorMessage').textContent = `無法從伺服器獲取專案數據。請檢查您的網路連線或稍後再試。(${error.message})`;
        errorDisplay.classList.remove('hidden');
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    setupLoginModal();
    setupChangePasswordModal();
    setupAiModal();
    setupActivityModal();
    setupWeeklySummaryModal();
    setupScrollToTop();
    setupItemListModal();
    setupChatBot();

    await initializeDashboard();
});
