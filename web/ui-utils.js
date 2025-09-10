// ui-utils.js - UI utilities, modals, logging, and status management

// Logging function
function log(message, type = 'info') {
    const logArea = document.getElementById('logArea');
    const now = new Date();
    const dateTime = now.toLocaleString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    let className = 'log-info';
    if (type === 'success') className = 'log-success';
    else if (type === 'error') className = 'log-error';
    
    logEntry.innerHTML = `
        <span class="log-timestamp">[${dateTime}]</span> 
        <span class="${className}">${message}</span>
    `;
    
    logArea.appendChild(logEntry);
    logArea.scrollTop = logArea.scrollHeight;
    
    // Immediately save logs to file
    saveLogsToFile();
    
    // Keep only last 1000 log entries
    while (logArea.children.length > 1000) {
        logArea.removeChild(logArea.firstChild);
    }
}

// Update monitoring status UI
function updateStatus(active) {
    const statusDot = document.getElementById('statusDot');
    const startStopBtn = document.getElementById('startStopBtn');
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (active) {
        statusDot.classList.remove('inactive');
        startStopBtn.textContent = 'Stop Monitoring';
        startStopBtn.className = 'button danger';
        lastUpdate.textContent = new Date().toLocaleTimeString();
    } else {
        statusDot.classList.add('inactive');
        startStopBtn.textContent = 'Start Monitoring';
        startStopBtn.className = 'button';
    }
}

// FIXED: Toggle logs card expansion
function toggleLogsExpansion() {
    const logsCard = document.querySelector('.logs-card');
    const expandBtn = document.getElementById('expandLogsBtn');
    
    if (logsCard && expandBtn) {
        const isExpanded = logsCard.classList.contains('expanded');
        
        if (isExpanded) {
            logsCard.classList.remove('expanded');
            expandBtn.innerHTML = '📈 Expand';
            expandBtn.title = 'Expand logs view';
        } else {
            logsCard.classList.add('expanded');
            expandBtn.innerHTML = '📉 Collapse';
            expandBtn.title = 'Collapse logs view';
        }
        
        // Scroll to bottom after expansion/collapse
        setTimeout(() => {
            const logArea = document.getElementById('logArea');
            if (logArea) {
                logArea.scrollTop = logArea.scrollHeight;
            }
        }, 400); // Wait for CSS transition to complete
    }
}

// Clear logs
function clearLogs() {
    const logArea = document.getElementById('logArea');
    const now = new Date();
    const dateTime = now.toLocaleString();
    
    logArea.innerHTML = `
        <div class="log-entry">
            <span class="log-timestamp">[${dateTime}]</span> 
            <span class="log-info">Logs cleared.</span>
        </div>
    `;
    
    saveLogsToFile();
}

// Confirm clear logs
function confirmClearLogs() {
    if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
        clearLogs();
        log('Log history cleared successfully', 'success');
    }
}

// Modal management functions
function openPostModal(postData) {
    currentModalPost = postData;
    
    // Populate modal with post data
    document.getElementById('modalTitle').textContent = postData.title;
    document.getElementById('modalAuthor').textContent = `u/${postData.author}`;
    
    const postDate = postData.created;
    const dateTimeString = postDate.toLocaleDateString() + ' at ' + postDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('modalDate').textContent = dateTimeString;
    
    document.getElementById('modalUpvotes').textContent = postData.upvotes;
    document.getElementById('modalDescription').textContent = postData.description;
    
    // Set flair
    const flairElement = document.getElementById('modalFlair');
    flairElement.textContent = postData.flair || 'No flair';
    flairElement.className = 'flair-badge';
    
    if (postData.flair) {
        if (postData.flair.toLowerCase().includes('paid')) {
            flairElement.classList.add('paid');
        } else if (postData.flair.toLowerCase().includes('free')) {
            flairElement.classList.add('free');
        } else {
            flairElement.classList.add('other');
        }
    } else {
        flairElement.classList.add('other');
    }
    
    // Update completion button
    const completionBtn = document.getElementById('modalCompletionBtn');
    if (postData.completed) {
        completionBtn.textContent = 'Mark as Incomplete';
        completionBtn.className = 'button secondary';
    } else {
        completionBtn.textContent = 'Mark as Complete';
        completionBtn.className = 'button';
    }
    
    // Show modal
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentModalPost = null;
}

function downloadFromModal() {
    if (currentModalPost) {
        document.getElementById('urlInput').value = currentModalPost.url;
        closeModal();
        downloadFromUrl();
    }
}

function openInReddit() {
    if (currentModalPost) {
        window.open(currentModalPost.url, '_blank');
    }
}

// Utility functions
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Folder selection
function selectDownloadFolder() {
    if (typeof eel !== 'undefined') {
        eel.select_download_folder()((result) => {
            if (result.status === 'success') {
                document.getElementById('downloadDirInput').value = result.folder;
                log(`Download folder set to: ${result.folder}`, 'success');
            } else if (result.status !== 'cancelled') {
                log(`Failed to select folder: ${result.message}`, 'error');
            }
        });
    } else {
        // Demo mode
        const demoPath = `C:/Users/Demo/Downloads/reddit_photos_${Date.now()}`;
        document.getElementById('downloadDirInput').value = demoPath;
        log(`Download folder set to: ${demoPath} (demo)`, 'success');
    }
}