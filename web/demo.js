// demo.js - Demo and simulation functions for testing

// Demo function for testing without Eel
function simulateNewPost() {
    const titles = [
        "Can someone remove the background from this photo?",
        "Please make this image look more professional",
        "Help me fix the lighting in this picture",
        "Can you add a sunset background to this?",
        "Remove the person in the background please",
        "Make this photo black and white with color accent",
        "Need help with color correction on this portrait",
        "Can someone fix the exposure on this landscape?",
        "Help me remove wrinkles from this old photo",
        "Please enhance the colors in this sunset photo",
        "Can you add snow effect to this winter scene?",
        "Need professional headshot editing",
        "Help me remove objects from this family photo",
        "Can someone restore this vintage photograph?",
        "Please add dramatic lighting to this portrait"
    ];
    
    const descriptions = [
        "Hi everyone! I need help removing the background from this photo for my LinkedIn profile. I'd really appreciate any help with this. Thanks in advance!",
        "Looking to make this image more professional for my portfolio. Any editing help would be amazing!",
        "The lighting in this photo is really bad. Can someone help fix it? Willing to tip for good work!",
        "I love this photo but the background is boring. Could someone add a beautiful sunset? Will pay $10 for good quality work.",
        "There's someone photobombing in the background. Can anyone remove them please?",
        "I want to keep only the red roses in color and make everything else black and white. Thanks!",
        "This portrait needs some color correction work. Can anyone help? Budget is $15.",
        "Took this landscape photo but the exposure is off. Any help would be appreciated!",
        "Found this old family photo with some damage. Can someone help restore it?",
        "The colors in this sunset photo are a bit flat. Can someone enhance them?",
        "Would love to add some falling snow to this winter landscape. Paying $20 for quality work.",
        "Need this headshot professionally edited for my business website. Budget flexible.",
        "Family reunion photo has some unwanted objects. Can someone clean it up?",
        "This vintage photo has some wear and tear. Looking for restoration help.",
        "Want to add some dramatic studio lighting effects to this portrait. Will tip well!"
    ];
    
    const authors = [
        'user123', 'photohelp', 'designlover', 'artfan99', 'photoreq',
        'editpro', 'visualarts', 'pixelmaster', 'imagegeek', 'photoshopnewbie',
        'creativemind', 'digitalartist', 'portfoliobuild', 'businessman42', 'weddingplanner'
    ];
    
    const flairs = ['Free', 'Paid', 'Free', 'Paid', 'Free', 'Paid'];
    
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const randomFlair = flairs[Math.floor(Math.random() * flairs.length)];
    const randomUpvotes = Math.floor(Math.random() * 50);
    const randomPostId = Math.random().toString(36).substr(2, 9);
    const randomUrl = `https://reddit.com/r/PhotoshopRequest/comments/${randomPostId}`;
    
    // Vary the creation time to simulate realistic posting patterns
    const hoursAgo = Math.random() * 24; // Random time within last 24 hours
    const createdTime = (Date.now() / 1000) - (hoursAgo * 3600);
    
    addPost(randomTitle, randomUrl, randomAuthor, randomFlair, createdTime, randomDescription, randomUpvotes, randomPostId);
    log(`New post detected: "${randomTitle}" by u/${randomAuthor} [${randomFlair}]`, 'success');
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Simulate multiple posts at once for testing
function simulateMultiplePosts(count = 5) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => simulateNewPost(), i * 200);
    }
}

// Simulate a burst of activity (like after a popular post goes viral)
function simulateActivityBurst() {
    log('Simulating high activity period...', 'info');
    
    // Create 10 posts over 2 seconds
    for (let i = 0; i < 10; i++) {
        setTimeout(() => simulateNewPost(), i * 200);
    }
    
    setTimeout(() => {
        log('Activity burst complete', 'success');
    }, 2500);
}

