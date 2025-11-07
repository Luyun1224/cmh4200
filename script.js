// script.js (FINAL & COMPLETE - v14.4 - Re-added Activity Calendar)
// --- Configuration & State Variables ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvl5lYY1LssljDNJJyGuAGsLd3D0sbGSs4QTZxgz2PAZJ38EpsHzEk740LGiQ5AMok/exec";
let allActivities = [];
let allHonors = [];
let staffData = [];
const localProfileImages = { '盧英云': '盧英云.png', '陳詩芸': '陳詩芸.jpg', '楊宜婷': '楊宜婷.png','黃惠津': '黃惠津.png','王嬿茹': '王嬿茹.png','侯昱瑾': '侯昱瑾.png','高瑞穗': '高瑞穗.png','林盟淦': '林盟淦.png','吳曉琪': '吳曉琪.png','許淑怡': '許淑怡.png','林汶秀': '林汶秀.png','林淑雅': '林淑雅.png','廖家德': '廖家德.jpg','劉雯': '劉雯.jpg','楊依玲': '楊依玲.png','李迎真': '李迎真.png','蔡長志': '蔡長志.png','郭妍伶': '郭妍伶.png','郭進榮': '郭進榮.png'};
let currentUnitFilter = 'all';
let currentGroupFilter = 'all';
let currentStatusFilter = 'all';
let currentMemberFilter = 'all';
let currentYearFilter = 'all';
let currentMonthFilter = 'all';
let currentSearchTerm = '';
let calendarDate = new Date(); // 用於活動日曆
let allDutiesData = {};

