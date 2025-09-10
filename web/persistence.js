// persistence.js - File save/load operations and data persistence

// Save logs to file
function saveLogsToFile() {
    if (typeof eel !== 'undefined') {
        const logArea = document.getElementById('logArea');
        const logEntries = Array.from(logArea.children).map(entry => entry.innerText);
        eel.save_logs_to_file(logEntries);
    }
}

// Load logs from file
function loadLogsFromFile() {
    if (typeof eel !== 'undefined') {
        eel.load_logs_from_file()((logs) => {
            if (logs && logs.length > 0) {
                const logArea = document.getElementById('logArea');
                logArea.innerHTML = ''; // Clear existing logs
                
                logs.forEach(logText => {
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    
                    // Parse the log text to apply proper styling
                    const timestampMatch = logText.match(/^\[([^\]]+)\]/);
                    if (timestampMatch) {
                        const timestamp = timestampMatch[1];
                        const message = logText.substring(timestampMatch[0].length).trim();
                        
                        // Determine log type based on content
                        let className = 'log-info';
                        if (message.includes('success') || message.includes('complete') || message.includes('Started monitoring') || message.includes('Downloaded')) {
                            className = 'log-success';
                        } else if (message.includes('error') || message.includes('failed') || message.includes('Failed')) {
                            className = 'log-error';
                        }
                        
                        logEntry.innerHTML = `
                            <span class="log-timestamp">[${timestamp}]</span> 
                            <span class="${className}">${message}</span>
                        `;
                    } else {
                        // Fallback for logs without proper timestamp format
                        logEntry.innerHTML = `<span class="log-info">${logText}</span>`;
                    }
                    
                    logArea.appendChild(logEntry);
                });
                
                logArea.scrollTop = logArea.scrollHeight;
                console.log(`Loaded ${logs.length} log entries from file`);
            }
        });
    }
}

// Save completed posts to file
function saveCompletedPosts() {
    if (typeof eel !== 'undefined') {
        eel.save_completed_posts(Array.from(completedPosts));
    }
}

// Load completed posts from file
function loadCompletedPosts() {
    if (typeof eel !== 'undefined') {
        eel.load_completed_posts()((posts) => {
            if (posts && posts.length > 0) {
                completedPosts = new Set(posts);
                console.log(`Loaded ${posts.length} completed posts from file`);
            }
        });
    }
}

// Save application state (for future use)
function saveAppState() {
    if (typeof eel !== 'undefined') {
        const appState = {
            totalPosts,
            totalDownloads,
            currentPostLimit,
            currentSortMethod,
            analyticsData,
            timestamp: Date.now()
        };
        
        // This could be extended to save more app state
        console.log('App state saved:', appState);
    }
}

// Load application state (for future use)
function loadAppState() {
    if (typeof eel !== 'undefined') {
        // This could be extended to load saved app state
        console.log('Loading app state...');
    }
}