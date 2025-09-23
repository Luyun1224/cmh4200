// script.js (FINAL & COMPLETE - v13.4 with Total Duty Overview)
// --- Configuration & State Variables ---
[cite_start]const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvl5lYY1LssljDNJJyGuAGsLd3D0sbGSs4QTZxgz2PAZJ38EpsHzEk740LGiQ5AMok/exec"; [cite: 180]
[cite_start]let allActivities = []; [cite: 180]
[cite_start]let staffData = []; [cite: 181]
[cite_start]const localProfileImages = { '盧英云': '盧英云.png', '陳詩芸': '陳詩芸.jpg', '楊宜婷': '楊宜婷.png','黃惠津': '黃惠津.png','王嬿茹': '王嬿茹.png','侯昱瑾': '侯昱瑾.png','高瑞穗': '高瑞穗.png','林盟淦': '林盟淦.png','吳曉琪': '吳曉琪.png','許淑怡': '許淑怡.png','林汶秀': '林汶秀.png','林淑雅': '林淑雅.png','廖家德': '廖家德.jpg','劉雯': '劉雯.jpg','楊依玲': '楊依玲.png','李迎真': '李迎真.png','蔡長志': '蔡長志.png','郭妍伶': '郭妍伶.png','郭進榮': '郭進榮.png'}; [cite: 181]
[cite_start]let currentUnitFilter = 'all'; [cite: 182]
[cite_start]let currentGroupFilter = 'all'; [cite: 182]
[cite_start]let currentStatusFilter = 'all'; [cite: 182]
[cite_start]let currentMemberFilter = 'all'; [cite: 182]
[cite_start]let currentYearFilter = 'all'; [cite: 183]
[cite_start]let currentMonthFilter = 'all'; [cite: 183]
[cite_start]let currentSearchTerm = ''; [cite: 183]
[cite_start]let calendarDate = new Date(); [cite: 183]
let allDutiesData = {}; // 全域變數，用來快取所有業務職掌資料

// --- Helper Functions ---
[cite_start]const getStatusColor = (status) => ({ completed: 'bg-green-500', active: 'bg-purple-500', overdue: 'bg-red-500', planning: 'bg-yellow-500' }[status] || 'bg-gray-500'); [cite: 184]
[cite_start]const getStatusText = (status) => ({ completed: '已完成', active: '進行中', overdue: '逾期', planning: '規劃中' }[status] || '未知'); [cite: 185]
[cite_start]const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('zh-TW') : ''; [cite: 186]
[cite_start]const getTypeText = (type) => ({ project: '專案', task: '任務', activity: '活動', meeting: '會議' }[type] || '項目'); [cite: 187]
[cite_start]const getTypeStyle = (type, status) => { [cite: 188]
    [cite_start]switch(type) { [cite: 188]
        [cite_start]case 'project': return 'text-blue-700'; [cite: 188]
        [cite_start]case 'task': return 'text-green-700'; [cite: 189]
        [cite_start]case 'activity': return 'text-purple-700'; [cite: 189]
        case 'meeting': return status === 'completed' ? [cite_start]'text-gray-400' : 'text-indigo-700'; [cite: 189]
        [cite_start]default: return 'text-gray-500'; [cite: 190]
    }
};

