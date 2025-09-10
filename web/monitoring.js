// monitoring.js - Core monitoring and Reddit API functionality

// Toggle monitoring on/off
function toggleMonitoring() {
    if (isMonitoring) {
        stopMonitoring();
    } else {
        startMonitoring();
    }
}

function startMonitoring() {
    const interval = parseInt(document.getElementById('intervalInput').value);
    const subreddit = document.getElementById('subredditInput').value.trim();
    
    if (!subreddit) {
        log('Please enter a subreddit name', 'error');
        return;
    }
    
    if (typeof eel !== 'undefined') {
        eel.start_monitoring(subreddit, interval)((result) => {
            if (result.status === 'success') {
                isMonitoring = true;
                updateStatus(true);
                log(result.message, 'success');
                document.getElementById('currentSubreddit').textContent = subreddit;
            } else {
                log(result.message, 'error');
            }
        });
    } else {
        // Demo mode
        isMonitoring = true;
        updateStatus(true);
        log(`Started monitoring r/${subreddit} every ${interval} seconds (demo mode)`, 'success');
        document.getElementById('currentSubreddit').textContent = subreddit;
        
        // Simulate a post after 3 seconds
        setTimeout(() => {
            simulateNewPost();
        }, 3000);
    }
}

function stopMonitoring() {
    if (typeof eel !== 'undefined') {
        eel.stop_monitoring()((result) => {
            isMonitoring = false;
            updateStatus(false);
            log(result.message, 'info');
        });
    } else {
        // Demo mode
        isMonitoring = false;
        updateStatus(false);
        log('Monitoring stopped (demo mode)', 'info');
    }
}

// Load initial posts from subreddit
function loadInitialPosts(subreddit) {
    if (typeof eel !== 'undefined') {
        log(`Checking for posts in r/${subreddit}...`, 'info');
        
        const initialLimit = 100; // Fixed amount for initial load
        
        eel.get_recent_posts(subreddit, initialLimit)((result) => {
            if (result.status === 'success') {
                const loadType = result.load_type || 'UNKNOWN';
                const newPosts = result.new_posts || 0;
                
                // Clear existing posts for fresh load
                allPosts = [];
                seenPostIds.clear();
                totalPosts = 0;
                analyticsData = { paid_posts: 0, free_posts: 0 };
                
                // Add posts to UI
                result.posts.forEach(post => {
                    addPost(
                        post.title,
                        post.url,
                        post.author,
                        post.flair,
                        post.created,
                        post.description,
                        post.upvotes,
                        post.id
                    );
                });
                
                // Log appropriate message based on load type
                if (loadType === 'FIRST_LAUNCH') {
                    log(`First launch: Loaded ${result.posts.length} posts for comprehensive analysis`, 'success');
                } else if (loadType === 'INCREMENTAL_UPDATE') {
                    if (newPosts > 0) {
                        log(`Found ${newPosts} new posts since last launch`, 'success');
                    } else {
                        log('No new posts since last launch - you\'re up to date!', 'info');
                    }
                } else {
                    log(`Loaded ${result.posts.length} recent posts`, 'success');
                }
                
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            } else {
                log(`Failed to load recent posts: ${result.message}`, 'error');
            }
        });
    }
}

// Refresh posts from Reddit
function refreshPosts() {
    const subreddit = document.getElementById('subredditInput').value.trim();
    if (!subreddit) {
        log('Please enter a subreddit name', 'error');
        return;
    }
    
    log('Refreshing posts from Reddit...', 'info');
    
    if (typeof eel !== 'undefined') {
        const refreshLimit = 100; // Fixed substantial amount
        
        eel.get_recent_posts(subreddit, refreshLimit)((result) => {
            if (result.status === 'success') {
                // Clear existing posts
                allPosts = [];
                seenPostIds.clear();
                totalPosts = 0;
                analyticsData = { paid_posts: 0, free_posts: 0 };
                
                // Add all new posts
                result.posts.forEach(post => {
                    addPost(
                        post.title,
                        post.url,
                        post.author,
                        post.flair,
                        post.created,
                        post.description,
                        post.upvotes,
                        post.id
                    );
                });
                
                log(`Refreshed with ${result.posts.length} posts from r/${subreddit}`, 'success');
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            } else {
                log(`Failed to refresh posts: ${result.message}`, 'error');
            }
        });
    } else {
        // Demo mode
        log('Refreshing posts (demo mode)...', 'info');
        
        // Clear existing
        allPosts = [];
        seenPostIds.clear();
        totalPosts = 0;
        analyticsData = { paid_posts: 0, free_posts: 0 };
        
        // Add more demo posts
        setTimeout(() => {
            for (let i = 0; i < 25; i++) {
                setTimeout(() => simulateNewPost(), i * 50);
            }
            log('Posts refreshed (demo mode)', 'success');
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        }, 500);
    }
}

// Download images from URL
function downloadFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    const downloadDir = document.getElementById('downloadDirInput').value.trim();
    const downloadBtn = document.getElementById('downloadBtn');
    const progressFill = document.getElementById('progressFill');
    const downloadStatus = document.getElementById('downloadStatus');
    
    if (!url) {
        log('Please enter a Reddit post URL', 'error');
        return;
    }
    
    if (!url.includes('reddit.com')) {
        log('Please enter a valid Reddit URL', 'error');
        return;
    }
    
    // Update UI for download in progress
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    downloadStatus.textContent = 'Preparing download...';
    progressFill.style.width = '0%';
    
    if (typeof eel !== 'undefined') {
        // Real download using Eel
        eel.download_from_url(url, downloadDir)((result) => {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download Images';
            progressFill.style.width = '0%';
            
            if (result.status === 'success') {
                totalDownloads += result.count;
                document.getElementById('totalDownloads').textContent = totalDownloads;
                downloadStatus.textContent = result.message;
                log(result.message, 'success');
                document.getElementById('urlInput').value = '';
            } else {
                downloadStatus.textContent = result.message;
                log(result.message, 'error');
            }
            
            // Clear status after 3 seconds
            setTimeout(() => {
                downloadStatus.textContent = '';
            }, 3000);
        });
    } else {
        // Simulate download for demo
        simulateDownload(downloadBtn, progressFill, downloadStatus);
    }
}

function simulateDownload(downloadBtn, progressFill, downloadStatus) {
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            setTimeout(() => {
                const imageCount = Math.floor(Math.random() * 5) + 1;
                totalDownloads += imageCount;
                document.getElementById('totalDownloads').textContent = totalDownloads;
                
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Images';
                downloadStatus.textContent = `Downloaded ${imageCount} image(s) successfully! (demo)`;
                progressFill.style.width = '0%';
                
                log(`Successfully downloaded ${imageCount} images from post (demo)`, 'success');
                document.getElementById('urlInput').value = '';
                
                setTimeout(() => {
                    downloadStatus.textContent = '';
                }, 3000);
            }, 500);
        } else {
            progressFill.style.width = progress + '%';
            downloadStatus.textContent = `Downloading... ${Math.round(progress)}%`;
        }
    }, 200);
}