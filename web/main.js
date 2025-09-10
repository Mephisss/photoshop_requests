let isMonitoring = false;
let totalPosts = 0;
let totalDownloads = 0;
let currentModalPost = null;
let seenPostIds = new Set();
let completedPosts = new Set();
let analyticsData = { paid_posts: 0, free_posts: 0 };

// Post management state
let allPosts = [];
let currentPostLimit = 10;
let currentSortMethod = 'newest';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Auto-save logs every 30 seconds
setInterval(() => {
    if (typeof eel !== 'undefined') {
        saveLogsToFile();
    }
}, 30000);

// Save logs when page is about to unload
window.addEventListener('beforeunload', function() {
    if (typeof eel !== 'undefined') {
        saveLogsToFile();
    }
});

// Global keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeAnalyticsModal();
    }
});

// Main initialization function
async function initializeApp() {
    // Load existing data first
    loadLogsFromFile();
    
    // Small delay to ensure logs are loaded
    setTimeout(async () => {
        await initializeUI();
        await initializeRedditConnection();
        setupEventListeners();
    }, 100);
}

async function initializeUI() {
    const logArea = document.getElementById('logArea');
    
    if (logArea.children.length === 0) {
        log('Application ready. Configure settings and start monitoring.', 'success');
    } else {
        log('Application restarted. Previous session logs restored.', 'info');
    }
    
    // Load completion status
    loadCompletedPosts();
    
    // Set default values for controls
    const sortSelect = document.getElementById('sortSelect');
    const limitSelect = document.getElementById('postLimitSelect');
    
    if (sortSelect) sortSelect.value = currentSortMethod;
    if (limitSelect) limitSelect.value = currentPostLimit.toString();
    
    updatePostsCounter(0, 0);
}

async function initializeRedditConnection() {
    if (typeof eel !== 'undefined') {
        eel.test_reddit_connection()((result) => {
            if (result.status === 'success') {
                log('Reddit API connection verified', 'success');
                
                const subreddit = document.getElementById('subredditInput').value;
                loadInitialPosts(subreddit);
            } else {
                log(result.message, 'error');
            }
        });
    } else {
        // Demo mode
        log('Running in demo mode', 'info');
        setTimeout(() => {
            for (let i = 0; i < 25; i++) {
                setTimeout(() => simulateNewPost(), i * 100);
            }
        }, 1000);
    }
}

function setupEventListeners() {
    // Enter key for URL input
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                downloadFromUrl();
            }
        });
    }
}

// Eel callback functions (exposed to Python)
if (typeof eel !== 'undefined') {
    eel.expose(newPostDetected);
    function newPostDetected(post) {
        addPost(
            post.title, 
            post.url, 
            post.author, 
            post.flair || 'Free', 
            post.created, 
            post.description || 'No description provided.',
            post.upvotes || 0,
            post.id
        );
        log(`New post: "${post.title}" by u/${post.author} [${post.flair || 'No flair'}]`, 'success');
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }
    
    eel.expose(logMessage);
    function logMessage(message, type) {
        log(message, type);
    }
    
    eel.expose(updateMonitoringStatus);
    function updateMonitoringStatus(active) {
        isMonitoring = active;
        updateStatus(active);
    }
}