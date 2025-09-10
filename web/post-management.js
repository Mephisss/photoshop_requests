// post-management.js - Post display, sorting, filtering, and management

// Add new post to the feed
function addPost(title, url, author = 'Unknown', flair = 'Free', created = null, description = '', upvotes = 0, postId = null) {
    // Check for duplicates
    if (postId && seenPostIds.has(postId)) {
        return;
    }
    
    if (postId) {
        seenPostIds.add(postId);
    }
    
    const postDate = created ? new Date(created * 1000) : new Date();
    
    // Check if post is completed
    const isCompleted = postId && completedPosts.has(postId);
    
    // Determine flair class and update analytics
    let flairClass = 'other';
    if (flair && flair.toLowerCase().includes('paid')) {
        flairClass = 'paid';
        analyticsData.paid_posts++;
    } else if (flair && flair.toLowerCase().includes('free')) {
        flairClass = 'free';
        analyticsData.free_posts++;
    }
    
    // Create post object
    const postObj = {
        title,
        url,
        author,
        flair,
        flairClass,
        created: postDate,
        description: description || 'No description provided.',
        upvotes,
        postId,
        completed: isCompleted,
        timestamp: postDate.getTime()
    };
    
    // Add to allPosts array at the beginning (newest first by default)
    allPosts.unshift(postObj);
    
    totalPosts++;
    document.getElementById('totalPosts').textContent = totalPosts;
    
    // Update analytics counters
    updateAnalyticsCounters();
    
    // Refresh the display
    refreshPostsDisplay();
}