// --- Helper Functions ---
const getStatusColor = (status) => ({ completed: 'bg-green-500', active: 'bg-purple-500', overdue: 'bg-red-500', planning: 'bg-yellow-500' }[status] || 'bg-gray-500');
const getStatusText = (status) => ({ completed: '已完成', active: '進行中', overdue: '逾期', planning: '規劃中' }[status] || '未知');
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
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
    let groups = [...new Set(membersToConsider.map(s => s.group).filter(Boolean))];
    const desiredOrder = ['教學行政組', '一般科', '臨床技能中心', '教師培育中心', '實證醫學暨醫療政策中心', '視聽中心', '圖書館'];
    groups.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a);
        const indexB = desiredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) { return indexA - indexB; }
        if (indexA !== -1) { return -1; }
        if (indexB !== -1) { return 1; }
        return a.localeCompare(b, 'zh-Hant');
    });
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
    buttonsHTML += groups.map(key => `<button onclick="filterByGroup('${key}')" id="tab-${key}" class="group-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${key === currentGroupFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">${key}</button>`).join('');
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
        itemsList.innerHTML = `<div class="text-center text-gray-400 py-8 col-span-full"><i class="fas fa-folder-open fa-3x mb-4"></i><p class="font-semibold">沒有符合條件的項目</p><p class="text-sm mt-1">請嘗試調整篩選條件</p></div>`;
        return;
    }
    itemsList.innerHTML = filteredItems.map(item => {
        const checklist = item.checklist || [];
        const totalSteps = checklist.length;
        const completedSteps = checklist.filter(c => c.completed).length;
        const progressChange = item.progress - (item.lastWeekProgress || 0);
        const progressChangeHTML = progressChange > 0 ? `<span class="bg-green-100 text-green-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">▲ ${progressChange}%</span>` : progressChange < 0 ? `<span class="bg-red-100 text-red-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">▼ ${Math.abs(progressChange)}%</span>` : `<span class="text-gray-400 text-xs font-medium ml-2">—</span>`;
        const checklistHTML = totalSteps > 0 ? checklist.map(cp => `<li class="flex items-center ${cp.completed ? 'text-emerald-300' : 'text-gray-400'}"><span class="w-5 text-left">${cp.completed ? '✓' : '○'}</span><span>${cp.name}</span></li>`).join('') : '<li>無定義的檢查點</li>';
        return `<div class="bg-white border rounded-xl p-4 flex flex-col h-full shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${item.status === 'overdue' ? 'overdue-glow' : 'border-gray-200'}"><div class="flex-grow"><div class="flex justify-between items-start mb-3"><div class="flex-1"><h4 class="font-bold text-lg text-gray-900 mb-1">${item.name} <span class="text-sm font-medium ${getTypeStyle(item.type, item.status)}">(${getTypeText(item.type)})</span></h4>${item.description ? `<p class="text-sm text-gray-500 mt-1 mb-2 whitespace-pre-wrap">${item.description}</p>` : ''}<p class="text-sm text-gray-600">主要負責: ${(item.assignees || []).join(', ')}</p>${item.collaborators && item.collaborators.length > 0 ? `<p class="text-sm text-gray-600">協助: ${item.collaborators.join(', ')}</p>` : ''}</div><div class="flex items-center space-x-2 ml-2"><span class="flex items-center text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor(item.status)} text-white">${getStatusText(item.status)}</span></div></div></div><div class="mt-auto border-t border-gray-100 pt-3"><div class="mb-3"><div class="flex justify-between items-center text-sm mb-1"><span class="text-gray-600 font-semibold">進度: ${item.progress}%</span>${progressChangeHTML}</div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="progress-bar h-2.5 rounded-full ${getStatusColor(item.status)}" style="width: ${item.progress}%"></div></div><div class="relative group"><p class="text-sm text-gray-600 mt-1 cursor-pointer">檢查點: ${completedSteps}/${totalSteps}</p><div class="absolute bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"><h4 class="font-bold mb-2 border-b border-b-slate-600 pb-1">標準化流程</h4><ul class="space-y-1 mt-2">${checklistHTML}</ul><div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div></div></div></div><div class="flex justify-between items-center text-xs text-gray-500"><span>日期: ${formatDate(item.startDate)} - ${item.deadline ? formatDate(item.deadline) : '無'}</span>${item.status === 'overdue' ? '<span class="text-red-600 font-medium">⚠️ 已逾期</span>' : ''}</div>${item.helpMessage ? `<div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start space-x-3"><span class="text-xl pt-1">😭</span><div><p class="font-semibold text-red-800 text-sm">需要協助：</p><p class="text-sm text-red-700 whitespace-pre-wrap">${item.helpMessage}</p></div></div>` : ''}</div></div>`;
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
        const memberItems = allItems.filter(t => (t.assignees || []).includes(name) || (t.collaborators && t.collaborators.includes(name)));
        const overdueCount = memberItems.filter(t => t.status === 'overdue').length;
        const projectCount = memberItems.filter(item => item.type === 'project').length;
        const taskCount = memberItems.filter(item => item.type === 'task').length;
        const isActive = name === currentMemberFilter;
        
        const isBirthday = memberInfo.birthday === todayStr;
        const birthdayContainerClass = isBirthday ? 'birthday-container' : '';
        const birthdayHatHTML = isBirthday ? '<div class="birthday-hat"></div>' : '';
        const confettiHTML = isBirthday ? Array.from({length: 9}).map(() => `<div class="confetti"></div>`).join('') : '';
        return `<div onclick="filterByMember('${name}')" class="group relative ${birthdayContainerClass} flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 ${isActive ? 'bg-blue-100 shadow-md' : 'hover:bg-gray-100 hover:shadow-md hover:scale-105'}">
            <div class="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-52 p-4 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-30">
                <img src="${localProfileImages[name] ? localProfileImages[name] : `https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}`}" alt="${name}" class="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-blue-300 object-cover shadow-md" onerror="this.src='https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}'; this.onerror=null;">
                <p class="font-bold text-center text-gray-900 text-lg">${name}</p>
                <div class="space-y-2 mt-3">
                    <a href="#" onclick="viewMemberHistory('${name}', event)" class="block w-full text-center bg-blue-600 text-white font-semibold py-1.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm">
                        <i class="fas fa-history fa-fw mr-1"></i> 個人歷程
                    </a>
                </div>
                <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white"></div>
            </div>
            ${confettiHTML}
            <div class="flex items-center min-w-0">
                <div class="relative flex-shrink-0">${birthdayHatHTML}${localProfileImages[name] ? `<img src="${localProfileImages[name]}" alt="${name}" class="w-10 h-10 rounded-full object-cover" onerror="this.onerror=null;this.replaceWith(this.parentElement.querySelector('.initial-avatar'))" />` : `<div class="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-semibold initial-avatar">${name.charAt(0)}</div>`}</div>
                <div class="ml-3 min-w-0"><p class="font-medium text-gray-900 truncate">${name}</p><div class="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-1"><span>專案: ${projectCount}</span><span>任務: ${taskCount}</span></div></div>
            </div>
            <div class="text-right flex-shrink-0 ml-2">${overdueCount > 0 ? `<span class="text-xs font-bold text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">${overdueCount}</span>` : ''}</div>
        </div>`;
    }).join('');
}
function updateStats(itemsToCount) {
    // === 修正：讓所有卡片都計算所有類型的項目 ===
    
    // 移除'projectsAndTasks'篩選，直接使用'itemsToCount'
    // const projectsAndTasks = itemsToCount.filter(item => item.type === 'project' || item.type === 'task');
    
    // 總項目數
    document.getElementById('totalTasks').textContent = itemsToCount.length;
    
    // 進行中 (計算所有 'active' 項目)
    document.getElementById('activeTasks').textContent = itemsToCount.filter(t => t.status === 'active').length;
    
    // 逾期項目 (計算所有 'overdue' 項目)
    document.getElementById('overdueTasks').textContent = itemsToCount.filter(t => t.status === 'overdue').length;
    
    // 已完成 (計算所有 'completed' 項目)
    document.getElementById('completedTasks').textContent = itemsToCount.filter(t => t.status === 'completed').length;
    
    // === 移除錯誤的 'activityCount' ===
    // (下面這行會導致錯誤，因為 project.html 中沒有 'activityCount' 元素)
    // const activitiesAndMeetings = itemsToCount.filter(item => item.type === 'activity' || item.type === 'meeting');
    // document.getElementById('activityCount').textContent = activitiesAndMeetings.length;

    // 榮譽榜
    document.getElementById('honorCount').textContent = allHonors.length;
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
    const membersInGroup = currentGroupFilter === 'all' ? membersAfterUnitFilter : membersAfterUnitFilter.filter(s => s.group === currentGroupFilter);
    const finalVisibleMemberNames = membersInGroup.map(m => m.name);
    let itemsToConsider = itemsForMonth.filter(item => (item.assignees || []).some(assignee => finalVisibleMemberNames.includes(assignee)) || (item.collaborators && item.collaborators.some(collaborator => finalVisibleMemberNames.includes(collaborator))));
    if (currentSearchTerm) {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        itemsToConsider = itemsToConsider.filter(item => item.name.toLowerCase().includes(lowerCaseTerm) || (item.description && item.description.toLowerCase().includes(lowerCaseTerm)));
    }
    let itemsToDisplay = itemsToConsider;
    if (currentMemberFilter !== 'all') {
        itemsToDisplay = itemsToConsider.filter(item => (item.assignees || []).includes(currentMemberFilter) || (item.collaborators && item.collaborators.includes(currentMemberFilter)));
    }
    itemsToDisplay.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    updateStats(itemsToConsider);
    renderTeamMembers(membersInGroup, itemsToConsider);
    
    // ==================================================================
    // === 修正點：移除 .filter(...) ===
    // 原本: renderItems(itemsToDisplay.filter(item => item.type === 'project' || item.type === 'task'));
    // 修正後:
    renderItems(itemsToDisplay); // 顯示所有類型的項目 (project, task, activity, meeting)
    // ==================================================================
}

