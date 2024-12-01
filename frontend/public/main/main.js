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

    const BACKEND_URL = 'https://api.final-project.xyz';

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

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
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
                <span></span>
                <span>Task</span>
                <span>Organization</span>
                <span>Due Date</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
        `;

        const tasksHtml = tasks.map(task => `
            <div class="task-list-item" data-task-id="${task._id}">
                <div class="task-checkbox ${task.status.toLowerCase() === 'completed' ? 'completed' : ''}"></div>
                <div class="task-main-info">
                    <h3 class="task-title">${task.title}</h3>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    ${task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="task-organization">
                    ${task.organization ? task.organization.name : '—'}
                </div>
                <div class="task-due-date">
                    ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
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
        `).join('');

        tasksContainer.innerHTML = headerHtml + tasksHtml;
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
                </div>
                
                <p class="org-description">${org.description || 'No description provided'}</p>
                
                <div class="org-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${org.members.length} Members</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-tasks"></i>
                        <span>${org.tasks ? org.tasks.length : 0} Tasks</span>
                    </div>
                </div>
    
                <div class="org-members">
                    <h4>Members</h4>
                    <div class="members-list">
                        ${org.members.map(member => `
                            <div class="member ${member.role}">
                                <span class="member-initial">${member.user.username.charAt(0).toUpperCase()}</span>
                                <span class="member-name">${member.user.username}</span>
                                ${member.role === 'admin' ? '<span class="admin-badge">Admin</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
    
                <div class="org-actions">
                    ${org.members.find(m => m.role === 'admin' && m.user.username === user.username)
                ? `
                            <button class="manage-org-btn primary-btn">
                                <i class="fas fa-cog"></i> Manage
                            </button>
                        `
                : `
                            <button class="leave-org-btn secondary-btn">
                                <i class="fas fa-sign-out-alt"></i> Leave
                            </button>
                        `
            }
                </div>
            </div>
        `).join('');
    }

    // Load initial data
    async function loadData() {
        try {
            const [tasks, organizations] = await Promise.all([
                apiRequest('/api/tasks'),
                apiRequest('/api/organizations')
            ]);

            if (tasks) renderTasks(tasks);
            if (organizations) renderOrganizations(organizations);

            loading.style.display = 'none';
            app.style.display = 'flex';
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Please try again.');
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

    // Task Modal Handlers
    const taskModal = {
        show() {
            addTaskModal.style.display = 'block';
            populateOrganizationDropdowns(); // Populate organizations when modal opens
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
                        .filter(tag => tag), // Remove empty tags
                    status: form.querySelector('[name="status"]').value
                };

                // Validate required fields
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
                }
            } catch (error) {
                alert(error.message || 'Error creating task');
            }
        }
    };

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



    // Event Listeners
    document.querySelector('[data-view="tasks"]').addEventListener('click', () => switchView('tasks'));
    document.querySelector('[data-view="organizations"]').addEventListener('click', () => switchView('organizations'));


    // Helper function for confirmation dialog
    const showConfirmDialog = (message) => {
        return new Promise((resolve) => {
            const result = window.confirm(message);
            resolve(result);
        });
    };

    // Helper function for notifications
    const showNotification = (message, type = 'info') => {
        // You can enhance this with a proper notification system
        // For now, using alert
        alert(message);
    };

    
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

    // Task Actions
    tasksContainer.addEventListener('click', async (e) => {
        //const deleteBtn = e.target.closest('.delete-task-btn');
        // if (deleteBtn) {
        //     const taskId = deleteBtn.dataset.taskId;
        //     if (confirm('Are you sure you want to delete this task?')) {
        //         try {
        //             await apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' });
        //             loadData();
        //         } catch (error) {
        //             alert('Error deleting task');
        //         }
        //     }
        // }
        const deleteBtn = e.target.closest('.delete-task-btn');
        if (deleteBtn) {
            const taskId = deleteBtn.dataset.taskId;
            await deleteTask(taskId);
        }
    });

    // Organization Actions
    organizationsContainer.addEventListener('click', async (e) => {
        const leaveBtn = e.target.closest('.leave-org-btn');
        if (leaveBtn) {
            const orgId = leaveBtn.dataset.orgId;
            if (confirm('Are you sure you want to leave this organization?')) {
                try {
                    await apiRequest(`/api/organizations/${orgId}/leave`, { method: 'POST' });
                    loadData();
                } catch (error) {
                    alert('Error leaving organization');
                }
            }
        }
    });

    // Modal Event Listeners
    document.querySelector('[data-action="new-task"]').addEventListener('click', taskModal.show);
    document.querySelector('[data-action="new-organization"]').addEventListener('click', orgModal.show);

    addTaskModal.querySelector('.cancel-btn').addEventListener('click', taskModal.hide);
    addOrgModal.querySelector('.cancel-btn').addEventListener('click', orgModal.hide);

    addTaskModal.querySelector('form').addEventListener('submit', taskModal.handleSubmit);
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

    // Initialize
    switchView('tasks');
    loadData();
});