// FIXED: Render posts in the DOM based on current sorting and limit
function refreshPostsDisplay() {
    const postsContainer = document.getElementById('postsContainer');
    
    // Clear container
    postsContainer.innerHTML = '';
    
    if (allPosts.length === 0) {
        postsContainer.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📡</div>
                <div>Start monitoring to see new posts</div>
            </div>
        `;
        updatePostsCounter(0, 0);
        return;
    }
    
    // Apply sorting first
    let sortedPosts = [...allPosts];
    sortedPosts = applySortToPosts(sortedPosts, currentSortMethod);
    
    // FIXED: Apply limit correctly - show the most recent X posts after sorting
    let postsToShow = sortedPosts;
    if (currentPostLimit !== 'all') {
        const limitNumber = parseInt(currentPostLimit);
        if (limitNumber > 0 && limitNumber < sortedPosts.length) {
            // For 'newest' sort, take first X posts (most recent)
            // For 'oldest' sort, take first X posts (oldest)
            // This preserves the sorting intent while limiting results
            postsToShow = sortedPosts.slice(0, limitNumber);
        }
    }
    
    // Debug logging for troubleshooting
    if (typeof DevConfig !== 'undefined' && DevConfig.debug) {
        console.log(`Post display: ${postsToShow.length} of ${allPosts.length} posts (limit: ${currentPostLimit}, sort: ${currentSortMethod})`);
    }
    
    // Render posts
    postsToShow.forEach(postObj => {
        const postElement = createPostElement(postObj);
        postsContainer.appendChild(postElement);
    });
    
    // Update counter
    updatePostsCounter(postsToShow.length, allPosts.length);
}

// Create a post DOM element
function createPostElement(postObj) {
    const timeAgo = getTimeAgo(postObj.created);
    
    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    
    if (postObj.completed) {
        postElement.classList.add('completed');
    }
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-content">
                <div class="post-title">${postObj.title}</div>
                <div class="post-meta">
                    <span>by u/${postObj.author}</span>
                    <span>•</span>
                    <span>${timeAgo}</span>
                    ${postObj.flair ? `<span>•</span><span class="flair-badge ${postObj.flairClass}">${postObj.flair}</span>` : ''}
                    <span>•</span>
                    <span>👍 ${postObj.upvotes}</span>
                </div>
                <a href="${postObj.url}" target="_blank" class="post-url" onclick="event.stopPropagation()">${postObj.url}</a>
            </div>
            <div class="completion-checkbox ${postObj.completed ? 'checked' : ''}" onclick="togglePostCompletion('${postObj.postId}', event)"></div>
        </div>
    `;
    
    // Store post data for modal
    postElement.postData = postObj;
    
    postElement.addEventListener('click', function(e) {
        // Don't open modal if clicking checkbox
        if (e.target.classList.contains('completion-checkbox')) {
            return;
        }
        openPostModal(this.postData);
    });
    
    return postElement;
}

// Apply sorting to posts array
function applySortToPosts(posts, sortMethod) {
    switch (sortMethod) {
        case 'newest':
            return posts.sort((a, b) => b.timestamp - a.timestamp);
        case 'oldest':
            return posts.sort((a, b) => a.timestamp - b.timestamp);
        case 'most_upvoted':
            return posts.sort((a, b) => b.upvotes - a.upvotes);
        case 'least_upvoted':
            return posts.sort((a, b) => a.upvotes - b.upvotes);
        case 'paid_first':
            return posts.sort((a, b) => {
                if (a.flairClass === 'paid' && b.flairClass !== 'paid') return -1;
                if (a.flairClass !== 'paid' && b.flairClass === 'paid') return 1;
                return b.timestamp - a.timestamp; // Secondary sort by newest
            });
        case 'free_first':
            return posts.sort((a, b) => {
                if (a.flairClass === 'free' && b.flairClass !== 'free') return -1;
                if (a.flairClass !== 'free' && b.flairClass === 'free') return 1;
                return b.timestamp - a.timestamp; // Secondary sort by newest
            });
        default:
            return posts.sort((a, b) => b.timestamp - a.timestamp);
    }
}

// Function called when sort dropdown changes
function applySorting() {
    const sortSelect = document.getElementById('sortSelect');
    currentSortMethod = sortSelect.value;
    refreshPostsDisplay();
    
    log(`Posts sorted by: ${sortSelect.options[sortSelect.selectedIndex].text}`, 'info');
}

// FIXED: Function called when post limit dropdown changes
function applyPostLimit() {
    const limitSelect = document.getElementById('postLimitSelect');
    const newLimit = limitSelect.value;
    
    // Only refresh if the limit actually changed
    if (newLimit !== currentPostLimit) {
        currentPostLimit = newLimit;
        
        // Refresh display with new limit
        refreshPostsDisplay();
        
        const limitText = limitSelect.value === 'all' ? 'all' : `last ${limitSelect.value}`;
        log(`Post display limit set to: ${limitText} posts`, 'info');
    }
}

// FIXED: Function to update posts counter with better messaging
function updatePostsCounter(showing, total) {
    const counter = document.getElementById('postsCounter');
    if (counter) {
        if (currentPostLimit === 'all') {
            counter.textContent = `Showing all ${total} posts`;
        } else {
            const limitNum = parseInt(currentPostLimit);
            if (total <= limitNum) {
                counter.textContent = `Showing all ${total} posts`;
            } else {
                // Clarify which posts are being shown based on sort method
                let description = 'posts';
                switch (currentSortMethod) {
                    case 'newest':
                        description = 'newest posts';
                        break;
                    case 'oldest':
                        description = 'oldest posts';
                        break;
                    case 'most_upvoted':
                        description = 'most upvoted posts';
                        break;
                    case 'least_upvoted':
                        description = 'least upvoted posts';
                        break;
                    case 'paid_first':
                        description = 'posts (paid first)';
                        break;
                    case 'free_first':
                        description = 'posts (free first)';
                        break;
                }
                counter.textContent = `Showing ${showing} ${description} of ${total} total`;
            }
        }
    }
}

// Toggle post completion status
function togglePostCompletion(postId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (!postId) {
        if (currentModalPost) {
            postId = currentModalPost.postId;
        } else {
            return;
        }
    }
    
    const isCompleted = completedPosts.has(postId);
    
    if (isCompleted) {
        completedPosts.delete(postId);
        log(`Marked post as incomplete: ${postId}`, 'info');
    } else {
        completedPosts.add(postId);
        log(`Marked post as complete: ${postId}`, 'success');
    }
    
    // Update the post in allPosts array
    const postIndex = allPosts.findIndex(post => post.postId === postId);
    if (postIndex !== -1) {
        allPosts[postIndex].completed = !isCompleted;
    }
    
    // Refresh display to show updated completion status
    refreshPostsDisplay();
    
    // Save to file
    saveCompletedPosts();
    
    // Update modal if open
    if (currentModalPost && currentModalPost.postId === postId) {
        currentModalPost.completed = !isCompleted;
        const completionBtn = document.getElementById('modalCompletionBtn');
        if (!isCompleted) {
            completionBtn.textContent = 'Mark as Incomplete';
            completionBtn.className = 'button secondary';
        } else {
            completionBtn.textContent = 'Mark as Complete';
            completionBtn.className = 'button';
        }
    }
}

// Update analytics counters in UI
function updateAnalyticsCounters() {
    document.getElementById('paidPosts').textContent = analyticsData.paid_posts;
    document.getElementById('freePosts').textContent = analyticsData.free_posts;
}

// FIXED: Add debug function for troubleshooting
function debugPostState() {
    console.log('Post Management Debug Info:');
    console.log('Total posts in array:', allPosts.length);
    console.log('Current sort method:', currentSortMethod);
    console.log('Current post limit:', currentPostLimit);
    console.log('Posts in display:', document.querySelectorAll('.post-item').length);
    console.log('All posts:', allPosts.map(p => ({ title: p.title.substring(0, 30), timestamp: p.timestamp })));
}

// Expose debug function globally in development mode
if (typeof window !== 'undefined') {
    window.debugPostState = debugPostState;
}