// --- Rendering Functions ---
[cite_start]function renderUnitTabs() { [cite: 190]
    [cite_start]const tabsContainer = document.getElementById('unitTabs'); [cite: 190]
    [cite_start]if (!staffData || staffData.length === 0) return; [cite: 191]
    [cite_start]const units = ['all', ...new Set(staffData.map(s => s.unit).filter(Boolean))]; [cite: 191]
    [cite_start]tabsContainer.innerHTML = units.map(unit => { [cite: 192]
        const unitName = unit === 'all' ? [cite_start]'全部單位' : unit; [cite: 192]
        [cite_start]return `<button onclick="filterByUnit('${unit}')" id="tab-unit-${unit}" class="unit-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${unit === currentUnitFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">${unitName}</button>`; [cite: 192]
    }).join('');
}
[cite_start]function renderGroupTabs(membersToConsider) { [cite: 193]
    [cite_start]const tabsContainer = document.getElementById('groupTabs'); [cite: 193]
    [cite_start]let groups = [...new Set(membersToConsider.map(s => s.group).filter(Boolean))]; [cite: 193]
    [cite_start]const desiredOrder = ['教學行政組', '一般科', '臨床技能中心', '教師培育中心', '實證醫學暨醫療政策中心', '視聽中心', '圖書館']; [cite: 194]
    [cite_start]groups.sort((a, b) => { [cite: 195]
        [cite_start]const indexA = desiredOrder.indexOf(a); [cite: 195]
        [cite_start]const indexB = desiredOrder.indexOf(b); [cite: 195]
        if (indexA !== -1 && indexB !== -1) { return indexA - indexB; [cite_start]} [cite: 195]
        if (indexA !== -1) { return -1; [cite_start]} [cite: 195]
        if (indexB !== -1) { return 1; [cite_start]} [cite: 195]
        [cite_start]return a.localeCompare(b, 'zh-Hant'); [cite: 195]
    });
    [cite_start]if (groups.length <= 1 && currentUnitFilter !== 'all') { [cite: 196]
        [cite_start]tabsContainer.innerHTML = ''; [cite: 196]
        [cite_start]tabsContainer.style.padding = '0'; [cite: 197]
        [cite_start]return; [cite: 197]
    }
    [cite_start]tabsContainer.style.padding = '0.75rem 0'; [cite: 197]
    [cite_start]let buttonsHTML = ''; [cite: 197]
    [cite_start]if(groups.length > 0) { [cite: 198]
        [cite_start]buttonsHTML += `<button onclick="filterByGroup('all')" id="tab-all" class="group-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${'all' === currentGroupFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">全部組別</button>`; [cite: 198]
    }
    [cite_start]buttonsHTML += groups.map(key => `<button onclick="filterByGroup('${key}')" id="tab-${key}" class="group-tab-btn px-4 py-2 text-sm rounded-lg font-medium transition-colors mb-2 ${key === currentGroupFilter ? 'tab-active' : 'bg-gray-100 hover:bg-gray-200'}">${key}</button>`).join(''); [cite: 199]
    [cite_start]tabsContainer.innerHTML = buttonsHTML; [cite: 200]
}
[cite_start]function renderYearFilter() { [cite: 200]
    [cite_start]const yearFilterSelect = document.getElementById('yearFilter'); [cite: 200]
    [cite_start]const years = ['all', ...new Set(allActivities.map(item => item.startDate ? new Date(item.startDate).getFullYear() : null).filter(Boolean))].sort(); [cite: 201]
    [cite_start]yearFilterSelect.innerHTML = years.map(year => `<option value="${year}">${year === 'all' ? '全部年份' : `${year}年`}</option>`).join(''); [cite: 202]
    [cite_start]yearFilterSelect.value = currentYearFilter; [cite: 202]
}
[cite_start]function renderMonthFilter() { [cite: 203]
    [cite_start]const monthFilterSelect = document.getElementById('monthFilter'); [cite: 203]
    [cite_start]const months = ['all', 1,2,3,4,5,6,7,8,9,10,11,12]; [cite: 203]
    [cite_start]monthFilterSelect.innerHTML = months.map(m => `<option value="${m}">${m === 'all' ? '全部月份' : `${m}月`}</option>`).join(''); [cite: 204]
    [cite_start]monthFilterSelect.value = currentMonthFilter; [cite: 204]
}
[cite_start]function renderItems(itemsToRender) { [cite: 205]
    [cite_start]const itemsList = document.getElementById('itemsList'); [cite: 205]
    [cite_start]let filteredItems = itemsToRender; [cite: 205]
    [cite_start]if (currentStatusFilter !== 'all') { [cite: 206]
        [cite_start]filteredItems = itemsToRender.filter(p => p.status === currentStatusFilter); [cite: 206]
    }
    [cite_start]if (filteredItems.length === 0) { [cite: 207]
        [cite_start]itemsList.innerHTML = `<div class="text-center text-gray-400 py-8 col-span-full"><i class="fas fa-folder-open fa-3x mb-4"></i><p class="font-semibold">沒有符合條件的項目</p><p class="text-sm mt-1">請嘗試調整篩選條件</p></div>`; [cite: 207]
        [cite_start]return; [cite: 208]
    }
    [cite_start]itemsList.innerHTML = filteredItems.map(item => { [cite: 208]
        const checklist = item.checklist || [cite_start][]; [cite: 208]
        [cite_start]const totalSteps = checklist.length; [cite: 208]
        [cite_start]const completedSteps = checklist.filter(c => c.completed).length; [cite: 208]
        [cite_start]const progressChange = item.progress - (item.lastWeekProgress || 0); [cite: 208]
        const progressChangeHTML = progressChange > 0 ? `<span class="bg-green-100 text-green-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">▲ ${progressChange}%</span>` : progressChange < 0 ? [cite_start]`<span class="bg-red-100 text-red-800 text-xs font-semibold ml-2 px-2.5 py-0.5 rounded-full">▼ ${Math.abs(progressChange)}%</span>` : `<span class="text-gray-400 text-xs font-medium ml-2">—</span>`; [cite: 208]
        [cite_start]const checklistHTML = totalSteps > 0 ? checklist.map(cp => `<li class="flex items-center ${cp.completed ? 'text-emerald-300' : 'text-gray-400'}"><span class="w-5 text-left">${cp.completed ? '✓' : '○'}</span><span>${cp.name}</span></li>`).join('') : '<li>無定義的檢查點</li>'; [cite: 210]
        return `<div class="bg-white border rounded-xl p-4 flex flex-col h-full shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${item.status === 'overdue' ? 'overdue-glow' : 'border-gray-200'}"><div class="flex-grow"><div class="flex justify-between items-start mb-3"><div class="flex-1"><h4 class="font-bold text-lg text-gray-900 mb-1">${item.name} <span class="text-sm font-medium ${getTypeStyle(item.type, item.status)}">(${getTypeText(item.type)})</span></h4>${item.description ? `<p class="text-sm text-gray-500 mt-1 mb-2 whitespace-pre-wrap">${item.description}</p>` : ''}<p class="text-sm text-gray-600">主要負責: ${(item.assignees || []).join(', ')}</p>${item.collaborators && item.collaborators.length > 0 ? `<p class="text-sm text-gray-600">協助: ${item.collaborators.join(', ')}</p>` : ''}</div><div class="flex items-center space-x-2 ml-2"><span class="flex items-center text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor(item.status)} text-white">${getStatusText(item.status)}</span></div></div></div><div class="mt-auto border-t border-gray-100 pt-3"><div class="mb-3"><div class="flex justify-between items-center text-sm mb-1"><span class="text-gray-600 font-semibold">進度: ${item.progress}%</span>${progressChangeHTML}</div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="progress-bar h-2.5 rounded-full ${getStatusColor(item.status)}" style="width: ${item.progress}%"></div></div><div class="relative group"><p class="text-sm text-gray-600 mt-1 cursor-pointer">檢查點: ${completedSteps}/${totalSteps}</p><div class="absolute bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"><h4 class="font-bold mb-2 border-b border-b-slate-600 pb-1">標準化流程</h4><ul class="space-y-1 mt-2">${checklistHTML}</ul><div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div></div></div></div><div class="flex justify-between items-center text-xs text-gray-500"><span>日期: ${formatDate(item.startDate)} - ${item.deadline ? formatDate(item.deadline) : '無'}</span>${item.status === 'overdue' ? '<span class="text-red-600 font-medium">⚠️ 已逾期</span>' : ''}</div>${item.helpMessage ? [cite_start]`<div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start space-x-3"><span class="text-xl pt-1">😭</span><div><p class="font-semibold text-red-800 text-sm">需要協助：</p><p class="text-sm text-red-700 whitespace-pre-wrap">${item.helpMessage}</p></div></div>` : ''}</div></div>`; [cite: 213]
    }).join('');
}
[cite_start]function renderTeamMembers(members, allItems) { [cite: 214]
    [cite_start]const teamMembersDiv = document.getElementById('teamMembers'); [cite: 214]
    [cite_start]if (!members || members.length === 0) { [cite: 215]
        [cite_start]teamMembersDiv.innerHTML = `<p class="text-center text-gray-500 py-4">此篩選條件下無成員</p>`; [cite: 215]
        [cite_start]return; [cite: 216]
    }
    [cite_start]const today = new Date(); [cite: 216]
    [cite_start]const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`; [cite: 216]
    [cite_start]teamMembersDiv.innerHTML = members.map(memberInfo => { [cite: 217]
        [cite_start]const name = memberInfo.name; [cite: 217]
        [cite_start]const memberItems = allItems.filter(t => (t.assignees || []).includes(name) || (t.collaborators && t.collaborators.includes(name))); [cite: 217]
        [cite_start]const overdueCount = memberItems.filter(t => t.status === 'overdue').length; [cite: 217]
        [cite_start]const projectCount = memberItems.filter(item => item.type === 'project').length; [cite: 217]
        [cite_start]const taskCount = memberItems.filter(item => item.type === 'task').length; [cite: 217]
        [cite_start]const isActive = name === currentMemberFilter; [cite: 217]
        
        [cite_start]const isBirthday = memberInfo.birthday === todayStr; [cite: 218]
        const birthdayContainerClass = isBirthday ? [cite_start]'birthday-container' : ''; [cite: 218]
        const birthdayHatHTML = isBirthday ? [cite_start]'<div class="birthday-hat"></div>' : ''; [cite: 218]
        const confettiHTML = isBirthday ? [cite_start]Array.from({length: 9}).map(() => `<div class="confetti"></div>`).join('') : ''; [cite: 218]
        return `<div onclick="filterByMember('${name}')" class="group relative ${birthdayContainerClass} flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 ${isActive ? 'bg-blue-100 shadow-md' : 'hover:bg-gray-100 hover:shadow-md hover:scale-105'}">
            <div class="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-52 p-4 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-30">
                <img src="${localProfileImages[name] ? localProfileImages[name] : `https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}`}" alt="${name}" class="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-blue-300 object-cover shadow-md" onerror="this.src='https://placehold.co/100x100/93c5fd/ffffff?text=${name.charAt(0)}'; this.onerror=null;">
                <p class="font-bold text-center text-gray-900 text-lg">${name}</p>
                <div class="space-y-2 mt-3">
                    <button onclick="showMemberDuties('${name}', event)" class="block w-full text-center bg-indigo-600 text-white font-semibold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm">
                        <i class="fas fa-briefcase fa-fw mr-1"></i> 業務職掌
                    </button>
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
        [cite_start]</div>`; [cite: 222]
    }).join('');
}
[cite_start]function updateStats(itemsToCount) { [cite: 223]
    [cite_start]const projectsAndTasks = itemsToCount.filter(item => item.type === 'project' || item.type === 'task'); [cite: 223]
    [cite_start]const activitiesAndMeetings = itemsToCount.filter(item => item.type === 'activity' || item.type === 'meeting'); [cite: 224]
    [cite_start]document.getElementById('totalTasks').textContent = projectsAndTasks.length; [cite: 224]
    [cite_start]document.getElementById('activeTasks').textContent = projectsAndTasks.filter(t => t.status === 'active').length; [cite: 225]
    [cite_start]document.getElementById('overdueTasks').textContent = projectsAndTasks.filter(t => t.status === 'overdue').length; [cite: 225]
    [cite_start]document.getElementById('completedTasks').textContent = itemsToCount.filter(t => t.status === 'completed').length; [cite: 226]
    [cite_start]document.getElementById('activityCount').textContent = activitiesAndMeetings.length; [cite: 226]
}
[cite_start]function renderDashboard() { [cite: 226]
    [cite_start]let itemsForYear = allActivities; [cite: 226]
    [cite_start]if (currentYearFilter !== 'all') { [cite: 227]
         [cite_start]itemsForYear = allActivities.filter(item => item.startDate && new Date(item.startDate).getFullYear() == currentYearFilter); [cite: 227]
    }
    [cite_start]let itemsForMonth = itemsForYear; [cite: 228]
    [cite_start]if (currentMonthFilter !== 'all') { [cite: 228]
        [cite_start]itemsForMonth = itemsForYear.filter(item => item.startDate && (new Date(item.startDate).getMonth() + 1) == currentMonthFilter); [cite: 228]
    }
    [cite_start]let membersAfterUnitFilter = staffData; [cite: 229]
    [cite_start]if (currentUnitFilter !== 'all') { [cite: 229]
        [cite_start]membersAfterUnitFilter = staffData.filter(s => s.unit === currentUnitFilter); [cite: 229]
    }
    [cite_start]renderGroupTabs(membersAfterUnitFilter); [cite: 230]
    [cite_start]const membersInGroup = currentGroupFilter === 'all' ? membersAfterUnitFilter : membersAfterUnitFilter.filter(s => s.group === currentGroupFilter); [cite: 230]
    [cite_start]const finalVisibleMemberNames = membersInGroup.map(m => m.name); [cite: 231]
    [cite_start]let itemsToConsider = itemsForMonth.filter(item => (item.assignees || []).some(assignee => finalVisibleMemberNames.includes(assignee)) || (item.collaborators && item.collaborators.some(collaborator => finalVisibleMemberNames.includes(collaborator)))); [cite: 231]
    [cite_start]if (currentSearchTerm) { [cite: 232]
        [cite_start]const lowerCaseTerm = currentSearchTerm.toLowerCase(); [cite: 232]
        [cite_start]itemsToConsider = itemsToConsider.filter(item => item.name.toLowerCase().includes(lowerCaseTerm) || (item.description && item.description.toLowerCase().includes(lowerCaseTerm))); [cite: 233]
    }
    [cite_start]let itemsToDisplay = itemsToConsider; [cite: 233]
    [cite_start]if (currentMemberFilter !== 'all') { [cite: 234]
        [cite_start]itemsToDisplay = itemsToConsider.filter(item => (item.assignees || []).includes(currentMemberFilter) || (item.collaborators && item.collaborators.includes(currentMemberFilter))); [cite: 234]
    }
    [cite_start]itemsToDisplay.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); [cite: 235]
    [cite_start]updateStats(itemsToConsider); [cite: 235]
    [cite_start]renderTeamMembers(membersInGroup, itemsToConsider); [cite: 235]
    [cite_start]renderItems(itemsToDisplay.filter(item => item.type === 'project' || item.type === 'task')); [cite: 236]
}

// --- Filtering Functions ---
[cite_start]function filterByUnit(unit) { [cite: 236]
    [cite_start]currentUnitFilter = unit; [cite: 236]
    [cite_start]currentGroupFilter = 'all'; [cite: 237]
    [cite_start]currentMemberFilter = 'all'; [cite: 237]
    [cite_start]document.querySelectorAll('.unit-tab-btn').forEach(btn => { [cite: 237]
        [cite_start]btn.classList.toggle('tab-active', btn.id === `tab-unit-${unit.replace(/\s/g, '-')}`); [cite: 237]
        [cite_start]btn.classList.toggle('bg-gray-100', btn.id !== `tab-unit-${unit.replace(/\s/g, '-')}`); [cite: 237]
        [cite_start]btn.classList.toggle('hover:bg-gray-200', btn.id !== `tab-unit-${unit.replace(/\s/g, '-')}`); [cite: 237]
    });
    [cite_start]renderDashboard(); [cite: 238]
}
function filterBySearch(term) { currentSearchTerm = term; renderDashboard(); [cite_start]} [cite: 238]
function filterByYear(year) { currentYearFilter = year; renderDashboard(); [cite_start]} [cite: 238]
function filterByMonth(month) { currentMonthFilter = month; renderDashboard(); [cite_start]} [cite: 239]
[cite_start]function filterByGroup(groupKey) { [cite: 239]
    [cite_start]currentGroupFilter = groupKey; [cite: 239]
    [cite_start]currentMemberFilter = 'all'; [cite: 239]
    [cite_start]document.querySelectorAll('.group-tab-btn').forEach(btn => { [cite: 240]
        [cite_start]btn.classList.toggle('tab-active', btn.id === `tab-${groupKey}`); [cite: 240]
    });
    [cite_start]renderDashboard(); [cite: 240]
}
[cite_start]function filterByMember(memberName) { [cite: 241]
    currentMemberFilter = (currentMemberFilter === memberName) ? [cite_start]'all' : memberName; [cite: 241]
    [cite_start]renderDashboard(); [cite: 241]
}
[cite_start]function filterItemsByStatus(statusFilter, event) { [cite: 242]
    [cite_start]currentStatusFilter = statusFilter; [cite: 242]
    [cite_start]const colorMap = {'all': ['bg-blue-100', 'text-blue-700'], 'planning': ['bg-yellow-100', 'text-yellow-700'], 'active': ['bg-purple-100', 'text-purple-700'], 'completed': ['bg-green-100', 'text-green-700'], 'overdue': ['bg-red-100', 'text-red-700']}; [cite: 243]
    [cite_start]document.querySelectorAll('.filter-btn').forEach(btn => { [cite: 244]
        [cite_start]btn.classList.remove('active', ...Object.values(colorMap).flat()); [cite: 244]
        [cite_start]btn.classList.add('bg-gray-100', 'text-gray-700'); [cite: 244]
    });
    [cite_start]event.target.classList.add('active', ...colorMap[statusFilter]); [cite: 245]
    [cite_start]event.target.classList.remove('bg-gray-100', 'text-gray-700'); [cite: 245]
    [cite_start]renderDashboard(); [cite: 245]
}

// --- Feature Functions (Modals, etc.) ---
[cite_start]function viewMemberHistory(name, event) { [cite: 245]
    [cite_start]event.stopPropagation(); [cite: 245]
    [cite_start]if (name === '盧英云') { [cite: 246]
        [cite_start]window.open('https://qpig0218.github.io/Ying-Yun/', '_blank'); [cite: 246]
        [cite_start]return; [cite: 246]
    }
    [cite_start]alert(`檢視 ${name} 的個人歷程 (功能開發中)`); [cite: 247]
}
[cite_start]function showItemsInModal(filterType) { [cite: 247]
    [cite_start]const modal = document.getElementById('itemListModal'); [cite: 247]
    [cite_start]const titleEl = document.getElementById('itemListModalTitle'); [cite: 248]
    [cite_start]const contentEl = document.getElementById('itemListModalContent'); [cite: 248]
    [cite_start]let itemsToShow = []; [cite: 248]
    [cite_start]let modalTitle = ''; [cite: 248]
    [cite_start]const projectsAndTasks = allActivities.filter(item => item.type === 'project' || item.type === 'task'); [cite: 249]
    [cite_start]const statusOrder = { 'active': 1, 'planning': 2, 'overdue': 3, 'completed': 4 }; [cite: 250]
    [cite_start]switch(filterType) { [cite: 251]
        [cite_start]case 'total': itemsToShow = projectsAndTasks.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)); [cite: 251]
        [cite_start]modalTitle = '總項目列表'; break; [cite: 252]
        [cite_start]case 'active': itemsToShow = projectsAndTasks.filter(item => item.status === 'active'); modalTitle = '進行中項目列表'; break; [cite: 252]
        [cite_start]case 'overdue': itemsToShow = projectsAndTasks.filter(item => item.status === 'overdue'); modalTitle = '逾期項目列表'; break; [cite: 253]
        [cite_start]case 'completed': itemsToShow = allActivities.filter(item => item.status === 'completed'); modalTitle = '已完成項目列表'; break; [cite: 254]
    }
    [cite_start]titleEl.innerHTML = `<i class="fas fa-list-check mr-3"></i> ${modalTitle} (${itemsToShow.length})`; [cite: 255]
    [cite_start]if (itemsToShow.length === 0) { [cite: 256]
        [cite_start]contentEl.innerHTML = '<p class="text-center text-gray-500 py-4">此類別中沒有項目。</p>'; [cite: 256]
    [cite_start]} else { [cite: 257]
        [cite_start]contentEl.innerHTML = itemsToShow.map(item => `<div class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"><p class="font-semibold text-gray-800">${item.name}</p><p class="text-sm text-gray-600">負責人: ${(item.assignees || []).join(', ')}</p><div class="flex justify-between items-center text-xs mt-1"><span class="font-medium ${getTypeStyle(item.type, item.status)}">(${getTypeText(item.type)})</span><span class="px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)} text-white">${getStatusText(item.status)}</span></div></div>`).join(''); [cite: 257]
    }
    [cite_start]modal.classList.remove('hidden'); [cite: 258]
}
[cite_start]function openActivityModal(resetDate = true) { [cite: 258]
    [cite_start]if (resetDate) calendarDate = new Date(); [cite: 258]
    [cite_start]const modal = document.getElementById('activityModal'); [cite: 259]
    [cite_start]const content = document.getElementById('activity-content'); [cite: 259]
    [cite_start]const itemsForDisplay = allActivities.filter(item => item.type && (item.type.toLowerCase() === 'activity' || item.type.toLowerCase() === 'meeting')); [cite: 259]
    [cite_start]const calendarHTML = generateCalendarHTML(calendarDate.getFullYear(), calendarDate.getMonth(), itemsForDisplay); [cite: 260]
    [cite_start]if (itemsForDisplay.length === 0) { [cite: 260]
        [cite_start]content.innerHTML = calendarHTML + `<p class="text-center text-gray-500 mt-4">目前沒有任何活動。</p>`; [cite: 260]
    [cite_start]} else { [cite: 261]
        [cite_start]const today = new Date(); [cite: 261]
        [cite_start]today.setHours(0,0,0,0); [cite: 261]
        [cite_start]const sortedItems = itemsForDisplay.slice().sort((a, b) => { [cite: 262]
            [cite_start]const dateA = new Date(a.startDate); const dateB = new Date(b.startDate); [cite: 262]
            [cite_start]const isPastA = (a.deadline ? new Date(a.deadline) : dateA) < today; [cite: 262]
            [cite_start]const isPastB = (b.deadline ? new Date(b.deadline) : dateB) < today; [cite: 262]
            if (isPastA !== isPastB) return isPastA ? [cite_start]1 : -1; [cite: 262]
            [cite_start]return dateA - dateB; [cite: 263]
        });
        [cite_start]let listHtml = ''; [cite: 263]
        [cite_start]if (sortedItems.length > 0) { [cite: 264]
            [cite_start]listHtml = '<ul class="space-y-4">' + sortedItems.map(item => { [cite: 264]
                [cite_start]const isExpired = (item.deadline ? new Date(item.deadline) : new Date(item.startDate)) < today; [cite: 264]
                [cite_start]return `<li class="relative flex items-start space-x-4 p-2 rounded-lg ${isExpired ? 'bg-gray-100' : 'hover:bg-gray-50'}"><div class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg"><span class="text-xl font-bold text-purple-700">${new Date(item.startDate).getDate()}</span></div><div class="flex-grow pt-1"><p class="font-semibold text-gray-800">${item.name}</p><p class="text-sm text-gray-600">日期: ${formatDate(item.startDate)}</p><p class="text-sm text-gray-500">負責人: ${(item.assignees || []).join(', ')}</p></div></li>`; [cite: 265]
            [cite_start]}).join('') + '</ul>'; [cite: 265]
        }
        [cite_start]content.innerHTML = calendarHTML + `<hr class="my-6"/>` + listHtml; [cite: 266]
    }
    [cite_start]modal.classList.remove('hidden'); [cite: 267]
}
[cite_start]function generateCalendarHTML(year, month, activities){ [cite: 267]
    [cite_start]const activitiesByDay = {}; [cite: 267]
    [cite_start]activities.forEach(item => { [cite: 268]
        [cite_start]if (!item.startDate) return; [cite: 268]
        [cite_start]const d = new Date(item.startDate); [cite: 268]
        [cite_start]if (d.getFullYear() === year && d.getMonth() === month) { [cite: 268]
            [cite_start]const day = d.getDate(); [cite: 268]
            [cite_start]if (!activitiesByDay[day]) activitiesByDay[day] = []; [cite: 268]
            [cite_start]activitiesByDay[day].push(item); [cite: 268]
        }
    });
    [cite_start]const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]; [cite: 269]
    [cite_start]const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六']; [cite: 270]
    [cite_start]const firstDay = new Date(year, month, 1).getDay(); [cite: 270]
    [cite_start]const daysInMonth = new Date(year, month + 1, 0).getDate(); [cite: 271]
    [cite_start]let calendarHtml = `<div class="mb-6"><div class="flex justify-between items-center mb-4"><button onclick="navigateCalendar(-1)" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">&lt;</button><h3 class="text-xl font-bold text-purple-700">${year}年 ${monthNames[month]}</h3><button onclick="navigateCalendar(1)" class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">&gt;</button></div><div class="grid grid-cols-7 gap-1 text-center text-sm">`; [cite: 271]
    [cite_start]daysOfWeek.forEach(day => { calendarHtml += `<div class="font-semibold text-gray-600">${day}</div>`; }); [cite: 272]
    for (let i = 0; i < firstDay; i++) { calendarHtml += `<div></div>`; [cite_start]} [cite: 272]
    [cite_start]for (let day = 1; day <= daysInMonth; day++) { [cite: 273]
        [cite_start]const activitiesToday = activitiesByDay[day]; [cite: 273]
        [cite_start]if (activitiesToday) { [cite: 274]
            [cite_start]const tooltipHtml = activitiesToday.map(act => `<li class="truncate">${act.name}</li>`).join(''); [cite: 274]
            [cite_start]calendarHtml += `<div class="relative group flex items-center justify-center"><div class="mx-auto flex items-center justify-center w-8 h-8 rounded-full border-2 border-purple-400 text-purple-700 font-semibold cursor-pointer">${day}</div><span class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">${activitiesToday.length}</span><div class="absolute bottom-full mb-2 w-56 p-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 transform -translate-x-1/2 left-1/2"><ul class="space-y-1">${tooltipHtml}</ul><div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div></div></div>`; [cite: 275]
        [cite_start]} else { [cite: 276]
            [cite_start]calendarHtml += `<div class="flex items-center justify-center w-8 h-8">${day}</div>`; [cite: 276]
        }
    }
    [cite_start]calendarHtml += `</div></div>`; [cite: 277]
    [cite_start]return calendarHtml; [cite: 277]
};
[cite_start]function navigateCalendar(offset){ [cite: 278]
    [cite_start]calendarDate.setMonth(calendarDate.getMonth() + offset); [cite: 278]
    [cite_start]openActivityModal(false); [cite: 278]
};
[cite_start]function generateWeeklySummary() { [cite: 279]
    [cite_start]const content = document.getElementById('weekly-summary-content'); [cite: 279]
    [cite_start]content.innerHTML = `<div class="p-8 flex items-center justify-center"><i class="fas fa-spinner fa-spin text-2xl text-green-500 mr-3"></i> 正在生成週報...</div>`; [cite: 280]

    [cite_start]const today = new Date(); [cite: 280]
    [cite_start]const oneWeekAgo = new Date(); oneWeekAgo.setDate(today.getDate() - 7); [cite: 281]
    [cite_start]const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7); [cite: 281]
    [cite_start]const projectsAndTasks = allActivities.filter(item => ['project', 'task'].includes(item.type)); [cite: 282]
    [cite_start]const completedThisWeek = projectsAndTasks.filter(item => { if (item.status !== 'completed') return false; const completionDate = item.deadline ? new Date(item.deadline) : new Date(item.startDate); return completionDate >= oneWeekAgo && completionDate <= today; }); [cite: 282]
    [cite_start]const progressMade = projectsAndTasks.filter(item => item.status !== 'completed' && item.progress > (item.lastWeekProgress || 0)); [cite: 283]
    [cite_start]const newlyAdded = projectsAndTasks.filter(item => new Date(item.startDate) >= oneWeekAgo && new Date(item.startDate) <= today); [cite: 284]
    [cite_start]const stalled = projectsAndTasks.filter(item => item.status === 'active' && item.progress === (item.lastWeekProgress || 0) && item.progress < 100); [cite: 285]
    [cite_start]const upcomingDeadlines = projectsAndTasks.filter(item => item.deadline && new Date(item.deadline) > today && new Date(item.deadline) <= nextWeek && item.status !== 'completed'); [cite: 286]
    [cite_start]const helpNeeded = projectsAndTasks.filter(item => item.helpMessage && item.helpMessage.trim() !== ''); [cite: 287]
    [cite_start]const totalProgressGained = progressMade.reduce((sum, item) => sum + (item.progress - (item.lastWeekProgress || 0)), 0); [cite: 288]
    [cite_start]const memberContributions = {}; [cite: 289]
    [cite_start]progressMade.forEach(item => { [cite: 290]
        [cite_start]const progress = item.progress - (item.lastWeekProgress || 0); [cite: 290]
        [cite_start]item.assignees.forEach(name => { [cite: 290]
            [cite_start]if (!memberContributions[name]) memberContributions[name] = 0; [cite: 290]
            [cite_start]memberContributions[name] += progress; [cite: 290]
        });
    });
    [cite_start]let mvp = { name: '無', score: 0 }; [cite: 291]
    [cite_start]for (const name in memberContributions) { [cite: 291]
        [cite_start]if (memberContributions[name] > mvp.score) { [cite: 291]
            [cite_start]mvp = { name: name, score: memberContributions[name] }; [cite: 291]
        }
    }

    [cite_start]const renderSummarySection = (title, icon, color, items, emptyText) => { [cite: 292]
        [cite_start]let sectionHTML = `<div class="mb-4"><h3 class="text-base font-bold ${color} flex items-center mb-2"><i class="fas ${icon} fa-fw mr-2"></i>${title} (${items.length})</h3>`; [cite: 292]
        [cite_start]if (items.length > 0) { [cite: 293]
            sectionHTML += '<ul class="space-y-2 pl-5">' + items.map(item =>
                `<li class="text-sm text-gray-800 p-2 bg-gray-50 rounded-md border-l-4 ${color.replace('text-', 'border-')}">
                    <strong>${item.name}</strong> - <span class="text-gray-500">負責人: ${(item.assignees || []).join(', ')}</span>
                    ${title.includes('進度') ? `<span class="font-medium text-green-600"> (+${item.progress - (item.lastWeekProgress || 0)}%)</span>` : ''}
                    ${title.includes('到期') ? `<span class="font-medium text-yellow-800"> (到期日: ${formatDate(item.deadline)})</span>` : ''}
                    ${title.includes('協助') ? `<p class="text-sm text-red-700 mt-1 pl-2 border-l-2 border-red-200 bg-red-50 py-1"><em>"${item.helpMessage}"</em></p>` : ''}
                </li>`
            [cite_start]).join('') + '</ul>'; [cite: 294]
        [cite_start]} else { [cite: 295]
            [cite_start]sectionHTML += `<p class="pl-5 text-sm text-gray-500">${emptyText}</p>`; [cite: 295]
        }
        [cite_start]sectionHTML += `</div>`; return sectionHTML; [cite: 296]
    };
    let summaryHTML = `
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h3 class="text-lg font-bold text-blue-800 mb-2">本週團隊數據總覽</h3>
            <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p class="text-2xl font-bold text-blue-700">${completedThisWeek.length}</p>
                    <p class="text-sm text-gray-600">完成項目數</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-green-700">+${totalProgressGained}%</p>
                    <p class="text-sm text-gray-600">總進度推進</p>
                </div>
            </div>
        </div>
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
             <h3 class="text-lg font-bold text-amber-800 mb-2 flex items-center"><i class="fas fa-star mr-2 text-yellow-500"></i>本週之星</h3>
             ${mvp.name !== '無' ? `<p class="text-center"><span class="font-bold text-xl text-amber-900">${mvp.name}</span> <br> <span class="text-sm text-gray-600">以 <strong class="text-amber-700">${mvp.score}%</strong> 的總進度貢獻拔得頭籌！</span></p>` : `<p class="text-center text-gray-500">本週尚無明顯的進度貢獻者，下週加油！</p>`}
        </div>
    [cite_start]`; [cite: 300]
    [cite_start]summaryHTML += renderSummarySection('本週完成項目', 'fa-check-circle', 'text-green-600', completedThisWeek, '本週沒有完成的項目。'); [cite: 301]
    [cite_start]summaryHTML += renderSummarySection('本週進度更新', 'fa-rocket', 'text-blue-600', progressMade, '本週沒有項目取得進展。'); [cite: 301]
    [cite_start]summaryHTML += renderSummarySection('本週新增項目', 'fa-lightbulb', 'text-purple-600', newlyAdded, '本週沒有新增項目。'); [cite: 302]
    [cite_start]summaryHTML += renderSummarySection('下週到期項目', 'fa-clock', 'text-yellow-600', upcomingDeadlines, '下週沒有即將到期的項目。'); [cite: 302]
    [cite_start]summaryHTML += renderSummarySection('進度停滯項目', 'fa-pause-circle', 'text-orange-500', stalled, '所有項目皆有進展，太棒了！'); [cite: 303]
    [cite_start]summaryHTML += renderSummarySection('需要協助項目', 'fa-hands-helping', 'text-red-600', helpNeeded, '沒有項目發出求救信號。'); [cite: 303]
    [cite_start]content.innerHTML = summaryHTML; [cite: 303]
}
[cite_start]function generateDashboardReportHTML() { [cite: 304]
    [cite_start]const today = new Date(); [cite: 304]
    [cite_start]const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`; [cite: 305]
    [cite_start]const todayString = today.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' }); [cite: 305]
    [cite_start]const projectsAndTasks = allActivities.filter(item => ['project', 'task'].includes(item.type)); [cite: 306]
    [cite_start]const overdueProjects = projectsAndTasks.filter(i => i.status === 'overdue'); [cite: 306]
    [cite_start]const stalledProjects = projectsAndTasks.filter(i => i.status === 'active' && i.progress === (i.lastWeekProgress || 0) && i.progress < 100); [cite: 307]
    [cite_start]const helpNeededProjects = projectsAndTasks.filter(i => i.helpMessage && i.helpMessage.trim() !== ''); [cite: 308]
    [cite_start]const nearingCompletion = projectsAndTasks.filter(i => i.progress >= 80 && i.status !== 'completed'); [cite: 309]
    [cite_start]const birthdayMembers = staffData.filter(s => s.birthday === todayStr); [cite: 309]
    [cite_start]const createSection = (title, icon, colorClass, items, emptyText) => { [cite: 310]
        [cite_start]if (items.length === 0) return emptyText ? [cite: 310]
        [cite_start]`<p class="text-sm text-gray-500 pl-2">${emptyText}</p>`: ''; [cite: 311]
        let itemsHtml = items.map(item => 
            `<li class="text-sm text-gray-800">
                <span class="font-semibold">"${item.name}"</span> - (主責: ${item.assignees.join(', ') || '未指定'})
            </li>`
        [cite_start]).join(''); [cite: 311]
        return `
            <div class="p-3 bg-white rounded-lg border-l-4 ${colorClass} shadow-sm">
                <h3 class="font-bold text-gray-800 flex items-center mb-2"><i class="fas ${icon} fa-fw mr-2"></i>${title} (${items.length})</h3>
                <ul class="space-y-1 pl-5 list-disc">${itemsHtml}</ul>
            [cite_start]</div>`; [cite: 312]
    };

    let reportHTML = `
        <div class="space-y-4 text-gray-800">
            <div>
                <h2 class="text-lg font-bold text-gray-900">膠部領航員 日常戰報</h2>
                <p class="text-sm text-gray-500">報告時間：${todayString}</p>
            </div>
            <p>教學部戰隊的各位夥伴，早安！領航員回報，本日戰線情報分析如下：</p>
    [cite_start]`; [cite: 313]
    [cite_start]if (birthdayMembers.length > 0) { [cite: 314]
        reportHTML += `
            <div class="p-3 bg-rose-50 rounded-lg border-l-4 border-rose-400 shadow-sm animate-pulse">
                <h3 class="font-bold text-rose-800 flex items-center mb-1"><i class="fas fa-birthday-cake fa-fw mr-2"></i>特別情報！</h3>
                <p class="text-sm text-rose-700">領航員偵測到一股強大的快樂能量... 原來是 <strong class="font-bold">${birthdayMembers.map(m=>m.name).join('、')}</strong> 的生日！艦橋全體人員在此獻上最誠摯的祝福！</p>
            </div>
        [cite_start]`; [cite: 314]
    }
    
    [cite_start]const topTarget = overdueProjects.find(p => p.priority === 'high') || [cite: 315]
    [cite_start]overdueProjects[0] || stalledProjects.find(p => p.priority === 'high') || stalledProjects[0]; [cite: 316]
    [cite_start]if (topTarget) { [cite: 316]
         reportHTML += `
            <div class="p-3 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm">
                <h3 class="font-bold text-red-800 flex items-center mb-1"><i class="fas fa-crosshairs fa-fw mr-2"></i>今日首要目標</h3>
                <p class="text-sm text-red-700">領航員已鎖定今日首要殲滅目標：<strong class="font-bold">"${topTarget.name}"</strong>！此項目已進入紅色警戒，請 ${topTarget.assignees.join(', ')} 集中火力，優先處理！</p>
            </div>
        [cite_start]`; [cite: 316]
    }

    [cite_start]reportHTML += createSection('前線膠著區', 'fa-traffic-jam', 'border-yellow-500', stalledProjects); [cite: 317]
    [cite_start]reportHTML += createSection('緊急呼救', 'fa-first-aid', 'border-amber-500', helpNeededProjects, '✔️ 各單位回報狀況良好，無人請求支援。'); [cite: 318]
    [cite_start]reportHTML += createSection('即將攻頂', 'fa-flag-checkered', 'border-green-500', nearingCompletion); [cite: 318]
    [cite_start]if (overdueProjects.length > 0 || stalledProjects.length > 0 || helpNeededProjects.length > 0) { [cite: 319]
        [cite_start]reportHTML += `<p class="pt-2 text-sm">⚠️ <strong>戰報總結</strong>：戰場上出現了需要優先處理的目標，請各單位根據情報採取行動，確保戰役順利進行。領航員將持續監控戰場！</p>`; [cite: 319]
    [cite_start]} else { [cite: 320]
        [cite_start]reportHTML += `<p class="pt-2 text-sm">✅ <strong>戰報總結</strong>：本日戰況一切良好！所有戰線均在掌控之中，請各位夥伴繼續保持！領航員為你們感到驕傲！</p>`; [cite: 320]
    }
    
    [cite_start]reportHTML += `</div>`; [cite: 321]
    [cite_start]return reportHTML; [cite: 322]
}

// --- AI & Setup Functions ---
[cite_start]async function getAiSuggestions(memberName = 'all') { [cite: 322]
    [cite_start]const aiContent = document.getElementById('ai-suggestion-content'); [cite: 322]
    [cite_start]const loadingMessages = ["正在準備您的專案數據...", "已連線至 AI 引擎...", "AI 正在分析風險與機會...", "生成個人化決策建議中...", "幾乎完成了..."]; [cite: 323]
    [cite_start]let messageIndex = 0; [cite: 323]
    [cite_start]aiContent.innerHTML = `<div class="flex flex-col items-center justify-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i><p id="ai-loading-message" class="mt-4 text-gray-600 font-medium">${loadingMessages[0]}</p></div>`; [cite: 324]
    [cite_start]const loadingMessageElement = document.getElementById('ai-loading-message'); [cite: 325]
    [cite_start]const intervalId = setInterval(() => { [cite: 325]
        [cite_start]messageIndex = (messageIndex + 1) % loadingMessages.length; [cite: 325]
        [cite_start]if(loadingMessageElement) loadingMessageElement.textContent = loadingMessages[messageIndex]; [cite: 325]
    }, 1500);
    [cite_start]let itemsToAnalyze = allActivities.filter(item => ['project', 'task'].includes(item.type)); [cite: 326]
    [cite_start]let analysisTarget = "整個團隊"; [cite: 326]
    [cite_start]if (memberName !== 'all') { [cite: 327]
        [cite_start]analysisTarget = memberName; [cite: 327]
        [cite_start]itemsToAnalyze = itemsToAnalyze.filter(item => (item.assignees || []).includes(memberName) || (item.collaborators && item.collaborators.includes(memberName))); [cite: 328]
    }

    [cite_start]try { [cite: 329]
        [cite_start]const response = await fetch(SCRIPT_URL, { [cite: 329]
            [cite_start]method: 'POST', mode: 'cors', [cite: 329]
            [cite_start]body: JSON.stringify({ action: 'getAiSuggestionProxy', payload: { items: itemsToAnalyze, memberName: analysisTarget } }), [cite: 329]
            [cite_start]headers: { 'Content-Type': 'text/plain;charset=utf-8' } [cite: 329]
        });
        if (!response.ok) { const errorText = await response.text(); throw new Error(`網路回應錯誤: ${errorText}`); [cite_start]} [cite: 330]
        [cite_start]const result = await response.json(); [cite: 331]
        [cite_start]const aiText = result.candidates[0].content.parts[0].text; [cite: 331]
        [cite_start]renderAiReport(aiText); [cite: 331]
    [cite_start]} catch (error) { [cite: 332]
        [cite_start]console.error("AI suggestion fetch failed:", error); [cite: 332]
        [cite_start]aiContent.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg"><p class="font-bold">唉呀！AI 引擎連線失敗</p><p>${error.message}</p></div>`; [cite: 333]
    [cite_start]} finally { [cite: 333]
        [cite_start]clearInterval(intervalId); [cite: 333]
    }
}
[cite_start]function renderAiReport(markdownText) { [cite: 334]
    [cite_start]const aiContent = document.getElementById('ai-suggestion-content'); [cite: 334]
    [cite_start]let html = markdownText [cite: 335]
        [cite_start].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') [cite: 335]
        [cite_start].replace(/### (.*?)\n/g, '<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h3>') [cite: 335]
        [cite_start].replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>') [cite: 335]
        [cite_start].replace(/\* (.*?)\n/g, '<li class="ml-5 list-disc">$1</li>') [cite: 335]
        [cite_start].replace(/\n/g, '<br>'); [cite: 335]
    [cite_start]aiContent.innerHTML = `<div class="prose max-w-none">${html}</div>`; [cite: 336]
}
[cite_start]function setupUserInfo() { [cite: 336]
    [cite_start]const welcomeMessageEl = document.getElementById('welcome-message'); [cite: 336]
    [cite_start]const logoutBtn = document.getElementById('logoutBtn'); [cite: 336]
    [cite_start]const adminLink = document.getElementById('admin-link'); [cite: 337]
    [cite_start]const userDataString = sessionStorage.getItem('dashboardUser'); [cite: 337]
    
    [cite_start]if (userDataString) { [cite: 337]
        [cite_start]const userData = JSON.parse(userDataString); [cite: 337]
        [cite_start]welcomeMessageEl.textContent = `${userData.name} 您好`; [cite: 338]
        [cite_start]adminLink.href = `project-admin.html?user=${encodeURIComponent(userData.name)}&id=${encodeURIComponent(userData.employeeId)}`; [cite: 338]
        [cite_start]logoutBtn.addEventListener('click', () => { [cite: 338]
            [cite_start]sessionStorage.removeItem('dashboardUser'); [cite: 338]
            [cite_start]window.location.href = 'index.html'; [cite: 338]
        });
    }
}
[cite_start]function setupModal(modalId, openBtnId, closeBtnId, openCallback) { [cite: 339]
    [cite_start]const modal = document.getElementById(modalId); if (!modal) return; [cite: 339]
    [cite_start]const openBtn = openBtnId ? document.getElementById(openBtnId) : null; [cite: 340]
    [cite_start]const closeBtn = document.getElementById(closeBtnId); [cite: 340]
    const open = () => { modal.classList.remove('hidden'); if (openCallback) openCallback(); [cite_start]}; [cite: 340]
    [cite_start]const close = () => modal.classList.add('hidden'); [cite: 341]
    [cite_start]if (openBtn) openBtn.addEventListener('click', open); [cite: 341]
    [cite_start]if(closeBtn) closeBtn.addEventListener('click', close); [cite: 341]
    [cite_start]modal.addEventListener('click', (e) => { if (e.target === modal) close(); }); [cite: 342]
}
[cite_start]function populateAiMemberFilter() { [cite: 342]
    [cite_start]const filterSelect = document.getElementById('aiMemberFilter'); [cite: 342]
    [cite_start]if (filterSelect && staffData.length > 0) { [cite: 343]
        [cite_start]filterSelect.innerHTML = '<option value="all">針對 整個團隊 分析</option>'; [cite: 343]
        [cite_start]const membersInGroup = staffData.filter(s => currentGroupFilter === 'all' || s.group === currentGroupFilter).filter(s => currentUnitFilter === 'all' || s.unit === currentUnitFilter); [cite: 344]
        [cite_start]membersInGroup.forEach(member => { [cite: 345]
            [cite_start]const option = document.createElement('option'); [cite: 345]
            [cite_start]option.value = member.name; [cite: 345]
            [cite_start]option.textContent = `針對 ${member.name} 分析`; [cite: 345]
            [cite_start]filterSelect.appendChild(option); [cite: 345]
        });
    }
}
[cite_start]function setupAiModal(){ [cite: 346]
    [cite_start]const aiModal = document.getElementById('aiModal'); [cite: 346]
    [cite_start]const aiBtn = document.getElementById('aiBtn'); [cite: 346]
    [cite_start]const closeAiModalBtn = document.getElementById('closeAiModalBtn'); [cite: 346]
    [cite_start]const permissionDeniedModal = document.getElementById('permissionDeniedModal'); [cite: 347]
    [cite_start]const closePermissionDeniedModalBtn = document.getElementById('closePermissionDeniedModalBtn'); [cite: 347]
    
    [cite_start]if (!aiBtn) return; [cite: 347]
    [cite_start]aiBtn.addEventListener('click', () => { [cite: 348]
        [cite_start]const userDataString = sessionStorage.getItem('dashboardUser'); [cite: 348]
        [cite_start]const userData = JSON.parse(userDataString); [cite: 348]
        [cite_start]if (userData && userData.role === '主管') { [cite: 348]
            [cite_start]aiModal.classList.remove('hidden'); [cite: 348]
            [cite_start]populateAiMemberFilter(); [cite: 348]
            [cite_start]getAiSuggestions('all'); [cite: 348]
        [cite_start]} else { [cite: 348]
            [cite_start]permissionDeniedModal.classList.remove('hidden'); [cite: 348]
        }
    });
    [cite_start]closeAiModalBtn.addEventListener('click', () => aiModal.classList.add('hidden')); [cite: 350]
    [cite_start]aiModal.addEventListener('click', (e) => { if (e.target === aiModal) aiModal.classList.add('hidden'); }); [cite: 350]
    [cite_start]closePermissionDeniedModalBtn.addEventListener('click', () => permissionDeniedModal.classList.add('hidden')); [cite: 350]
    [cite_start]permissionDeniedModal.addEventListener('click', (e) => { if (e.target === permissionDeniedModal) permissionDeniedModal.classList.add('hidden'); }); [cite: 351]
    
    [cite_start]const filterSelect = document.getElementById('aiMemberFilter'); [cite: 351]
    [cite_start]if (filterSelect) { [cite: 352]
        [cite_start]const newSelect = filterSelect.cloneNode(true); [cite: 352]
        [cite_start]filterSelect.parentNode.replaceChild(newSelect, filterSelect); [cite: 352]
        [cite_start]newSelect.addEventListener('change', (e) => getAiSuggestions(e.target.value)); [cite: 352]
    }
}
function setupWeeklySummaryModal(){ setupModal('weeklySummaryModal', 'weeklySummaryBtn', 'closeWeeklySummaryBtn', generateWeeklySummary); [cite_start]} [cite: 353]
function setupItemListModal(){ setupModal('itemListModal', null, 'closeItemListModalBtn'); [cite_start]} [cite: 353]
function setupActivityModal(){ setupModal('activityModal', null, 'closeActivityModalBtn', () => openActivityModal(true)); [cite_start]} [cite: 353]
[cite_start]function setupScrollToTop(){ [cite: 354]
    [cite_start]const btn = document.getElementById('scrollToTopBtn'); if(!btn) return; [cite: 354]
    [cite_start]window.onscroll = () => { [cite: 355]
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) { btn.classList.remove('hidden'); } else { btn.classList.add('hidden'); [cite_start]} [cite: 355]
    };
    [cite_start]btn.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'})); [cite: 356]
}
[cite_start]function setupChatBot() { [cite: 357]
    [cite_start]const openBtn = document.getElementById('openChatBot'); if(!openBtn) return; [cite: 357]
    [cite_start]const closeBtn = document.getElementById('closeChatBot'); [cite: 357]
    [cite_start]const container = document.getElementById('chatBotContainer'); [cite: 357]
    [cite_start]const messagesDiv = document.getElementById('chatBotMessages'); [cite: 358]
    [cite_start]openBtn.addEventListener('click', () => { [cite: 358]
        [cite_start]container.classList.remove('hidden'); [cite: 358]
        [cite_start]messagesDiv.innerHTML = `<div class="p-4 bg-gray-100 rounded-lg">${generateDashboardReportHTML()}</div>`; [cite: 358]
    });
    [cite_start]closeBtn.addEventListener('click', () => container.classList.add('hidden')); [cite: 359]
}

