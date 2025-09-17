// script.js (FINAL VERSION with Kudos, without Title)
// --- Configuration ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvl5lYY1LssljDNJJyGuAGsLd3D0sbGSs4QTZxgz2PAZJ38EpsHzEk740LGiQ5AMok/exec"; // <--- 請務必更新為您新部署的網址
let allActivities = [];
const currentDate = new Date();

let staffData = [];

const localProfileImages = { '盧英云': '盧英云.png', '陳詩芸': '陳詩芸.jpg', '楊宜婷': '楊宜婷.png','黃惠津': '黃惠津.png','王嬿茹': '王嬿茹.png','侯昱瑾': '侯昱瑾.png','高瑞穗': '高瑞穗.png','林盟淦': '林盟淦.png','吳曉琪': '吳曉琪.png','許淑怡': '許淑怡.png','林汶秀': '林汶秀.png','林淑雅': '林淑雅.png','廖家德': '廖家德.jpg','劉雯': '劉雯.jpg','楊依玲': '楊依玲.png','李迎真': '李迎真.png'};
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

// ===============================================================
// KUDOS (讚賞) 相關函式
// ===============================================================
async function giveKudo(itemId, event) {
    event.stopPropagation(); // 防止點擊穿透觸發其他事件

    const kudoButton = event.currentTarget;
    const kudoCountSpan = kudoButton.querySelector('.kudo-count');

    // UI 優化：立即顯示動畫和+1
    kudoButton.classList.add('animate-ping');
    const currentCount = parseInt(kudoCountSpan.textContent, 10);
    kudoCountSpan.textContent = currentCount + 1;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action: 'addKudo', itemId: itemId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            // 從後端確認最終數量
            kudoCountSpan.textContent = result.data.newKudos;
            // 更新本地資料，避免刷新後數字變回去
            const itemInAllActivities = allActivities.find(item => item.id == itemId);
            if (itemInAllActivities) {
                itemInAllActivities.kudos = result.data.newKudos;
            }
        } else {
            // 如果失敗，則恢復原狀
            kudoCountSpan.textContent = currentCount;
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Kudo Error:", error);
        // 如果失敗，則恢復原狀
        kudoCountSpan.textContent = currentCount;
        alert("點讚失敗：" + error.message);
    } finally {
        // 動畫結束後移除 class
        setTimeout(() => {
            kudoButton.classList.remove('animate-ping');
        }, 700);
    }
}

// ===============================================================
// Rendering Functions
// ===============================================================
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
            
        const kudosHTML = `
            <button onclick="giveKudo(${item.id}, event)" title="為此專案點讚！" class="relative flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">
                <i class="fas fa-thumbs-up"></i>
                <span class="font-semibold kudo-count">${item.kudos || 0}</span>
            </button>
        `;

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
                    <div class="flex items-center gap-3">
                        ${item.status === 'overdue' ? '<span class="text-red-600 font-medium">⚠️ 已逾期</span>' : ''}
                        ${kudosHTML} 
                    </div>
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
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

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

        // ******** 這裡只顯示單位 ********
        const unitInfoHTML = memberInfo.unit ? `<p class="text-sm text-gray-600 mt-2">${memberInfo.unit}</p>` : '';

        return `
        <div onclick="filterByMember('${name}')" class="group relative ${birthdayContainerClass} flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 ${isActive ? 'bg-blue-100 shadow-md' : 'hover:bg-gray-100 hover:shadow-md hover:scale-105'}">
            
            <div class="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-48 p-4 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-30">
                <img src="${localProfileImages[name] ? localProfileImages[name] : `https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}`}" alt="${name}" class="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-blue-300 object-cover shadow-md" onerror="this.src='https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}'; this.onerror=null;">
                <p class="font-bold text-center text-gray-900 text-lg">${name}</p>
                <div class="text-center">
                    ${unitInfoHTML}
                </div>
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


// ... (檔案中其餘的 JavaScript 程式碼維持不變)
// ...
// ...

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
        // ******** START: 更新 staffData 結構 (移除職稱) ********
        staffData = userData.map(user => ({
            id: user.employeeId,
            name: user.name,
            group: user.group,
            birthday: user.birthday,
            unit: user.unit
        }));
        // ******** END: 更新 staffData 結構 (移除職稱) ********

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
                checklist: Array.isArray(item.checklist) ? item.checklist : [],
                kudos: item.kudos || 0 // 保留 kudos
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

// ... (檔案中其餘的 JavaScript 程式碼維持不變，直到檔案結尾)
// ...
