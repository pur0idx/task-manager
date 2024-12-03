document.addEventListener('DOMContentLoaded', async function () {
    const BACKEND_URL = 'http://localhost:4096';
    const token = localStorage.getItem('token');
    const archivedTasksContainer = document.getElementById('archived-tasks-container');
    
    if (!token) {
        window.location.href = '/auth';
        return;
    }

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

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Render archived tasks
    function renderArchivedTasks(tasks) {
        const container = document.getElementById('archived-tasks-container');
        
        const archivedTasks = tasks.filter(task => task.archived === true);
        
        if (!archivedTasks.length) {
            container.innerHTML = '<div class="no-tasks">No archived tasks found</div>';
            return;
        }

        const tasksHtml = archivedTasks.map(task => `
            <div class="task-item" data-task-id="${task._id}">
                <div class="task-title">${task.title}</div>
                <div class="task-due-date">${formatDate(task.dueDate)}</div>
                <div class="task-tags">${task.tags ? task.tags.join(', ') : '—'}</div>
                <div class="task-org">${task.organization ? task.organization.name : '—'}</div>
                <div class="task-status ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</div>
                <div class="task-actions">
                    <button class="restore-btn" title="Restore Task">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="delete-btn" title="Delete Permanently">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = tasksHtml;
    }

    // Load archived tasks
    async function loadArchivedTasks() {
        try {
            const tasks = await apiRequest('/api/tasks');
            const archivedTasks = tasks.filter(task => task.archived === true);
            renderArchivedTasks(archivedTasks);
        } catch (error) {
            console.error('Error loading archived tasks:', error);
            showNotification('Error loading archived tasks', 'error');
        }
    }

    // Event listeners for restore and delete actions
    archivedTasksContainer.addEventListener('click', async (e) => {
        const restoreBtn = e.target.closest('.restore-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (restoreBtn) {
            const taskItem = restoreBtn.closest('.task-item');
            const taskId = taskItem.getAttribute('data-task-id');
            
            try {
                const data = await apiRequest(`/api/tasks/${taskId}/restore`, {
                    method: 'PATCH'
                });

                if (data.success) {
                    showNotification('Task restored successfully', 'success');
                    taskItem.remove();
                    await loadArchivedTasks();
                    // Trigger a refresh of the main tasks view if possible
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage('refreshTasks', '*');
                    }
                } else {
                    throw new Error(data.message || 'Failed to restore task');
                }
            } catch (error) {
                console.error('Error restoring task:', error);
                showNotification('Error restoring task', 'error');
            }
        }
        
        if (deleteBtn) {
            const taskItem = deleteBtn.closest('.task-item');
            if (!taskItem) return;
            
            const taskId = taskItem.getAttribute('data-task-id');
            console.log('Deleting task with ID:', taskId); // Debug log
            
            if (confirm('Are you sure you want to permanently delete this task?')) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        showNotification('Task deleted successfully', 'success');
                        taskItem.remove();
                        await loadArchivedTasks();
                    } else {
                        throw new Error('Failed to delete task');
                    }
                } catch (error) {
                    console.error('Error deleting task:', error);
                    showNotification('Error deleting task', 'error');
                }
            }
        }
    });

    // Show notification function
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Theme switching functionality
    const themeSwitch = document.getElementById('theme-switch');
    const themeSwitchIcon = themeSwitch.querySelector('i');
    const themeSwitchText = themeSwitch.querySelector('span');
    const expandedLogo = document.querySelector('.logo');
    
    // Get the current theme from localStorage or default to 'light'
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton(currentTheme);
    updateLogo(currentTheme);

    themeSwitch.addEventListener('click', function() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update CSS variables based on theme
        if (newTheme === 'dark') {
            root.style.setProperty('--primary-color', '#f89b29');
            root.style.setProperty('--secondary-color', '#ff8a00');
            root.style.setProperty('--dark-primary-color', '#e68a25');
        } else {
            root.style.setProperty('--primary-color', '#6E9CDD');
            root.style.setProperty('--secondary-color', '#4A90E2');
            root.style.setProperty('--dark-primary-color', '#5b84bd');
        }

        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
        updateLogo(newTheme);
    });

    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeSwitchIcon.className = 'fas fa-sun';
            themeSwitchText.textContent = 'Light Mode';
        } else {
            themeSwitchIcon.className = 'fas fa-moon';
            themeSwitchText.textContent = 'Dark Mode';
        }
    }

    function updateLogo(theme) {
        if (theme === 'dark') {
            expandedLogo.src = '../resource/logo/Inverted.png';
        } else {
            expandedLogo.src = '../resource/logo/Dark-noBG.png';
        }
    }

    // Initial load
    await loadArchivedTasks();
});