function setupDutyListModal() {
    setupModal('dutyListModal', null, 'closeDutyListModalBtn');
}

function setupDutySearchModal() {
    const modal = document.getElementById('dutySearchModal');
    const openBtn = document.getElementById('openDutySearchBtn');
    const closeBtn = document.getElementById('closeDutySearchModalBtn');
    const searchInput = document.getElementById('dutySearchInput');
    const resultsContainer = document.getElementById('dutySearchResults');
    
    const renderAllDuties = (data, searchTerm = '') => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        let html = '';
        const personOrder = Object.keys(data).sort((a, b) => a.localeCompare(b, 'zh-Hant'));

        for (const person of personOrder) {
            const duties = data[person];
            const filteredDuties = searchTerm ? duties.filter(duty => 
                duty.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                duty.description.toLowerCase().includes(lowerCaseSearchTerm)
            ) : duties;

            if (filteredDuties.length > 0) {
                html += `<div class="mb-4">
                            <h3 class="text-lg font-bold text-gray-800 sticky top-0 bg-white py-2 border-b-2 border-blue-600">${person}</h3>
                            <div class="space-y-2 mt-2">`;
                filteredDuties.forEach(duty => {
                    html += `<div class="p-3 bg-gray-50 rounded-lg border">
                                <p class="font-semibold text-gray-900">${duty.name}</p>
                                <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">${duty.description}</p>
                             </div>`;
                });
                html += `</div></div>`;
            }
        }
        
        if (html === '') {
            resultsContainer.innerHTML = '<p class="text-center text-gray-500 pt-8">找不到符合條件的業務</p>';
        } else {
            resultsContainer.innerHTML = html;
        }
    };

    const open = async () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        searchInput.focus();
        
        if (Object.keys(allDutiesData).length === 0) {
            resultsContainer.innerHTML = `<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i><p class="mt-2">正在載入業務總覽...</p></div>`;
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    body: JSON.stringify({ action: 'getAllDuties' }),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });
                const result = await response.json();
                if (result.status === 'success') {
                    allDutiesData = result.data;
                    renderAllDuties(allDutiesData);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                resultsContainer.innerHTML = `<p class="text-center text-red-500 pt-8">載入業務總覽失敗: ${error.message}</p>`;
            }
        } else {
            renderAllDuties(allDutiesData, searchInput.value);
        }
    };
    
    const close = () => {
        modal.classList.add('hidden');
    };

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    searchInput.addEventListener('input', (e) => {
        renderAllDuties(allDutiesData, e.target.value);
    });
}


