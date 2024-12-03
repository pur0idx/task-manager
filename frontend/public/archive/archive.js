document.addEventListener('DOMContentLoaded', async function () {
    const BACKEND_URL = 'https://api.final-project.xyz';
    const token = localStorage.getItem('token');
    
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
        
        // Filter for archived tasks only
        const archivedTasks = tasks.filter(task => task.archived === true);
        
        if (!archivedTasks.length) {
            container.innerHTML = '<div class="no-tasks">No archived tasks found</div>';
            return;
        }

        const tasksHtml = archivedTasks.map(task => `
            <div class="task-item" data-task-id="${task._id}">
                <div class="task-title">${task.title}</div>
                <div class="task-org">${task.organization ? task.organization.name : '—'}</div>
                <div class="task-due-date">${formatDate(task.dueDate)}</div>
                <div class="task-status">${task.status}</div>
                <div class="task-actions">
                    <button class="restore-btn" title="Restore Task" data-task-id="${task._id}">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="delete-btn" title="Delete Permanently" data-task-id="${task._id}">
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
            // Use the regular tasks endpoint and filter on the client side
            const tasks = await apiRequest('/api/tasks');
            renderArchivedTasks(tasks);
        } catch (error) {
            console.error('Error loading archived tasks:', error);
            showNotification('Error loading archived tasks', 'error');
        }
    }

    // Restore task function
    async function restoreTask(taskId) {
        try {
            // Update the task to remove archived status
            await apiRequest(`/api/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: false
                })
            });
            
            showNotification('Task restored successfully', 'success');
            await loadArchivedTasks(); // Refresh the list
        } catch (error) {
            console.error('Error restoring task:', error);
            showNotification('Error restoring task', 'error');
        }
    }

    // Delete task permanently function
    async function deleteTaskPermanently(taskId) {
        try {
            if (!confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
                return;
            }

            await apiRequest(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });
            
            showNotification('Task deleted permanently', 'success');
            await loadArchivedTasks(); // Refresh the list
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Error deleting task', 'error');
        }
    }

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

    // Event listeners for restore and delete actions
    document.getElementById('archived-tasks-container').addEventListener('click', async (e) => {
        const restoreBtn = e.target.closest('.restore-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (restoreBtn) {
            const taskId = restoreBtn.dataset.taskId;
            await restoreTask(taskId);
        } else if (deleteBtn) {
            const taskId = deleteBtn.dataset.taskId;
            await deleteTaskPermanently(taskId);
        }
    });

    // Load archived tasks on page load
    await loadArchivedTasks();
});