// Simulate download with realistic progress
function simulateRealisticDownload(downloadBtn, progressFill, downloadStatus) {
    let progress = 0;
    const phases = [
        { name: 'Analyzing post...', duration: 500, progressIncrease: 10 },
        { name: 'Finding images...', duration: 800, progressIncrease: 20 },
        { name: 'Downloading images...', duration: 2000, progressIncrease: 60 },
        { name: 'Processing...', duration: 300, progressIncrease: 10 }
    ];
    
    let currentPhase = 0;
    
    function runPhase() {
        if (currentPhase >= phases.length) {
            // Complete
            const imageCount = Math.floor(Math.random() * 5) + 1;
            totalDownloads += imageCount;
            document.getElementById('totalDownloads').textContent = totalDownloads;
            
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download Images';
            downloadStatus.textContent = `Downloaded ${imageCount} image(s) successfully! (demo)`;
            progressFill.style.width = '100%';
            
            log(`Successfully downloaded ${imageCount} images from post (demo)`, 'success');
            document.getElementById('urlInput').value = '';
            
            setTimeout(() => {
                downloadStatus.textContent = '';
                progressFill.style.width = '0%';
            }, 3000);
            return;
        }
        
        const phase = phases[currentPhase];
        downloadStatus.textContent = phase.name;
        
        // Gradually increase progress during this phase
        const startProgress = progress;
        const endProgress = progress + phase.progressIncrease;
        const stepTime = phase.duration / phase.progressIncrease;
        
        const progressInterval = setInterval(() => {
            progress += 1;
            progressFill.style.width = progress + '%';
            
            if (progress >= endProgress) {
                clearInterval(progressInterval);
                currentPhase++;
                setTimeout(() => runPhase(), 100);
            }
        }, stepTime);
    }
    
    runPhase();
}

// Generate realistic demo analytics data
function generateRealisticDemoData() {
    return {
        total_posts: Math.floor(Math.random() * 200) + 50,
        paid_posts: Math.floor(Math.random() * 30) + 10,
        free_posts: Math.floor(Math.random() * 150) + 30,
        other_posts: Math.floor(Math.random() * 20) + 5,
        hourly_distribution: Array.from({length: 24}, () => Math.floor(Math.random() * 30)),
        weekday_distribution: {
            'Monday': Math.floor(Math.random() * 25) + 5,
            'Tuesday': Math.floor(Math.random() * 30) + 10,
            'Wednesday': Math.floor(Math.random() * 28) + 8,
            'Thursday': Math.floor(Math.random() * 32) + 12,
            'Friday': Math.floor(Math.random() * 26) + 6,
            'Saturday': Math.floor(Math.random() * 20) + 3,
            'Sunday': Math.floor(Math.random() * 18) + 2
        },
        daily_posts: generateDailyPostsData(),
        avg_title_length: Math.floor(Math.random() * 30) + 30,
        avg_description_length: Math.floor(Math.random() * 100) + 50,
        top_authors: {
            'designpro': Math.floor(Math.random() * 15) + 5,
            'photomaster': Math.floor(Math.random() * 12) + 3,
            'editingking': Math.floor(Math.random() * 10) + 2,
            'pixelartist': Math.floor(Math.random() * 8) + 1,
            'creativemind': Math.floor(Math.random() * 6) + 1
        }
    };
}

function generateDailyPostsData() {
    const data = {};
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        data[dateStr] = Math.floor(Math.random() * 20) + 1;
    }
    
    return data;
}

// Test various app features in sequence
function runDemoSequence() {
    log('Starting demo sequence...', 'info');
    
    // Step 1: Simulate initial posts
    setTimeout(() => {
        log('Loading initial posts...', 'info');
        simulateMultiplePosts(8);
    }, 1000);
    
    // Step 2: Simulate monitoring start
    setTimeout(() => {
        log('Simulating monitoring start...', 'info');
        if (!isMonitoring) {
            toggleMonitoring();
        }
    }, 3000);
    
    // Step 3: Simulate new posts during monitoring
    setTimeout(() => {
        log('Simulating live post detection...', 'info');
        simulateNewPost();
    }, 5000);
    
    setTimeout(() => {
        simulateNewPost();
    }, 8000);
    
    // Step 4: Simulate completion of some posts
    setTimeout(() => {
        log('Simulating post completions...', 'info');
        // This would need access to actual post IDs from the demo posts
    }, 10000);
    
    setTimeout(() => {
        log('Demo sequence complete!', 'success');
    }, 12000);
}