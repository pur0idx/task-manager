document.addEventListener('DOMContentLoaded', async function () {
    // DOM Elements
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    const tasksContainer = document.getElementById('tasks-container');
    const organizationsContainer = document.getElementById('organizations-container');
    const userInfo = document.getElementById('user-info');
    const addTaskModal = document.getElementById('add-task-modal');
    const addOrgModal = document.getElementById('add-org-modal');
    const logoutBtn = document.querySelector('.logout-btn');
    const viewTitle = document.getElementById('view-title');
    const tasksView = document.getElementById('tasks-view');
    const organizationsView = document.getElementById('organizations-view');
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.toggle-sidebar-btn');
    const mainContent = document.querySelector('.main-content');

    const BACKEND_URL = 'https://api.final-project.xyz';

    //FilterOrg
    let allTasks = [];
    let filteredTasks = [];

    // Add this at the top level with other state variables
    let organizations = []; // Store organizations data

    //check sidebar status
    const sidebarState = localStorage.getItem('sidebarCollapsed');
    if (sidebarState === 'true') {
        sidebar.classList.add('collapsed');
    }

    // Toggle sidebar
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });

    // Check JWT authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.username) {
        window.location.href = '/auth';
        return;
    }

    // Initialize UI
    loading.style.display = 'block';
    app.style.display = 'none';
    userInfo.textContent = `Welcome, ${user.username}!`;

    // API request helper
    async function apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth';
                return null;
            }

            // Add this block to handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned unexpected content type: ${contentType}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            if (error instanceof SyntaxError) {
                throw new Error('Server returned invalid response format');
            }
            throw error;
        }
    }

    // View switching
    function switchView(view) {
        if (view === 'tasks') {
            viewTitle.textContent = 'Tasks';
            tasksView.style.display = 'block';
            organizationsView.style.display = 'none';
            document.querySelector('[data-view="tasks"]').classList.add('active');
            document.querySelector('[data-view="organizations"]').classList.remove('active');
        } else {
            viewTitle.textContent = 'Organizations';
            tasksView.style.display = 'none';
            organizationsView.style.display = 'block';
            document.querySelector('[data-view="tasks"]').classList.remove('active');
            document.querySelector('[data-view="organizations"]').classList.add('active');
        }
    }



    // Render tasks
    function renderTasks(tasks) {
        tasksContainer.className = 'tasks-list';

        const headerHtml = `
            <div class="tasks-list-header">
                <div>Title</div>
                <div>Organization</div>
                <div>Due Date</div>
                <div>Tags</div>
                <div>Status</div>
                <div>Actions</div>
            </div>
        `;

        const tasksHtml = tasks.map(task => {
            // Format due date with time from now
            let dueDateDisplay = '—';
            let dueDateTitle = ''; // For hover tooltip
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const options = { month: 'short', day: 'numeric', year: 'numeric' };
                dueDateDisplay = dueDate.toLocaleDateString('en-US', options);

                // Add relative time for better context
                const today = new Date();
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    dueDateTitle = `Overdue by ${Math.abs(diffDays)} days`;
                } else if (diffDays === 0) {
                    dueDateTitle = 'Due today';
                } else if (diffDays === 1) {
                    dueDateTitle = 'Due tomorrow';
                } else {
                    dueDateTitle = `Due in ${diffDays} days`;
                }
            }

            // Format tags with better styling
            const tagsHtml = task.tags && Array.isArray(task.tags) && task.tags.length > 0
                ? task.tags.map(tag => `
                    <span class="task-tag">
                        <i class="fas fa-tag"></i>
                        ${tag}
                    </span>
                `).join('')
                : '—';

            return `
                <div class="task-list-item" data-task-id="${task._id}">
                    <div class="task-title">${task.title}</div>
                    <div class="task-organization">
                        ${task.organization ? task.organization.name : '—'}
                    </div>
                    <div class="task-due-date ${getDueDateClass(task.dueDate)}" title="${dueDateTitle}">
                        ${dueDateDisplay}
                    </div>
                    <div class="task-tags-container">
                        ${tagsHtml}
                    </div>
                    <div>
                        <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" title="Edit">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="task-action-btn delete-task-btn" data-task-id="${task._id}" title="Delete">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        tasksContainer.innerHTML = headerHtml + tasksHtml;
    }

    // Helper function to format date
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }

    // Helper function to get due date class
    function getDueDateClass(dueDate) {
        if (!dueDate) return '';

        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'due-today';
        if (diffDays === 1) return 'due-tomorrow';
        if (diffDays <= 7) return 'due-soon';
        return '';
    }

    // Render organizations
    function renderOrganizations(organizations) {
        organizationsContainer.innerHTML = organizations.map(org => `
            <div class="org-card" data-org-id="${org._id}">
                <div class="org-header">
                    <div class="org-icon">
                        ${org.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 class="org-name">${org.name}</h3>
                    ${org.members.find(m => m.user.username === user.username && m.role === 'admin') ? `
                        <button class="manage-org-btn" data-org-id="${org._id}">
                            <i class="fas fa-cog"></i>
                        </button>
                    ` : `
                        <button class="leave-org-btn" data-org-id="${org._id}">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    `}
                </div>
                
                <p class="org-description">${org.description || 'No description provided'}</p>
                
                <div class="org-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${org.members.length} Members</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-tasks"></i>
                        <span>${org.taskCount || 0} Tasks</span>
                    </div>
                </div>
    
                <div class="org-members">
                    <h4>Members</h4>
                    <div class="members-list">
                        ${org.members.map(member => `
                            <div class="member ${member.role}">
                                <span class="member-initial">${member.user.username.charAt(0).toUpperCase()}</span>
                                <span class="member-name">${member.user.username}</span>
                                <span class="member-role">${member.role}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Load initial data
    async function loadData() {
        try {
            const [tasks, orgs] = await Promise.all([
                apiRequest('/api/tasks'),
                apiRequest('/api/organizations')
            ]);

            if (tasks) {
                // Filter out archived tasks from the main view
                allTasks = tasks.filter(task => !task.archived);
                filteredTasks = [...allTasks];
                renderTasks(filteredTasks);
                await populateTagFilter();
                await populateOrganizationFilter();
            }
            if (orgs) {
                organizations = orgs;
                renderOrganizations(organizations);
            }
            loading.style.display = 'none';
            app.style.display = 'flex';
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Error loading data. Please try again.', 'error');
        }
    }

    //Dropdown org
    async function populateOrganizationFilter() {
        try {
            const organizations = await apiRequest('/api/organizations/list');
            const orgFilterSelect = document.querySelector('select[name="org-filter"]');

            const options = organizations.map(org =>
                `<option value="${org._id}">${org.name}</option>`
            ).join('');

            orgFilterSelect.innerHTML = `
                <option value="">All Organizations</option>
                ${options}
            `;
        } catch (error) {
            console.error('Error loading organizations for filter:', error);
        }
    }



    function applyFilters() {
        const orgFilter = document.querySelector('select[name="org-filter"]').value;
        const statusFilter = document.querySelector('select[name="status"]').value;
        const searchInput = document.querySelector('.search-bar input').value.toLowerCase().trim();
        const tagFilter = document.querySelector('select[name="tag-filter"]').value;
        const sortOrder = document.querySelector('select[name="sort-by"]').value;

        // First apply all filters
        filteredTasks = allTasks.filter(task => {
            const matchesOrg = !orgFilter ||
                (task.organization && task.organization._id === orgFilter);

            const matchesStatus = statusFilter === 'all' ||
                task.status.toLowerCase() === statusFilter.toLowerCase();

            const matchesSearch = !searchInput ||
                task.title.toLowerCase().includes(searchInput) ||
                (task.description && task.description.toLowerCase().includes(searchInput)) ||
                (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchInput))) ||
                (task.organization && task.organization.name.toLowerCase().includes(searchInput));

            const matchesTag = !tagFilter || (
                task.tags &&
                Array.isArray(task.tags) &&
                task.tags.some(tag => tag.trim() === tagFilter.trim())
            );

            return matchesOrg && matchesStatus && matchesSearch && matchesTag;
        });

        // Then apply sorting if a sort order is selected
        if (sortOrder !== 'none') {
            filteredTasks.sort((a, b) => {
                // Handle cases where dueDate is undefined or null
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;  // Push tasks without due dates to the end
                if (!b.dueDate) return -1; // Push tasks without due dates to the end

                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);

                if (sortOrder === 'asc') {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });
        }

        // Update the UI
        renderTasks(filteredTasks);

        // Update results count
        const resultsCount = document.getElementById('search-results-count');
        if (resultsCount) {
            resultsCount.textContent = `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} found`;
        }
    }

    async function populateOrganizationDropdowns() {
        try {
            const organizations = await apiRequest('/api/organizations/list');
            const orgDropdowns = document.querySelectorAll('select[name="organization"]');

            const options = organizations.map(org =>
                `<option value="${org._id}">${org.name}</option>`
            ).join('');

            orgDropdowns.forEach(dropdown => {
                dropdown.innerHTML = `
                    <option value="">Select Organization</option>
                    ${options}
                `;
            });
        } catch (error) {
            console.error('Error loading organizations:', error);
        }
    }

    // Update the taskModal object to handle only task creation
    const taskModal = {
        show() {
            const modal = document.getElementById('add-task-modal');
            const form = modal.querySelector('form');
            const modalTitle = modal.querySelector('h2');
            const submitButton = form.querySelector('button[type="submit"]');

            // Reset form and set for creation mode
            form.reset();
            modalTitle.textContent = 'Add New Task';
            submitButton.textContent = 'Create Task';

            // Set the form submission handler for creating new task
            form.onsubmit = this.handleSubmit;

            modal.style.display = 'block';
            populateOrganizationDropdowns();
        },
        hide() {
            addTaskModal.style.display = 'none';
            addTaskModal.querySelector('form').reset();
        },
        async handleSubmit(event) {
            event.preventDefault();
            const form = event.target;

            try {
                const taskData = {
                    title: form.querySelector('[name="title"]').value.trim(),
                    description: form.querySelector('[name="description"]').value.trim(),
                    dueDate: form.querySelector('[name="dueDate"]').value,
                    organization: form.querySelector('[name="organization"]').value || null,
                    tags: form.querySelector('[name="tags"]').value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag),
                    status: form.querySelector('[name="status"]').value
                };

                if (!taskData.title) {
                    throw new Error('Title is required');
                }

                const response = await apiRequest('/api/tasks', {
                    method: 'POST',
                    body: JSON.stringify(taskData)
                });

                if (response) {
                    await loadData();
                    taskModal.hide();
                    showNotification('Task created successfully', 'success');
                }
            } catch (error) {
                console.error('Error creating task:', error);
                showNotification(error.message || 'Error creating task', 'error');
            }
        }
    };

    // Separate function for handling task updates
    function showEditTaskModal(task) {
        const modal = document.getElementById('add-task-modal');
        const form = modal.querySelector('form');
        const modalTitle = modal.querySelector('h2');
        const submitButton = form.querySelector('button[type="submit"]');

        // Update modal title and button text
        modalTitle.textContent = 'Edit Task';
        submitButton.textContent = 'Update Task';

        // Fill in existing values
        form.querySelector('[name="title"]').value = task.title;
        form.querySelector('[name="description"]').value = task.description || '';
        form.querySelector('[name="dueDate"]').value = task.dueDate ? task.dueDate.split('T')[0] : '';
        form.querySelector('[name="organization"]').value = task.organization ? task.organization._id : '';
        form.querySelector('[name="tags"]').value = task.tags ? task.tags.join(', ') : '';
        form.querySelector('[name="status"]').value = task.status;

        // Create a separate handler for task updates
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const updatedData = {
                    title: form.querySelector('[name="title"]').value.trim(),
                    description: form.querySelector('[name="description"]').value.trim(),
                    dueDate: form.querySelector('[name="dueDate"]').value,
                    organization: form.querySelector('[name="organization"]').value || null,
                    tags: form.querySelector('[name="tags"]').value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag),
                    status: form.querySelector('[name="status"]').value
                };

                if (!updatedData.title) {
                    throw new Error('Title is required');
                }

                const response = await apiRequest(`/api/tasks/${task._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedData)
                });

                if (response) {
                    await loadData();
                    modal.style.display = 'none';
                    showNotification('Task updated successfully', 'success');
                }
            } catch (error) {
                console.error('Error updating task:', error);
                showNotification(error.message || 'Error updating task', 'error');
            }
        };

        // Show the modal and populate organization dropdown
        modal.style.display = 'block';
        populateOrganizationDropdowns();
    }

    // Organization Modal Handlers
    const orgModal = {
        show() {
            addOrgModal.style.display = 'block';
        },
        hide() {
            addOrgModal.style.display = 'none';
            addOrgModal.querySelector('form').reset();
        },
        async handleSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const orgData = {
                name: form.querySelector('[name="name"]').value,
                description: form.querySelector('[name="description"]').value,
                members: form.querySelector('[name="members"]').value.split(',').map(m => m.trim())
            };

            try {
                const response = await apiRequest('/api/organizations', {
                    method: 'POST',
                    body: JSON.stringify(orgData)
                });

                if (response) {
                    loadData();
                    orgModal.hide();
                }
            } catch (error) {
                alert('Error creating organization');
            }
        }
    };


    //To make the search more interactive, let's add a real-time search event listener:
    document.querySelector('.search-bar input').addEventListener('input', applyFilters);

    // Event Listeners
    document.querySelector('[data-view="tasks"]').addEventListener('click', () => switchView('tasks'));
    document.querySelector('[data-view="organizations"]').addEventListener('click', () => switchView('organizations'));

    //Filter ORG
    document.querySelector('select[name="org-filter"]').addEventListener('change', applyFilters);

    // Add this new status filter code here
    // Add this modified status filter code
    document.querySelector('select[name="status"]').addEventListener('change', (e) => {
        console.log('Status changed to:', e.target.value); // Debug log
        const selectedStatus = e.target.value.toLowerCase();
        const allTasks = document.querySelectorAll('.task-list-item');

        allTasks.forEach(task => {
            const taskStatus = task.querySelector('.task-status').textContent.toLowerCase();
            console.log('Task status:', taskStatus); // Debug log
            if (selectedStatus === 'all' || taskStatus === selectedStatus) {
                task.style.display = '';
            } else {
                task.style.display = 'none';
            }
        });
    });

    // Helper function for confirmation dialog
    const showConfirmDialog = (message) => {
        return new Promise((resolve) => {
            const result = window.confirm(message);
            resolve(result);
        });
    };

    // Helper function for notifications
    // Add this notification function
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Update your task action handlers to use notifications
    tasksContainer.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-task-btn');
        const editBtn = e.target.closest('.task-action-btn:not(.delete-task-btn)');

        if (deleteBtn) {
            const taskId = deleteBtn.dataset.taskId;
            try {
                const confirmed = await showConfirmDialog('Are you sure you want to archive this task?');
                if (!confirmed) return;

                const response = await apiRequest(`/api/tasks/${taskId}/archive`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        archived: true,
                        archivedAt: new Date()
                    })
                });

                if (response) {
                    showNotification('Task archived successfully', 'success');
                    await loadData();
                }
            } catch (error) {
                console.error('Error archiving task:', error);
                showNotification('Error archiving task. Please try again.', 'error');
            }
        } else if (editBtn) {
            const taskId = editBtn.closest('.task-list-item').dataset.taskId;
            const task = allTasks.find(t => t._id === taskId);
            if (task) {
                showEditTaskModal(task);
            }
        }
    });

    // Add notifications for other actions
    async function restoreTask(taskId) {
        try {
            const response = await apiRequest(`/api/tasks/${taskId}/restore`, {
                method: 'PATCH',
                body: JSON.stringify({ archived: false })
            });

            if (response) {
                showNotification('Task restored successfully', 'success');
                await loadArchivedTasks();
            }
        } catch (error) {
            console.error('Error restoring task:', error);
            showNotification('Error restoring task. Please try again.', 'error');
        }
    }

    //deleteTask
    const deleteTask = async (taskId) => {
        try {
            const confirmed = await showConfirmDialog('Are you sure you want to delete this task?');
            if (!confirmed) return;

            const response = await apiRequest(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response) {
                // Remove the task from DOM immediately for better UX
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.remove();
                }

                // Show success message
                showNotification('Task deleted successfully', 'success');

                // Reload the tasks to ensure everything is in sync
                await loadData();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Error deleting task. Please try again.', 'error');
        }
    };

    // Update the click handlers
    document.querySelector('[data-action="new-task"]').addEventListener('click', () => taskModal.show());

    // Update the task actions event listener
    // tasksContainer.addEventListener('click', async (e) => {
    //     const deleteBtn = e.target.closest('.delete-task-btn');
    //     const editBtn = e.target.closest('.task-action-btn:not(.delete-task-btn)');

    //     if (deleteBtn) {
    //         const taskId = deleteBtn.dataset.taskId;
    //         try {
    //             const confirmed = await showConfirmDialog('Are you sure you want to archive this task?');
    //             if (!confirmed) return;

    //             const response = await apiRequest(`/api/tasks/${taskId}/archive`, {
    //                 method: 'PATCH',
    //                 body: JSON.stringify({
    //                     archived: true,
    //                     archivedAt: new Date()
    //                 })
    //             });

    //             if (response) {
    //                 // Remove the task from DOM immediately for better UX
    //                 const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    //                 if (taskElement) {
    //                     taskElement.remove();
    //                 }

    //                 // Show success message
    //                 showNotification('Task archived successfully', 'success');

    //                 // Reload the tasks to ensure everything is in sync
    //                 await loadData();
    //             }
    //         } catch (error) {
    //             console.error('Error archiving task:', error);
    //             showNotification('Error archiving task. Please try again.', 'error');
    //         }
    //     } else if (editBtn) {
    //         const taskId = editBtn.closest('.task-list-item').dataset.taskId;
    //         const task = allTasks.find(t => t._id === taskId);
    //         if (task) {
    //             showEditTaskModal(task);
    //         }
    //     }
    // });

    // Organization Actions
    organizationsContainer.addEventListener('click', async (e) => {
        const leaveBtn = e.target.closest('.leave-org-btn');
        const manageBtn = e.target.closest('.manage-org-btn');
        const orgCard = e.target.closest('.org-card');

        if (leaveBtn) {
            e.stopPropagation(); // Prevent card click
            const orgId = leaveBtn.dataset.orgId;

            if (confirm('Are you sure you want to leave this organization?')) {
                try {
                    const response = await apiRequest(`/api/organizations/${orgId}/members/leave`, {
                        method: 'DELETE'
                    });

                    if (response) {
                        showNotification('Successfully left the organization', 'success');
                        await loadData(); // Refresh the organizations list
                    }
                } catch (error) {
                    console.error('Error leaving organization:', error);
                    showNotification('Error leaving organization', 'error');
                }
            }
        } else if (manageBtn) {
            // Handle manage button click
            e.stopPropagation(); // Prevent card click
            const orgId = orgCard.dataset.orgId;
            const organization = organizations.find(org => org._id === orgId);
            if (organization) {
                showManageOrgModal(organization);
            }
        } else if (orgCard) {
            // Handle card click (show tasks)
            const orgId = orgCard.dataset.orgId;
            switchView('tasks');

            const orgFilter = document.querySelector('select[name="org-filter"]');
            if (orgFilter) {
                orgFilter.value = orgId;
                applyFilters();
            }
        }
    });

    // Modal Event Listeners
    document.querySelector('[data-action="new-organization"]').addEventListener('click', orgModal.show);
    document.querySelector('[data-action="new-task"]').addEventListener('click', () => taskModal.show());

    // Update cancel buttons
    addTaskModal.querySelector('.cancel-btn').addEventListener('click', () => {
        addTaskModal.style.display = 'none';
        addTaskModal.querySelector('form').reset();
    });
    addOrgModal.querySelector('.cancel-btn').addEventListener('click', orgModal.hide);

    // Only keep organization form submit listener
    addOrgModal.querySelector('form').addEventListener('submit', orgModal.handleSubmit);

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addTaskModal) taskModal.hide();
        if (e.target === addOrgModal) orgModal.hide();
    });

    // Organization search
    const orgSearchContainer = document.createElement('div');
    orgSearchContainer.className = 'org-search-input';

    const searchIcon = document.createElement('i');
    searchIcon.className = 'fas fa-search';
    orgSearchContainer.appendChild(searchIcon);

    const orgSearchInput = document.createElement('input');
    orgSearchInput.type = 'text';
    orgSearchInput.placeholder = 'Search organizations...';
    orgSearchContainer.appendChild(orgSearchInput);

    // Add this before the organizations container in the HTML
    document.getElementById('organizations-view').insertBefore(orgSearchContainer, document.getElementById('organizations-container'));

    orgSearchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        const orgCards = document.querySelectorAll('.org-card');
        let visibleCount = 0;

        orgCards.forEach(card => {
            const orgName = card.querySelector('.org-name').textContent.toLowerCase();
            const orgDescription = card.querySelector('.org-description').textContent.toLowerCase();
            const orgMembers = Array.from(card.querySelectorAll('.member-name'))
                .map(member => member.textContent.toLowerCase());

            const matches = orgName.includes(searchTerm) ||
                orgDescription.includes(searchTerm) ||
                orgMembers.some(member => member.includes(searchTerm));

            card.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        // Update results count with more detail
        const resultsCountSpan = document.querySelector('.search-results-count') || document.createElement('span');
        resultsCountSpan.className = 'search-results-count';
        resultsCountSpan.textContent = searchTerm
            ? `Found ${visibleCount} organization${visibleCount !== 1 ? 's' : ''} matching "${searchTerm}"`
            : `Showing all ${visibleCount} organization${visibleCount !== 1 ? 's' : ''}`;

        // Insert the counter after the search input if it doesn't exist
        if (!document.querySelector('.search-results-count')) {
            orgSearchContainer.appendChild(resultsCountSpan);
        }
    });

    // Initialize
    switchView('tasks');
    loadData();

    // Create separate modals
    function createModals() {
        // Add Organization Modal
        if (!document.getElementById('add-org-modal')) {
            const addOrgModal = document.createElement('div');
            addOrgModal.id = 'add-org-modal';
            addOrgModal.className = 'modal';
            addOrgModal.innerHTML = `
                <div class="modal-content">
                    <h2>Create Organization</h2>
                    <form id="add-org-form">
                        <div class="form-group">
                            <label for="new-org-name">Organization Name</label>
                            <input type="text" id="new-org-name" name="org-name" required>
                        </div>
                        <div class="form-group">
                            <label for="new-org-description">Description</label>
                            <textarea id="new-org-description" name="org-description"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="new-org-members">Initial Members (comma-separated usernames)</label>
                            <input type="text" id="new-org-members" name="org-members" placeholder="e.g., user1, user2">
                            <small>Optional: Add initial members to your organization</small>
                        </div>
                        <div class="button-group">
                            <button type="submit" class="primary-btn">Create Organization</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(addOrgModal);

            // Add close functionality
            addOrgModal.addEventListener('click', (e) => {
                if (e.target === addOrgModal) addOrgModal.style.display = 'none';
            });

            // Handle form submission for new organization
            const addOrgForm = document.getElementById('add-org-form');
            addOrgForm.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    const response = await apiRequest('/api/organizations', {
                        method: 'POST',
                        body: JSON.stringify({
                            name: addOrgForm.querySelector('#new-org-name').value,
                            description: addOrgForm.querySelector('#new-org-description').value,
                            members: addOrgForm.querySelector('#new-org-members').value
                                .split(',')
                                .map(username => username.trim())
                                .filter(username => username)
                        })
                    });

                    if (response.success) {
                        addOrgModal.style.display = 'none';
                        addOrgForm.reset();
                        await loadData();
                    }
                } catch (error) {
                    console.error('Error creating organization:', error);
                    alert('Error creating organization');
                }
            };
        }

        // Manage Organization Modal
        if (!document.getElementById('manage-org-modal')) {
            const manageOrgModal = document.createElement('div');
            manageOrgModal.id = 'manage-org-modal';
            manageOrgModal.className = 'modal';
            manageOrgModal.innerHTML = `
                <div class="modal-content">
                    <h2>Manage Organization</h2>
                    <form id="manage-org-form">
                        <div class="form-group">
                            <label for="edit-org-name">Organization Name</label>
                            <input type="text" id="edit-org-name" name="org-name" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-org-description">Description</label>
                            <textarea id="edit-org-description" name="org-description"></textarea>
                        </div>
                        <div class="members-management">
                            <h3>Members</h3>
                            <div class="current-members"></div>
                            <div class="add-member-section">
                                <div class="add-member-input">
                                    <input type="text" id="new-member-input" placeholder="Enter username">
                                    <button type="button" id="add-member-btn" class="secondary-btn">Add Member</button>
                                </div>
                            </div>
                        </div>
                        <div class="button-group">
                            <button type="submit" class="primary-btn">Update Organization</button>
                            <button type="button" class="delete-org-btn">
                                <i class="fas fa-trash"></i> Delete Organization
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(manageOrgModal);

            // Add close functionality
            manageOrgModal.addEventListener('click', (e) => {
                if (e.target === manageOrgModal) manageOrgModal.style.display = 'none';
            });
        }
    }

    // Update the showManageOrgModal function
    function showManageOrgModal(organization) {
        createModals();
        const modal = document.getElementById('manage-org-modal');
        const form = document.getElementById('manage-org-form');

        // Fill in existing values
        form.querySelector('#edit-org-name').value = organization.name;
        form.querySelector('#edit-org-description').value = organization.description || '';

        // Render current members
        const membersContainer = form.querySelector('.current-members');
        membersContainer.innerHTML = organization.members.map(member => `
            <div class="member-item" data-username="${member.user.username}">
                <span>${member.user.username}</span>
                <span class="member-role">${member.role}</span>
                ${member.role !== 'admin' ? `
                    <button type="button" class="remove-member-btn" data-username="${member.user.username}">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');

        // Handle adding new members
        const addMemberBtn = form.querySelector('#add-member-btn');
        const newMemberInput = form.querySelector('#new-member-input');

        addMemberBtn.onclick = async () => {
            const username = newMemberInput.value.trim();
            if (username) {
                try {
                    const response = await apiRequest(`/api/organizations/${organization._id}/members`, {
                        method: 'POST',
                        body: JSON.stringify({ username })
                    });
                    if (response.success) {
                        // Refresh the organization data
                        await loadData();
                        // Refresh the modal with updated data
                        const updatedOrg = organizations.find(org => org._id === organization._id);
                        if (updatedOrg) showManageOrgModal(updatedOrg);
                        newMemberInput.value = '';
                    }
                } catch (error) {
                    alert('Error adding member');
                }
            }
        };

        // Handle removing members
        membersContainer.addEventListener('click', async (e) => {
            const removeBtn = e.target.closest('.remove-member-btn');
            if (removeBtn) {
                const username = removeBtn.dataset.username;
                if (confirm(`Are you sure you want to remove ${username} from the organization?`)) {
                    try {
                        const response = await apiRequest(`/api/organizations/${organization._id}/members/${username}`, {
                            method: 'DELETE'
                        });
                        if (response.success) {
                            // Refresh the organization data
                            await loadData();
                            // Refresh the modal with updated data
                            const updatedOrg = organizations.find(org => org._id === organization._id);
                            if (updatedOrg) showManageOrgModal(updatedOrg);
                        }
                    } catch (error) {
                        alert('Error removing member');
                    }
                }
            }
        });

        // Update the form submission handler
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const updatedData = {
                    name: form.querySelector('#edit-org-name').value,
                    description: form.querySelector('#edit-org-description').value
                };

                // Add validation
                if (!updatedData.name.trim()) {
                    throw new Error('Organization name is required');
                }

                const response = await apiRequest(`/api/organizations/${organization._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedData)
                });

                if (response) {
                    modal.style.display = 'none';
                    await loadData();
                    showNotification('Organization updated successfully', 'success');
                }

            } catch (error) {
                console.error('Error updating organization:', error);
                showNotification(error.message || 'Error updating organization', 'error');
            }
        };

        // Handle delete organization
        const deleteBtn = form.querySelector('.delete-org-btn');
        deleteBtn.onclick = async () => {
            if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
                try {
                    const response = await apiRequest(`/api/organizations/${organization._id}`, {
                        method: 'DELETE'
                    });

                    if (response.success) {
                        modal.style.display = 'none';
                        await loadData();
                    }
                } catch (error) {
                    console.error('Error deleting organization:', error);
                    alert('Error deleting organization');
                }
            }
        };

        modal.style.display = 'block';
    }

    // Update the add organization button click handler
    document.getElementById('add-org-btn').addEventListener('click', () => {
        createModals();
        const modal = document.getElementById('add-org-modal');
        const form = document.getElementById('add-org-form');
        form.reset();
        modal.style.display = 'block';
    });

    // Add this function to populate the tag filter dropdown
    async function populateTagFilter() {
        // Get unique tags from all tasks
        const uniqueTags = new Set();
        allTasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        uniqueTags.add(tag.trim());
                    }
                });
            }
        });

        // Get the filter options container
        const filterOptions = document.querySelector('.filter-options');

        // Create tag filter select if it doesn't exist
        let tagSelect = filterOptions.querySelector('select[name="tag-filter"]');
        if (!tagSelect) {
            tagSelect = document.createElement('select');
            tagSelect.name = 'tag-filter';
            filterOptions.appendChild(tagSelect);
        }

        // Create options HTML
        const options = Array.from(uniqueTags)
            .sort()
            .map(tag => `<option value="${tag}">${tag}</option>`)
            .join('');

        // Set the innerHTML with default option
        tagSelect.innerHTML = `
            <option value="">All Tags</option>
            ${options}
        `;

        // Add event listener for tag filtering
        tagSelect.addEventListener('change', applyFilters);
    }

    // Add event listener for the sort dropdown
    document.querySelector('select[name="sort-by"]').addEventListener('change', function () {
        const sortOrder = this.value;

        // Immediate sort when dropdown changes
        if (sortOrder === 'asc') {
            // Sort earliest first
            filteredTasks.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        } else if (sortOrder === 'desc') {
            // Sort latest first
            filteredTasks.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(b.dueDate) - new Date(a.dueDate);
            });
        }

        // Immediately render the sorted tasks
        renderTasks(filteredTasks);
    });

    // Add this function at the top level
    function sortTasks(tasks, sortOrder) {
        if (!sortOrder || sortOrder === 'none') return tasks;

        return [...tasks].sort((a, b) => {
            if (sortOrder === 'asc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(b.dueDate) - new Date(a.dueDate);
            }
        });
    }

    // Update the applyFilters function
    function applyFilters() {
        const orgFilter = document.querySelector('select[name="org-filter"]').value;
        const statusFilter = document.querySelector('select[name="status"]').value;
        const searchInput = document.querySelector('.search-bar input').value.toLowerCase().trim();
        const tagFilter = document.querySelector('select[name="tag-filter"]').value;
        const sortOrder = document.querySelector('select[name="sort-by"]').value;

        // First apply all filters
        filteredTasks = allTasks.filter(task => {
            const matchesOrg = !orgFilter || (task.organization && task.organization._id === orgFilter);
            const matchesStatus = statusFilter === 'all' || task.status.toLowerCase() === statusFilter.toLowerCase();
            const matchesSearch = !searchInput ||
                task.title.toLowerCase().includes(searchInput) ||
                (task.description && task.description.toLowerCase().includes(searchInput));
            const matchesTag = !tagFilter || (task.tags && task.tags.includes(tagFilter));

            return matchesOrg && matchesStatus && matchesSearch && matchesTag;
        });

        // Then apply sorting
        filteredTasks = sortTasks(filteredTasks, sortOrder);

        // Update the UI
        renderTasks(filteredTasks);
    }

    // Add this function to create and show organization tasks pane
    function showOrganizationTasks(orgId, orgName) {
        // Create organization tasks pane
        const orgTasksPane = document.createElement('div');
        orgTasksPane.className = 'org-tasks-pane modal';

        // Filter tasks for this organization
        const orgTasks = allTasks.filter(task => task.organization && task.organization._id === orgId);

        // Create the content
        orgTasksPane.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${orgName} Tasks</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="tasks-list">
                    <div class="tasks-list-header">
                        <div>Title</div>
                        <div>Due Date</div>
                        <div>Tags</div>
                        <div>Status</div>
                    </div>
                    ${orgTasks.map(task => `
                        <div class="task-list-item">
                            <div class="task-title">${task.title}</div>
                            <div class="task-due-date ${getDueDateClass(task.dueDate)}">
                                ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </div>
                            <div class="task-tags">
                                ${task.tags ? task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('') : '—'}
                            </div>
                            <div>
                                <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(orgTasksPane);

        // Add close functionality
        const closeBtn = orgTasksPane.querySelector('.close-btn');
        closeBtn.onclick = () => {
            orgTasksPane.remove();
        };

        // Close when clicking outside
        orgTasksPane.onclick = (e) => {
            if (e.target === orgTasksPane) {
                orgTasksPane.remove();
            }
        };
    }

    // Update the organization card click handler
    organizationsContainer.addEventListener('click', async (e) => {
        const orgCard = e.target.closest('.org-card');
        if (orgCard && !e.target.closest('.manage-org-btn')) {
            const orgId = orgCard.dataset.orgId;
            const orgName = orgCard.querySelector('.org-name').textContent;
            showOrganizationTasks(orgId, orgName);
        }
    });

    // Update the archiveTask function
    async function archiveTask(taskId) {
        try {
            const token = localStorage.getItem('token'); // Get token directly from localStorage
            if (!token) {
                window.location.href = '/auth';
                return;
            }

            const confirmed = await showConfirmDialog('Are you sure you want to archive this task?');
            if (!confirmed) return;

            const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/archive`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Remove the task from DOM immediately for better UX
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.remove();
                }

                // Update the tasks lists
                allTasks = allTasks.filter(task => task._id !== taskId);
                filteredTasks = filteredTasks.filter(task => task._id !== taskId);

                showNotification('Task archived successfully', 'success');
            } else {
                throw new Error(data.message || 'Failed to archive task');
            }
        } catch (error) {
            console.error('Error archiving task:', error);
            showNotification('Error archiving task. Please try again.', 'error');
        }
    }

    // Update the event listener for the delete button
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-task-btn')) {
            const taskId = e.target.closest('.delete-task-btn').dataset.taskId;
            await archiveTask(taskId);
        }
    });

    // Add function to load archived tasks
    async function loadArchivedTasks() {
        try {
            const response = await fetch('/api/tasks/archived', {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch archived tasks');

            const archivedTasks = await response.json();
            renderTasks(archivedTasks);
        } catch (error) {
            console.error('Error loading archived tasks:', error);
            showNotification('Failed to load archived tasks', 'error');
        }
    }

    // Add a toggle button in the header to switch between active and archived tasks
    const headerActions = document.querySelector('.header-actions');
    const toggleButton = document.createElement('button');
    toggleButton.className = 'secondary-btn';
    toggleButton.innerHTML = '<i class="fas fa-archive"></i> Show Archived';
    toggleButton.addEventListener('click', function () {
        const isShowingArchived = this.classList.toggle('active');
        if (isShowingArchived) {
            this.innerHTML = '<i class="fas fa-tasks"></i> Show Active';
            loadArchivedTasks();
        } else {
            this.innerHTML = '<i class="fas fa-archive"></i> Show Archived';
            loadTasks();
        }
    });
    headerActions.appendChild(toggleButton);

    // Add this to your existing code
    document.querySelector('.sidebar').addEventListener('click', function (e) {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            const icon = menuItem.querySelector('i');
            if (icon && icon.classList.contains('fa-box-archive')) {
                window.location.href = '/archive';
            }
        }
    });

    // Find the archive button in the sidebar
    const archiveButton = document.querySelector('[data-view="archive"]');

    if (archiveButton) {
        archiveButton.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Archive button clicked'); // Debug log
            // Direct navigation to archive page
            window.location.href = '/archive';
        });
    } else {
        console.error('Archive button not found'); // Debug log
    }

    // Add this event listener to refresh tasks when requested
    window.addEventListener('message', function (event) {
        if (event.data === 'refreshTasks') {
            loadData(); // Ensure this function fetches the latest tasks
        }
    });
});
document.addEventListener('DOMContentLoaded', function() {
    // First, let's check if we can find the button
    const themeSwitch = document.getElementById('theme-switch');
    console.log('Found theme switch button:', themeSwitch); // Debug log

    // Only proceed if we found the button
    if (themeSwitch) {
        // Test with a simple color change first
        themeSwitch.addEventListener('click', function() {
            console.log('Button clicked!'); // Debug log
            
            // Simple test - just change background color
            if (document.body.style.backgroundColor === 'black') {
                document.body.style.backgroundColor = 'white';
                document.body.style.color = 'black';
            } else {
                document.body.style.backgroundColor = 'black';
                document.body.style.color = 'white';
            }
        });
    } else {
        console.error('Theme switch button not found!');
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // Basic test to see if our script runs
    console.log('Script is running');
    
    // Try to find the button
    const themeButton = document.getElementById('theme-switch');
    console.log('Theme button found:', themeButton);
    
    if (themeButton) {
        themeButton.onclick = function() {
            console.log('Button clicked');
        };
    }
});