// --- Initial Load ---
[cite_start]async function initializeDashboard() { [cite: 359]
    [cite_start]const loadingOverlay = document.getElementById('loadingOverlay'); [cite: 359]
    [cite_start]const errorDisplay = document.getElementById('errorDisplay'); [cite: 360]
    [cite_start]loadingOverlay.classList.remove('hidden'); [cite: 360]
    [cite_start]try { [cite: 360]
        [cite_start]const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'getDashboardData' }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); [cite: 360]
        [cite_start]if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`); [cite: 361]
        [cite_start]const result = await response.json(); [cite: 361]
        [cite_start]if (result.status !== 'success' || !result.data) throw new Error(result.message || "回傳的資料格式不正確"); [cite: 362]
        
        const userData = result.data.staffData || [cite_start][]; [cite: 362]
        [cite_start]staffData = userData.map(user => ({ id: user.employeeId, name: user.name, group: user.group, birthday: user.birthday, unit: user.unit })); [cite: 363]
        const itemData = result.data.activities || [cite_start][]; [cite: 364]
        [cite_start]const today = new Date(); [cite: 364]
        [cite_start]today.setHours(0, 0, 0, 0); [cite: 364]
        [cite_start]allActivities = itemData.map(item => { [cite: 365]
            const progress = parseInt(item.progress, 10) || [cite_start]0; [cite: 365]
            [cite_start]const deadline = item.deadline ? new Date(item.deadline) : null; [cite: 365]
            let finalStatus = item.status || [cite_start]'planning'; [cite: 365]
            [cite_start]if (progress >= 100) finalStatus = 'completed'; [cite: 365]
            [cite_start]else if (finalStatus !== 'completed' && deadline && deadline < today) finalStatus = 'overdue'; [cite: 365]
            return { ...item, progress, status: finalStatus, lastWeekProgress: item.lastWeekProgress ? parseInt(item.lastWeekProgress, 10) : 0, helpMessage: item.helpMessage || [cite_start]'', checklist: Array.isArray(item.checklist) ? item.checklist : [] }; [cite: 366]
        });
        [cite_start]renderUnitTabs(); [cite: 367]
        [cite_start]renderYearFilter(); [cite: 367]
        [cite_start]renderMonthFilter(); [cite: 367]
        [cite_start]renderDashboard(); [cite: 367]
        
        [cite_start]document.getElementById('openChatBot').classList.remove('hidden'); [cite: 367]
    [cite_start]} catch (error) { [cite: 367]
        [cite_start]console.error("Initialization failed:", error); [cite: 368]
        [cite_start]document.getElementById('errorMessage').textContent = `無法從伺服器獲取專案數據。請檢查您的網路連線或稍後再試。(${error.message})`; [cite: 368]
        [cite_start]errorDisplay.classList.remove('hidden'); [cite: 368]
    [cite_start]} finally { [cite: 368]
        [cite_start]loadingOverlay.classList.add('hidden'); [cite: 368]
    }
}

[cite_start]document.addEventListener('DOMContentLoaded', async function() { [cite: 369]
    [cite_start]if (!sessionStorage.getItem('dashboardUser')) { [cite: 369]
        [cite_start]window.location.href = 'index.html'; [cite: 369]
        [cite_start]return; [cite: 369]
    }
    [cite_start]setupUserInfo(); [cite: 369]
    [cite_start]setupAiModal(); [cite: 369]
    [cite_start]setupActivityModal(); [cite: 369]
    [cite_start]setupWeeklySummaryModal(); [cite: 369]
    [cite_start]setupScrollToTop(); [cite: 369]
    [cite_start]setupItemListModal(); [cite: 369]
    setupDutyListModal(); // 初始化職掌 Modal
    setupDutySearchModal(); // 初始化升級版的查詢 Modal
    [cite_start]setupChatBot(); [cite: 369]
    [cite_start]await initializeDashboard(); [cite: 369]
});