// --- Filtering Functions ---
function filterByUnit(unit){currentUnitFilter=unit,currentGroupFilter="all",currentMemberFilter="all",document.querySelectorAll(".unit-tab-btn").forEach(e=>{e.classList.toggle("tab-active",e.id===`tab-unit-${unit.replace(/\s/g,"-")}`),e.classList.toggle("bg-gray-100",e.id!==`tab-unit-${unit.replace(/\s/g,"-")}`),e.classList.toggle("hover:bg-gray-200",e.id!==`tab-unit-${unit.replace(/\s/g,"-")}`)}),renderDashboard()}
function filterBySearch(e){currentSearchTerm=e,renderDashboard()}
function filterByYear(e){currentYearFilter=e,renderDashboard()}
function filterByMonth(e){currentMonthFilter=e,renderDashboard()}
function filterByGroup(e){currentGroupFilter=e,currentMemberFilter="all",document.querySelectorAll(".group-tab-btn").forEach(t=>{t.classList.toggle("tab-active",t.id===`tab-${e}`)}),renderDashboard()}
function filterByMember(e){currentMemberFilter=currentMemberFilter===e?"all":e,renderDashboard()}
function filterItemsByStatus(e,t){currentStatusFilter=e;const o={all:["bg-blue-100","text-blue-700"],planning:["bg-yellow-100","text-yellow-700"],active:["bg-purple-100","text-purple-700"],completed:["bg-green-100","text-green-700"],overdue:["bg-red-100","text-red-700"]};document.querySelectorAll(".filter-btn").forEach(e=>{e.classList.remove("active",...Object.values(o).flat()),e.classList.add("bg-gray-100","text-gray-700")}),t.target.classList.add("active",...o[e]),t.target.classList.remove("bg-gray-100","text-gray-700"),renderDashboard()}

// --- Feature Functions (Modals, etc.) ---
function viewMemberHistory(e,t){t.stopPropagation(),"盧英云"===e?window.open("https://qpig0218.github.io/Ying-Yun/","_blank"):alert(`檢視 ${e} 的個人歷程 (功能開發中)`)}
function showItemsInModal(e){const t=document.getElementById("itemListModal"),o=document.getElementById("itemListModalTitle"),s=document.getElementById("itemListModalContent");let n=[],a="";const r=allActivities.filter(e=>"project"===e.type||"task"===e.type),i={active:1,planning:2,overdue:3,completed:4};switch(e){case"total":
    // === 修正：點擊「總項目」卡片時，顯示所有項目 ===
    n = allActivities
        .filter(item => {
             // 過濾邏輯：確保項目至少有一個負責人是在當前篩選的 staffData 範圍內
             const visibleStaffNames = staffData
                .filter(s => currentUnitFilter === 'all' || s.unit === currentUnitFilter)
                .filter(s => currentGroupFilter === 'all' || s.group === currentGroupFilter)
                .map(s => s.name);
            
             return (item.assignees || []).some(assignee => visibleStaffNames.includes(assignee)) ||
                    (item.collaborators || []).some(collaborator => visibleStaffNames.includes(collaborator));
        })
        .sort((e,t)=>(i[e.status]||99)-(i[t.status]||99));
    a="總項目列表";
    break;
case"active":n=r.filter(e=>"active"===e.status),a="進行中項目列表";break;case"overdue":n=r.filter(e=>"overdue"===e.status),a="逾期項目列表";break;case"completed":n=allActivities.filter(e=>"completed"===e.status),a="已完成項目列表"}o.innerHTML=`<i class="fas fa-list-check mr-3"></i> ${a} (${n.length})`,s.innerHTML=0===n.length?'<p class="text-center text-gray-500 py-4">此類別中沒有項目。</p>':n.map(e=>`<div class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"><p class="font-semibold text-gray-800">${e.name}</p><p class="text-sm text-gray-600">負責人: ${(e.assignees||[]).join(", ")}</p><div class="flex justify-between items-center text-xs mt-1"><span class="font-medium ${getTypeStyle(e.type,e.status)}">(${getTypeText(e.type)})</span><span class="px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(e.status)} text-white">${getStatusText(e.status)}</span></div></div>`).join(""),t.classList.remove("hidden")}

// === 新增：日曆相關功能 ===
function renderCalendarView() {
    const contentEl = document.getElementById('activity-content');
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayIndex = firstDay.getDay(); // 0 = Sunday, 1 = Monday...
    const lastDate = lastDay.getDate();

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

    // 篩選出當前的活動
    const eventsThisMonth = allActivities.filter(item => {
        const itemDate = new Date(item.startDate);
        return (item.type === 'activity' || item.type === 'meeting') &&
               itemDate.getFullYear() === year &&
               itemDate.getMonth() === month;
    });

    let calendarHTML = `
        <div class="flex justify-between items-center mb-4">
            <button onclick="prevMonth()" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">&lt; 上個月</button>
            <h3 class="text-lg font-bold">${year}年 ${monthNames[month]}</h3>
            <button onclick="nextMonth()" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">下個月 &gt;</button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center font-medium text-gray-600">
            ${dayNames.map(day => `<div class="p-2 bg-gray-100 rounded-t-lg">${day}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7 gap-1 border border-t-0 border-gray-200 rounded-b-lg p-1">
    `;

    // 補齊開頭的空白
    for (let i = 0; i < firstDayIndex; i++) {
        calendarHTML += `<div class="h-20"></div>`;
    }

    // 填入日期
    for (let day = 1; day <= lastDate; day++) {
        const today = new Date();
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const eventsOnThisDay = eventsThisMonth.filter(e => e.startDate && e.startDate.startsWith(dateStr));
        
        let dayClass = 'h-20 p-1.5 border border-gray-100 rounded-md transition-colors hover:bg-gray-50';
        if (isToday) dayClass += ' bg-blue-50 border-blue-300';
        if (eventsOnThisDay.length > 0) dayClass += ' bg-orange-50 cursor-pointer';

        calendarHTML += `
            <div class="${dayClass}" onclick="showEventsForDay('${dateStr}')">
                <div class="font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}">${day}</div>
                ${eventsOnThisDay.length > 0 ? `
                    <div class="mt-1 text-xs text-orange-700 bg-orange-200 rounded-full px-1.5 py-0.5 font-medium">
                        ${eventsOnThisDay.length} 個活動
                    </div>
                ` : ''}
            </div>
        `;
    }

    calendarHTML += `</div><div id="event-list-for-day" class="mt-4"></div>`;
    contentEl.innerHTML = calendarHTML;
}

function prevMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendarView();
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendarView();
}

function showEventsForDay(dateStr) {
    const eventsOnThisDay = allActivities.filter(e => 
        (e.type === 'activity' || e.type === 'meeting') && 
        e.startDate && e.startDate.startsWith(dateStr)
    );
    
    const eventListEl = document.getElementById('event-list-for-day');
    if (eventsOnThisDay.length === 0) {
        eventListEl.innerHTML = `<p class="text-center text-gray-500"> ${new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {month: 'long', day: 'numeric'})} 沒有活動。</p>`;
        return;
    }

    eventListEl.innerHTML = `
        <h4 class="text-md font-bold text-gray-800 mb-2">${new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {month: 'long', day: 'numeric'})} 的活動/會議</h4>
        <div class="space-y-2">
            ${eventsOnThisDay.map(item => `
                <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p class="font-semibold ${getTypeStyle(item.type, item.status)}">${item.name} <span class="text-sm font-medium">(${getTypeText(item.type)})</span></p>
                    <p class="text-sm text-gray-600">負責人: ${(item.assignees || []).join(', ')}</p>
                    ${item.description ? `<p class="text-xs text-gray-500 mt-1">${item.description}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}
// === 結束：日曆相關功能 ===


function openHonorRollModal() {
    const modal = document.getElementById('honorRollModal');
    const contentEl = document.getElementById('honor-roll-content');
    
    const sortedHonors = [...allHonors].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedHonors.length === 0) {
        contentEl.innerHTML = '<p class="text-center text-gray-500 py-8">目前尚無榮譽事項記錄。</p>';
    } else {
        contentEl.innerHTML = sortedHonors.map(honor => {
            const isPdf = honor.fileName && honor.fileName.toLowerCase().endsWith('.pdf');
            
            // === 最終修正：改用 Google Drive 更可靠的 `thumbnail` 連結格式來強制顯示圖片 ===
            const imgSrc = honor.fileId ? `https://drive.google.com/thumbnail?id=${honor.fileId}&sz=w400` : '#'; // sz=w400 代表圖片寬度約 400px
            const fileLink = honor.fileId ? `https://drive.google.com/file/d/${honor.fileId}/view` : '#';

            return `
            <div class="bg-white rounded-xl shadow-lg p-5 border border-gray-200 mb-6 transition-all hover:shadow-2xl hover:border-yellow-400">
                <div class="grid md:grid-cols-3 gap-6 items-center">
                    <div class="md:col-span-1">
                        ${honor.fileId ? (
                            isPdf ? `
                            <a href="${fileLink}" target="_blank" class="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100">
                                <i class="fas fa-file-pdf text-red-500 text-6xl"></i>
                                <span class="mt-2 font-semibold text-sm text-gray-700 truncate w-full">${honor.fileName || '點擊查看PDF'}</span>
                            </a>
                            ` : `
                            <a href="${fileLink}" target="_blank">
                                <img src="${imgSrc}" alt="${honor.title}" class="w-full h-48 object-contain rounded-lg bg-gray-50 p-2">
                            </a>
                            `
                        ) : `
                        <div class="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                            <i class="fas fa-award text-gray-300 text-6xl"></i>
                        </div>
                        `}
                    </div>
                    <div class="md:col-span-2">
                        <span class="text-sm font-semibold text-yellow-600">${formatDate(honor.date)}</span>
                        <h3 class="text-2xl font-bold text-gray-900 mt-1">${honor.title}</h3>
                        <p class="text-base text-gray-600 mt-2 mb-4 whitespace-pre-wrap">${honor.description || ''}</p>
                        <div class="border-t pt-3">
                            <p class="text-sm font-semibold text-gray-800">🏆 獲獎人員:</p>
                            <p class="text-gray-700">${(honor.recipients || []).join(', ')}</p>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }
    modal.classList.remove('hidden');
}

function generateWeeklySummary() {
    const content = document.getElementById('weekly-summary-content');
    content.innerHTML = `<div class="p-8 flex items-center justify-center"><i class="fas fa-spinner fa-spin text-2xl text-green-500 mr-3"></i> 正在生成週報...</div>`;
    const today = new Date();
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(today.getDate() - 7);
    const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
    const projectsAndTasks = allActivities.filter(item => ['project', 'task'].includes(item.type));
    const completedThisWeek = projectsAndTasks.filter(item => { if (item.status !== 'completed') return false; const completionDate = item.deadline ? new Date(item.deadline) : new Date(item.startDate); return completionDate >= oneWeekAgo && completionDate <= today; });
    const progressMade = projectsAndTasks.filter(item => item.status !== 'completed' && item.progress > (item.lastWeekProgress || 0));
    const newlyAdded = projectsAndTasks.filter(item => new Date(item.startDate) >= oneWeekAgo && new Date(item.startDate) <= today);
    const stalled = projectsAndTasks.filter(item => item.status === 'active' && item.progress === (item.lastWeekProgress || 0) && item.progress < 100);
    const upcomingDeadlines = projectsAndTasks.filter(item => item.deadline && new Date(item.deadline) > today && new Date(item.deadline) <= nextWeek && item.status !== 'completed');
    const helpNeeded = projectsAndTasks.filter(item => item.helpMessage && item.helpMessage.trim() !== '');
    const totalProgressGained = progressMade.reduce((sum, item) => sum + (item.progress - (item.lastWeekProgress || 0)), 0);
    const memberContributions = {};
    progressMade.forEach(item => {
        const progress = item.progress - (item.lastWeekProgress || 0);
        item.assignees.forEach(name => {
            if (!memberContributions[name]) memberContributions[name] = 0;
            memberContributions[name] += progress;
        });
    });
    let mvp = { name: '無', score: 0 };
    for (const name in memberContributions) {
        if (memberContributions[name] > mvp.score) {
            mvp = { name: name, score: memberContributions[name] };
        }
    }
    const renderSummarySection = (title, icon, color, items, emptyText) => {
        let sectionHTML = `<div class="mb-4"><h3 class="text-base font-bold ${color} flex items-center mb-2"><i class="fas ${icon} fa-fw mr-2"></i>${title} (${items.length})</h3>`;
        if (items.length > 0) {
            sectionHTML += '<ul class="space-y-2 pl-5">' + items.map(item =>
                `<li class="text-sm text-gray-800 p-2 bg-gray-50 rounded-md border-l-4 ${color.replace('text-', 'border-')}">
                    <strong>${item.name}</strong> - <span class="text-gray-500">負責人: ${(item.assignees || []).join(', ')}</span>
                    ${title.includes('進度') ? `<span class="font-medium text-green-600"> (+${item.progress - (item.lastWeekProgress || 0)}%)</span>` : ''}
                    ${title.includes('到期') ? `<span class="font-medium text-yellow-800"> (到期日: ${formatDate(item.deadline)})</span>` : ''}
                    ${title.includes('協助') ? `<p class="text-sm text-red-700 mt-1 pl-2 border-l-2 border-red-200 bg-red-50 py-1"><em>"${item.helpMessage}"</em></p>` : ''}
                </li>`
            ).join('') + '</ul>';
        } else {
            sectionHTML += `<p class="pl-5 text-sm text-gray-500">${emptyText}</p>`;
        }
        sectionHTML += `</div>`; return sectionHTML;
    };
    let summaryHTML = `
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h3 class="text-lg font-bold text-blue-800 mb-2">本週團隊數據總覽</h3>
            <div class="grid grid-cols-2 gap-4 text-center">
                <div><p class="text-2xl font-bold text-blue-700">${completedThisWeek.length}</p><p class="text-sm text-gray-600">完成項目數</p></div>
                <div><p class="text-2xl font-bold text-green-700">+${totalProgressGained}%</p><p class="text-sm text-gray-600">總進度推進</p></div>
            </div>
        </div>
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
             <h3 class="text-lg font-bold text-amber-800 mb-2 flex items-center"><i class="fas fa-star mr-2 text-yellow-500"></i>本週之星</h3>
             ${mvp.name !== '無' ? `<p class="text-center"><span class="font-bold text-xl text-amber-900">${mvp.name}</span> <br> <span class="text-sm text-gray-600">以 <strong class="text-amber-700">${mvp.score}%</strong> 的總進度貢獻拔得頭籌！</span></p>` : `<p class="text-center text-gray-500">本週尚無明顯的進度貢獻者，下週加油！</p>`}
        </div>
    `;
    summaryHTML += renderSummarySection('本週完成項目', 'fa-check-circle', 'text-green-600', completedThisWeek, '本週沒有完成的項目。');
    summaryHTML += renderSummarySection('本週進度更新', 'fa-rocket', 'text-blue-600', progressMade, '本週沒有項目取得進展。');
    summaryHTML += renderSummarySection('本週新增項目', 'fa-lightbulb', 'text-purple-600', newlyAdded, '本週沒有新增項目。');
    summaryHTML += renderSummarySection('下週到期項目', 'fa-clock', 'text-yellow-600', upcomingDeadlines, '下週沒有即將到期的項目。');
    summaryHTML += renderSummarySection('進度停滯項目', 'fa-pause-circle', 'text-orange-500', stalled, '所有項目皆有進展，太棒了！');
    summaryHTML += renderSummarySection('需要協助項目', 'fa-hands-helping', 'text-red-600', helpNeeded, '沒有項目發出求救信號。');
    content.innerHTML = summaryHTML;
}

function generateDashboardReportHTML() {
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    const todayString = today.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
    const projectsAndTasks = allActivities.filter(item => ['project', 'task'].includes(item.type));
    const overdueProjects = projectsAndTasks.filter(i => i.status === 'overdue');
    const stalledProjects = projectsAndTasks.filter(i => i.status === 'active' && i.progress === (i.lastWeekProgress || 0) && i.progress < 100);
    const helpNeededProjects = projectsAndTasks.filter(i => i.helpMessage && i.helpMessage.trim() !== '');
    const nearingCompletion = projectsAndTasks.filter(i => i.progress >= 80 && i.status !== 'completed');
    const birthdayMembers = staffData.filter(s => s.birthday === todayStr);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentHonors = allHonors.filter(h => new Date(h.date) >= oneMonthAgo);
    const createSection = (title, icon, colorClass, items, emptyText) => {
        if (items.length === 0) return emptyText ? `<p class="text-sm text-gray-500 pl-2">${emptyText}</p>`: '';
        let itemsHtml = items.map(item => `<li class="text-sm text-gray-800"><span class="font-semibold">"${item.name}"</span> - (主責: ${item.assignees.join(', ') || '未指定'})</li>`).join('');
        return `<div class="p-3 bg-white rounded-lg border-l-4 ${colorClass} shadow-sm"><h3 class="font-bold text-gray-800 flex items-center mb-2"><i class="fas ${icon} fa-fw mr-2"></i>${title} (${items.length})</h3><ul class="space-y-1 pl-5 list-disc">${itemsHtml}</ul></div>`;
    };
    let reportHTML = `
        <div class="space-y-4 text-gray-800">
            <div><h2 class="text-lg font-bold text-gray-900">膠部領航員 日常戰報</h2><p class="text-sm text-gray-500">報告時間：${todayString}</p></div>
            <p>教學部戰隊的各位夥伴，早安！領航員回報，本日戰線情報分析如下：</p>
    `;
    if (birthdayMembers.length > 0) {
        reportHTML += `<div class="p-3 bg-rose-50 rounded-lg border-l-4 border-rose-400 shadow-sm animate-pulse"><h3 class="font-bold text-rose-800 flex items-center mb-1"><i class="fas fa-birthday-cake fa-fw mr-2"></i>特別情報！</h3><p class="text-sm text-rose-700">領航員偵測到一股強大的快樂能量... 原來是 <strong class="font-bold">${birthdayMembers.map(m=>m.name).join('、')}</strong> 的生日！艦橋全體人員在此獻上最誠摯的祝福！</p></div>`;
    }
    if (recentHonors.length > 0) {
        reportHTML += `
        <div class="p-3 bg-green-50 rounded-lg border-l-4 border-green-500 shadow-sm">
            <h3 class="font-bold text-green-800 flex items-center mb-1"><i class="fas fa-medal fa-fw mr-2"></i>近期戰功速報！</h3>
            <p class="text-sm text-green-700">恭喜團隊成員在近期締造佳績：<strong class="font-bold">"${recentHonors.map(h => h.title).join('、')}"</strong>！讓我們為獲獎的英雄們喝采！</p>
        </div>`;
    }
    const topTarget = overdueProjects.find(p => p.priority === 'high') || overdueProjects[0] || stalledProjects.find(p => p.priority === 'high') || stalledProjects[0];
    if (topTarget) {
         reportHTML += `<div class="p-3 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm"><h3 class="font-bold text-red-800 flex items-center mb-1"><i class="fas fa-crosshairs fa-fw mr-2"></i>今日首要目標</h3><p class="text-sm text-red-700">領航員已鎖定今日首要殲滅目標：<strong class="font-bold">"${topTarget.name}"</strong>！此項目已進入紅色警戒，請 ${topTarget.assignees.join(', ')} 集中火力，優先處理！</p></div>`;
    }
    reportHTML += createSection('前線膠著區', 'fa-traffic-jam', 'border-yellow-500', stalledProjects);
    reportHTML += createSection('緊急呼救', 'fa-first-aid', 'border-amber-500', helpNeededProjects, '✔️ 各單位回報狀況良好，無人請求支援。');
    reportHTML += createSection('即將攻頂', 'fa-flag-checkered', 'border-green-500', nearingCompletion);
    if (overdueProjects.length > 0 || stalledProjects.length > 0 || helpNeededProjects.length > 0) {
        reportHTML += `<p class="pt-2 text-sm">⚠️ <strong>戰報總結</strong>：戰場上出現了需要優先處理的目標，請各單位根據情報採取行動，確保戰役順利進行。領航員將持續監控戰場！</p>`;
    } else {
        reportHTML += `<p class="pt-2 text-sm">✅ <strong>戰報總結</strong>：本日戰況一切良好！所有戰線均在掌控之中，請各位夥伴繼續保持！領航員為你們感到驕傲！</p>`;
    }
    reportHTML += `</div>`;
    return reportHTML;
}

// --- AI & Setup Functions ---
async function getAiSuggestions(e="all"){const t=document.getElementById("ai-suggestion-content"),o=["正在準備您的專案數據...","已連線至 AI 引擎...","AI 正在分析風險與機會...","生成個人化決策建議中...","幾乎完成了..."];let s=0;t.innerHTML=`<div class="flex flex-col items-center justify-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i><p id="ai-loading-message" class="mt-4 text-gray-600 font-medium">${o[0]}</p></div>`;const n=document.getElementById("ai-loading-message"),a=setInterval(()=>{s=(s+1)%o.length,n&&(n.textContent=o[s])},1500);let r=allActivities.filter(e=>["project","task"].includes(e.type));let i="整個團隊";"all"!==e&&(i=e,r=r.filter(t=>(t.assignees||[]).includes(e)||t.collaborators&&t.collaborators.includes(e)));try{const e=await fetch(SCRIPT_URL,{method:"POST",mode:"cors",body:JSON.stringify({action:"getAiSuggestionProxy",payload:{items:r,memberName:i}}),headers:{"Content-Type":"text/plain;charset=utf-8"}});if(!e.ok){const t=await e.text();throw new Error(`網路回應錯誤: ${t}`)}const o=await e.json(),s=o.candidates[0].content.parts[0].text;renderAiReport(s)}catch(e){console.error("AI suggestion fetch failed:",e),t.innerHTML=`<div class="p-4 bg-red-100 text-red-700 rounded-lg"><p class="font-bold">唉呀！AI 引擎連線失敗</p><p>${e.message}</p></div>`}finally{clearInterval(a)}}
function renderAiReport(e){const t=document.getElementById("ai-suggestion-content");let o=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/### (.*?)\n/g,'<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h3>').replace(/## (.*?)\n/g,'<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>').replace(/\* (.*?)\n/g,'<li class="ml-5 list-disc">$1</li>').replace(/\n/g,"<br>");t.innerHTML=`<div class="prose max-w-none">${o}</div>`}
function setupUserInfo(){const e=document.getElementById("welcome-message"),t=document.getElementById("logoutBtn"),o=document.getElementById("admin-link"),s=sessionStorage.getItem("dashboardUser");if(s){const n=JSON.parse(s);e.textContent=`${n.name} 您好`,o.href=`project-admin.html?user=${encodeURIComponent(n.name)}&id=${encodeURIComponent(n.employeeId)}`,t.addEventListener("click",()=>{sessionStorage.removeItem("dashboardUser"),window.location.href="index.html"})}}
function setupModal(e,t,o,s){const n=document.getElementById(e);if(!n)return;const a=t?document.getElementById(t):null,r=document.getElementById(o),i=()=>{n.classList.remove("hidden"),s&&s()},c=()=>{n.classList.add("hidden")};a&&a.addEventListener("click",i),r&&r.addEventListener("click",c),n.addEventListener("click",e=>{e.target===n&&c()})}
function populateAiMemberFilter(){const e=document.getElementById("aiMemberFilter");if(e&&staffData.length>0){e.innerHTML='<option value="all">針對 整個團隊 分析</option>';const t=staffData.filter(e=>"all"===currentGroupFilter||e.group===currentGroupFilter).filter(e=>"all"===currentUnitFilter||e.unit===currentUnitFilter);t.forEach(t=>{const o=document.createElement("option");o.value=t.name,o.textContent=`針對 ${t.name} 分析`,e.appendChild(o)})}}
function setupAiModal(){const e=document.getElementById("aiModal"),t=document.getElementById("aiBtn"),o=document.getElementById("closeAiModalBtn"),s=document.getElementById("permissionDeniedModal"),n=document.getElementById("closePermissionDeniedModalBtn");if(t){t.addEventListener("click",()=>{const t=sessionStorage.getItem("dashboardUser"),o=JSON.parse(t);o&&"主管"===o.role?(e.classList.remove("hidden"),populateAiMemberFilter(),getAiSuggestions("all")):s.classList.remove("hidden")}),o.addEventListener("click",()=>e.classList.add("hidden")),e.addEventListener("click",t=>{t.target===e&&e.classList.add("hidden")}),n.addEventListener("click",()=>s.classList.add("hidden")),s.addEventListener("click",e=>{e.target===s&&s.classList.add("hidden")});const a=document.getElementById("aiMemberFilter");if(a){const e=a.cloneNode(!0);a.parentNode.replaceChild(e,a),e.addEventListener("change",e=>getAiSuggestions(e.target.value))}}}
function setupWeeklySummaryModal(){setupModal("weeklySummaryModal","weeklySummaryBtn","closeWeeklySummaryBtn",generateWeeklySummary)}
function setupItemListModal(){setupModal("itemListModal",null,"closeItemListModalBtn")}

// === 新增：設定活動日曆 Modal ===
function setupActivityModal() {
    setupModal("activityModal", "activityBtn", "closeActivityModalBtn", () => {
        calendarDate = new Date(); // 每次打開時都重設為當前月份
        renderCalendarView();
    });
}
// ==================================

function setupHonorRollModal(){setupModal("honorRollModal",null,"closeHonorRollModalBtn")}
function setupScrollToTop(){const e=document.getElementById("scrollToTopBtn");e&&(window.onscroll=()=>{document.body.scrollTop>20||document.documentElement.scrollTop>20?e.classList.remove("hidden"):e.classList.add("hidden")},e.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})))}
function setupChatBot(){const e=document.getElementById("openChatBot");if(!e)return;const t=document.getElementById("closeChatBot"),o=document.getElementById("chatBotContainer"),s=document.getElementById("chatBotMessages");e.addEventListener("click",()=>{o.classList.remove("hidden"),s.innerHTML=`<div class="p-4 bg-gray-100 rounded-lg">${generateDashboardReportHTML()}</div>`}),t.addEventListener("click",()=>o.classList.add("hidden"))}
function setupDutySearchModal(){const e=document.getElementById("dutySearchModal"),t=document.getElementById("openDutySearchBtn"),o=document.getElementById("closeDutySearchModalBtn"),s=document.getElementById("dutySearchInput"),n=document.getElementById("dutySearchResults"),a=(e,t="")=>{const o=t.toLowerCase();let s="";const a=Object.keys(e).sort((e,t)=>e.localeCompare(t,"zh-Hant"));let r=!1;for(const t of a){const a=e[t],i=t.toLowerCase().includes(o),c=a.filter(e=>e.name.toLowerCase().includes(o)||e.description.toLowerCase().includes(o));let l=[];i?l=a:c.length>0&&(l=c),l.length>0&&(r=!0,s+=`<div class="mb-4"><h3 class="text-lg font-bold text-gray-800 sticky top-0 bg-white py-2 border-b-2 border-blue-600 z-10">${t}</h3><div class="space-y-2 mt-2">`,l.forEach(e=>{s+=`<div class="p-3 bg-gray-50 rounded-lg border"><p class="font-semibold text-gray-900">${e.name}</p><p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">${e.description}</p></div>`}),s+="</div></div>")}r?n.innerHTML=s:n.innerHTML='<p class="text-center text-gray-500 pt-8">找不到符合條件的業務或同仁</p>'};t.addEventListener("click",async()=>{if(e.classList.remove("hidden"),e.classList.add("flex"),s.focus(),0===Object.keys(allDutiesData).length){n.innerHTML=`<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i><p class="mt-2">正在載入業務總覽...</p></div>`;try{const e=await fetch(SCRIPT_URL,{method:"POST",mode:"cors",body:JSON.stringify({action:"getAllDuties"}),headers:{"Content-Type":"text/plain;charset=utf-8"}}),t=await e.json();"success"===t.status?(allDutiesData=t.data,a(allDutiesData)):new Error(t.message)}catch(e){n.innerHTML=`<p class="text-center text-red-500 pt-8">載入業務總覽失敗: ${e.message}</p>`}}else a(allDutiesData,s.value)}),o.addEventListener("click",()=>e.classList.add("hidden")),e.addEventListener("click",t=>{t.target===e&&e.classList.add("hidden")}),s.addEventListener("input",e=>{a(allDutiesData,e.target.value)})}

// --- Initial Load ---
async function initializeDashboard() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorDisplay = document.getElementById('errorDisplay');
    loadingOverlay.classList.remove('hidden');
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'getDashboardData' }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        if (result.status !== 'success' || !result.data) throw new Error(result.message || "回傳的資料格式不正確");
        
        const userData = result.data.staffData || [];
        staffData = userData.map(user => ({ id: user.employeeId, name: user.name, group: user.group, birthday: user.birthday, unit: user.unit }));
        
        allHonors = result.data.honors || []; // 新增：取得榮譽榜資料

        const itemData = result.data.activities || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        allActivities = itemData.map(item => {
            const progress = parseInt(item.progress, 10) || 0;
            const deadline = item.deadline ? new Date(item.deadline) : null;
            let finalStatus = item.status || 'planning';
            if (progress >= 100) finalStatus = 'completed';
            else if (finalStatus !== 'completed' && deadline && deadline < today) finalStatus = 'overdue';
            return { ...item, progress, status: finalStatus, lastWeekProgress: item.lastWeekProgress ? parseInt(item.lastWeekProgress, 10) : 0, helpMessage: item.helpMessage || '', checklist: Array.isArray(item.checklist) ? item.checklist : [] };
        });
        renderUnitTabs();
        renderYearFilter();
        renderMonthFilter();
        renderDashboard();
        
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
    if (!sessionStorage.getItem('dashboardUser')) {
        window.location.href = 'index.html';
        return;
    }
    setupUserInfo();
    setupAiModal();
    setupWeeklySummaryModal();
    setupScrollToTop();
    setupItemListModal();
    setupDutySearchModal();
    setupActivityModal(); // === 新增：啟用活動日曆 Modal ===
    setupHonorRollModal(); 
    setupChatBot();
    await initializeDashboard();
});
