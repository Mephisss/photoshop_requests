// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeAnalyticsModal();
    }
});

// Update analytics counters in UI
function updateAnalyticsCounters() {
    document.getElementById('paidPosts').textContent = analyticsData.paid_posts;
    document.getElementById('freePosts').textContent = analyticsData.free_posts;
}

// Show analytics modal
function showAnalytics() {
    if (typeof eel !== 'undefined') {
        eel.get_posts_analytics()((result) => {
            if (result.status === 'success') {
                const analytics = result.analytics;
                
                // Update analytics modal with comprehensive data
                updateAnalyticsDisplay(analytics);
                
                // Show modal first
                document.getElementById('analyticsModalOverlay').classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Create charts after modal is visible (slight delay to ensure proper rendering)
                setTimeout(() => {
                    createAnalyticsCharts(analytics);
                }, 100);
                
            } else {
                log('Failed to load analytics: ' + result.message, 'error');
            }
        });
    } else {
        // Demo mode with sample data
        const demoAnalytics = createDemoAnalytics();
        updateAnalyticsDisplay(demoAnalytics);
        
        // Show modal first
        document.getElementById('analyticsModalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Create charts after modal is visible
        setTimeout(() => {
            createAnalyticsCharts(demoAnalytics);
        }, 100);
    }
}

function updateAnalyticsDisplay(analytics) {
    // Overview stats
    document.getElementById('analyticsTotal').textContent = analytics.total_posts;
    document.getElementById('analyticsDaily').textContent = Math.round(analytics.total_posts / Math.max(Object.keys(analytics.daily_posts || {}).length, 1));
    document.getElementById('analyticsPeakHour').textContent = `${analytics.most_active_hour}:00`;
    document.getElementById('analyticsPeakDay').textContent = analytics.most_active_day;
    
    // Request types
    document.getElementById('analyticsPaid').textContent = `${analytics.paid_posts} (${analytics.paid_percentage}%)`;
    document.getElementById('analyticsFree').textContent = `${analytics.free_posts} (${analytics.free_percentage}%)`;
    document.getElementById('analyticsOther').textContent = `${analytics.other_posts} (${100 - analytics.paid_percentage - analytics.free_percentage}%)`;
    
    // Revenue ratio
    const ratio = analytics.free_posts > 0 ? `${analytics.paid_posts}:${analytics.free_posts}` : `${analytics.paid_posts}:0`;
    document.getElementById('analyticsRatio').textContent = ratio;
    
    // Content analysis
    document.getElementById('analyticsAvgTitle').textContent = `${analytics.avg_title_length} chars`;
    document.getElementById('analyticsAvgDesc').textContent = `${analytics.avg_description_length} chars`;
    document.getElementById('analyticsAvgUpvotes').textContent = analytics.engagement_metrics?.avg_upvotes || 0;
    
    // Engagement comparison
    const paidUpvotes = analytics.engagement_metrics?.paid_avg_upvotes || 0;
    const freeUpvotes = analytics.engagement_metrics?.free_avg_upvotes || 0;
    const engagementText = paidUpvotes > freeUpvotes ? 
        `Paid: ${paidUpvotes} > Free: ${freeUpvotes}` : 
        `Free: ${freeUpvotes} > Paid: ${paidUpvotes}`;
    document.getElementById('analyticsEngagement').textContent = engagementText;
    
    // Peak activity insights
    updatePeakActivityInsights(analytics);
    
    // Top authors
    updateTopAuthors(analytics.top_authors || {});
    
    // Source info
    document.getElementById('analyticsSource').textContent = analytics.total_posts;
}

function updatePeakActivityInsights(analytics) {
    // Find peak hour and its count
    const hourlyData = analytics.hourly_distribution || [];
    let peakHour = 0;
    let peakHourCount = 0;
    let quietHour = 0;
    let quietHourCount = Infinity;
    
    hourlyData.forEach((count, hour) => {
        if (count > peakHourCount) {
            peakHourCount = count;
            peakHour = hour;
        }
        if (count < quietHourCount) {
            quietHourCount = count;
            quietHour = hour;
        }
    });
    
    // Find peak day and its count
    const weeklyData = analytics.weekday_distribution || {};
    let peakDay = 'Unknown';
    let peakDayCount = 0;
    
    Object.entries(weeklyData).forEach(([day, count]) => {
        if (count > peakDayCount) {
            peakDayCount = count;
            peakDay = day;
        }
    });
    
    // Calculate weekend vs weekday
    const weekendDays = ['Saturday', 'Sunday'];
    const weekdayDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    const weekendPosts = weekendDays.reduce((sum, day) => sum + (weeklyData[day] || 0), 0);
    const weekdayPosts = weekdayDays.reduce((sum, day) => sum + (weeklyData[day] || 0), 0);
    
    // Calculate prime time posts (6PM-10PM)
    const primeTimePosts = hourlyData.slice(18, 23).reduce((sum, count) => sum + count, 0);
    
    // Update the insights
    document.getElementById('analyticsPeakHour').textContent = `${peakHour}:00 (${peakHourCount} posts)`;
    document.getElementById('analyticsPeakDay').textContent = `${peakDay} (${peakDayCount} posts)`;
    
    // Update new activity pattern metrics
    document.getElementById('analyticsBusiestHour').textContent = `${peakHour}:00 (${peakHourCount} posts)`;
    document.getElementById('analyticsQuietestHour').textContent = `${quietHour}:00 (${quietHourCount} posts)`;
    
    const weekendRatio = weekdayPosts > 0 ? (weekendPosts / weekdayPosts).toFixed(1) : '0';
    document.getElementById('analyticsWeekendRatio').textContent = `${weekendPosts} weekend vs ${weekdayPosts} weekday`;
    
    const primeTimePercentage = analytics.total_posts > 0 ? ((primeTimePosts / analytics.total_posts) * 100).toFixed(1) : 0;
    document.getElementById('analyticsPrimeTime').textContent = `${primeTimePosts} posts (${primeTimePercentage}%)`;
    
    // Calculate posts per hour average
    const totalHoursWithPosts = hourlyData.filter(count => count > 0).length;
    const avgPostsPerActiveHour = totalHoursWithPosts > 0 ? 
        (analytics.total_posts / totalHoursWithPosts).toFixed(1) : 0;
    
    // Update daily average to be more specific
    const totalDays = Object.keys(analytics.daily_posts || {}).length;
    const avgPostsPerDay = totalDays > 0 ? (analytics.total_posts / totalDays).toFixed(1) : 0;
    
    document.getElementById('analyticsDaily').textContent = `${avgPostsPerDay} (across ${totalDays} days)`;
}

function updateTopAuthors(topAuthors) {
    const container = document.getElementById('topAuthors');
    container.innerHTML = '';
    
    const authors = Object.entries(topAuthors).slice(0, 5);
    
    if (authors.length === 0) {
        container.innerHTML = '<div class="author-item"><span>No data available</span></div>';
        return;
    }
    
    authors.forEach(([author, count]) => {
        const authorItem = document.createElement('div');
        authorItem.className = 'author-item';
        authorItem.innerHTML = `
            <span class="author-name">u/${author}</span>
            <span class="author-count">${count} posts</span>
        `;
        container.appendChild(authorItem);
    });
}

// Add these functions to your script.js file to fix the missing charts

function createAnalyticsCharts(analytics) {
    // Check if canvas elements exist before creating charts
    const hourlyCanvas = document.getElementById('hourlyChart');
    const typeCanvas = document.getElementById('typeChart');
    const weeklyCanvas = document.getElementById('weeklyChart');
    const trendsCanvas = document.getElementById('trendsChart');
    
    if (!hourlyCanvas || !typeCanvas || !weeklyCanvas || !trendsCanvas) {
        console.error('Canvas elements not found');
        return;
    }
    
    // Set proper canvas dimensions before drawing
    setCanvasSize(hourlyCanvas, 400, 200);
    setCanvasSize(typeCanvas, 300, 300);
    setCanvasSize(weeklyCanvas, 400, 200);
    setCanvasSize(trendsCanvas, 400, 200);
    
    // Create charts with delay to ensure canvas is ready
    setTimeout(() => {
        createHourlyChart(analytics.hourly_distribution || []);
        createTypeChart(analytics);
        createWeeklyChart(analytics.weekday_distribution || {});
        createTrendsChart(analytics.posting_trends || []);
    }, 100);
}

function setCanvasSize(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

function createHourlyChart(hourlyData) {
    const canvas = document.getElementById('hourlyChart');
    if (!canvas) {
        console.error('Hourly chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Ensure we have 24 hours of data
    if (!hourlyData || hourlyData.length === 0) {
        hourlyData = new Array(24).fill(0);
    } else if (hourlyData.length < 24) {
        // Pad array to 24 elements
        while (hourlyData.length < 24) {
            hourlyData.push(0);
        }
    }
    
    const maxValue = Math.max(...hourlyData);
    if (maxValue === 0) {
        drawNoDataMessage(ctx, width, height, 'No hourly data available');
        return;
    }
    
    // Draw axes
    drawAxes(ctx, padding, width, height);
    
    // Draw Y-axis labels and grid lines
    drawYAxisLabels(ctx, maxValue, padding, chartHeight, height);
    
    // Draw bars
    const barWidth = chartWidth / 24;
    
    hourlyData.forEach((value, hour) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = padding + hour * barWidth;
        const y = height - padding - barHeight;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        
        // Show value on top of significant bars
        if (value > 0 && barHeight > 20) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth/2, y - 5);
        }
        
        // Hour labels (every 4 hours to avoid crowding)
        if (hour % 4 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hour.toString() + 'h', x + barWidth/2, height - padding + 15);
        }
    });
    
    // Add axis labels
    drawAxisLabels(ctx, width, height, 'Hour of Day', 'Posts');
}

function createTypeChart(analytics) {
    const canvas = document.getElementById('typeChart');
    if (!canvas) {
        console.error('Type chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const total = analytics.total_posts;
    if (total === 0) {
        drawNoDataMessage(ctx, canvas.width, canvas.height, 'No data available');
        return;
    }
    
    const data = [
        { label: 'Paid', value: analytics.paid_posts, color: 'rgba(52, 211, 153, 0.8)' },
        { label: 'Free', value: analytics.free_posts, color: 'rgba(96, 165, 250, 0.8)' },
        { label: 'Other', value: analytics.other_posts, color: 'rgba(156, 163, 175, 0.8)' }
    ];
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach((segment) => {
        if (segment.value > 0) {
            const sliceAngle = (segment.value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // Draw slice border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.strokeText(segment.label, labelX, labelY);
            ctx.fillText(segment.label, labelX, labelY);
            
            ctx.strokeText(`${segment.value}`, labelX, labelY + 15);
            ctx.fillText(`${segment.value}`, labelX, labelY + 15);
            
            currentAngle += sliceAngle;
        }
    });
    
    // Draw legend
    drawPieChartLegend(ctx, data, canvas.width, canvas.height);
}

function createWeeklyChart(weeklyData) {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) {
        console.error('Weekly chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const data = days.map(day => weeklyData[day] || 0);
    const maxValue = Math.max(...data);
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    if (maxValue === 0) {
        drawNoDataMessage(ctx, width, height, 'No weekly data available');
        return;
    }
    
    // Draw axes
    drawAxes(ctx, padding, width, height);
    
    // Draw Y-axis labels and grid lines
    drawYAxisLabels(ctx, maxValue, padding, chartHeight, height);
    
    // Draw bars
    const barWidth = chartWidth / 7;
    
    data.forEach((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = padding + index * barWidth;
        const y = height - padding - barHeight;
        
        const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(1, 'rgba(192, 132, 252, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
        
        // Show value on top of bars
        if (value > 0 && barHeight > 15) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth/2, y - 5);
        }
        
        // Day labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(days[index].substring(0, 3), x + barWidth/2, height - padding + 15);
    });
    
    // Add axis labels
    drawAxisLabels(ctx, width, height, 'Day of Week', 'Posts');
}

function createTrendsChart(trendsData) {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) {
        console.error('Trends chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (trendsData.length === 0) {
        drawNoDataMessage(ctx, canvas.width, canvas.height, 'No trend data available');
        return;
    }
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const maxPosts = Math.max(...trendsData.map(d => d.posts));
    const pointWidth = chartWidth / Math.max(trendsData.length - 1, 1);
    
    // Draw axes
    drawAxes(ctx, padding, width, height);
    
    // Draw Y-axis labels
    drawYAxisLabels(ctx, maxPosts, padding, chartHeight, height);
    
    // Draw trend line
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    trendsData.forEach((point, index) => {
        const x = padding + index * pointWidth;
        const y = height - padding - (point.posts / maxPosts) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points
    trendsData.forEach((point, index) => {
        const x = padding + index * pointWidth;
        const y = height - padding - (point.posts / maxPosts) * chartHeight;
        
        // Draw point
        ctx.fillStyle = 'rgba(139, 92, 246, 1)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw white border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw value on point
        if (point.posts > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeText(point.posts.toString(), x, y - 8);
            ctx.fillText(point.posts.toString(), x, y - 8);
        }
    });
    
    // Draw X-axis labels (dates)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    trendsData.forEach((point, index) => {
        if (index % Math.ceil(trendsData.length / 5) === 0) {
            const x = padding + index * pointWidth;
            const date = new Date(point.date);
            const label = (date.getMonth() + 1) + '/' + date.getDate();
            ctx.fillText(label, x, height - padding + 15);
        }
    });
    
    // Add axis labels
    drawAxisLabels(ctx, width, height, 'Date', 'Posts per Day');
}

// Helper functions for drawing common chart elements
function drawAxes(ctx, padding, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
}

function drawYAxisLabels(ctx, maxValue, padding, chartHeight, height) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const value = Math.round((maxValue / ySteps) * i);
        const y = height - padding - (i / ySteps) * chartHeight;
        ctx.fillText(value.toString(), padding - 5, y + 3);
        
        // Draw horizontal grid lines
        if (i > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartHeight * 1.5, y); // Extend grid line
            ctx.stroke();
        }
    }
}

function drawAxisLabels(ctx, width, height, xLabel, yLabel) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, height/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    
    // X-axis label
    ctx.fillText(xLabel, width/2, height - 5);
}

function drawNoDataMessage(ctx, width, height, message) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, width/2, height/2);
}

function drawPieChartLegend(ctx, data, width, height) {
    const legendX = width - 80;
    const legendY = 20;
    const itemHeight = 20;
    
    data.forEach((item, index) => {
        if (item.value > 0) {
            const y = legendY + index * itemHeight;
            
            // Draw color box
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX, y, 12, 12);
            
            // Draw label
            ctx.fillStyle = 'white';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.label}: ${item.value}`, legendX + 16, y + 9);
        }
    });
}

function createDemoAnalytics() {
    return {
        total_posts: totalPosts,
        paid_posts: analyticsData.paid_posts,
        free_posts: analyticsData.free_posts,
        other_posts: Math.max(0, totalPosts - analyticsData.paid_posts - analyticsData.free_posts),
        paid_percentage: totalPosts > 0 ? Math.round(analyticsData.paid_posts/totalPosts*100) : 0,
        free_percentage: totalPosts > 0 ? Math.round(analyticsData.free_posts/totalPosts*100) : 0,
        hourly_distribution: [1, 0, 0, 1, 2, 3, 5, 8, 12, 15, 18, 20, 22, 25, 28, 24, 20, 18, 15, 12, 8, 5, 3, 2],
        weekday_distribution: {
            'Monday': 12, 'Tuesday': 18, 'Wednesday': 15, 'Thursday': 20, 
            'Friday': 16, 'Saturday': 8, 'Sunday': 6
        },
        daily_posts: { '2025-08-17': 5, '2025-08-16': 8, '2025-08-15': 12 },
        most_active_hour: 14,
        most_active_day: 'Tuesday',
        avg_title_length: 45.2,
        avg_description_length: 127.8,
        top_authors: { 'user123': 5, 'photohelp': 3, 'designlover': 2 },
        posting_trends: [
            { date: '2025-08-15', posts: 12, paid: 3, free: 9 },
            { date: '2025-08-16', posts: 8, paid: 2, free: 6 },
            { date: '2025-08-17', posts: 5, paid: 1, free: 4 }
        ],
        engagement_metrics: {
            avg_upvotes: 3.2,
            paid_avg_upvotes: 4.1,
            free_avg_upvotes: 2.8
        }
    };
}

// Close analytics modal
function closeAnalyticsModal() {
    document.getElementById('analyticsModalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}// Global variables
let isMonitoring = false;
let totalPosts = 0;
let totalDownloads = 0;
let currentModalPost = null;
let seenPostIds = new Set(); // Track seen posts to avoid duplicates
let completedPosts = new Set(); // Track completed posts
let analyticsData = { paid_posts: 0, free_posts: 0 }; // Track analytics

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load existing logs first
    loadLogsFromFile();
    
    // Add a small delay to ensure logs are loaded before adding the ready message
    setTimeout(() => {
        // Only add ready message if no logs were loaded
        const logArea = document.getElementById('logArea');
        if (logArea.children.length === 0) {
            log('Application ready. Configure settings and start monitoring.', 'success');
        } else {
            log('Application restarted. Previous session logs restored.', 'info');
        }
        
        // Load completion status and other initialization
        loadCompletedPosts();
        
        // Test Reddit connection and load initial posts
        if (typeof eel !== 'undefined') {
            eel.test_reddit_connection()((result) => {
                if (result.status === 'success') {
                    log('Reddit API connection verified', 'success');
                    
                    // Load last posts from PhotoshopRequest
                    const subreddit = document.getElementById('subredditInput').value;
                    loadInitialPosts(subreddit);
                } else {
                    log(result.message, 'error');
                }
            });
        } else {
            // Demo mode - load some sample posts
            log('Running in demo mode', 'info');
            setTimeout(() => {
                for (let i = 0; i < 25; i++) {
                    setTimeout(() => simulateNewPost(), i * 100);
                }
            }, 1000);
        }
        
        // Enable Enter key for URL input
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    downloadFromUrl();
                }
            });
        }
        
        // Set default values for new controls
        const sortSelect = document.getElementById('sortSelect');
        const limitSelect = document.getElementById('postLimitSelect');
        
        if (sortSelect) {
            sortSelect.value = currentSortMethod;
        }
        
        if (limitSelect) {
            limitSelect.value = currentPostLimit.toString();
        }
        
        // Update counter initially
        updatePostsCounter(0, 0);
    }, 100);
});

setInterval(() => {
    if (typeof eel !== 'undefined') {
        saveLogsToFile();
    }
}, 30000);

// Save logs when the page is about to unload
window.addEventListener('beforeunload', function() {
    if (typeof eel !== 'undefined') {
        saveLogsToFile();
    }
});

// Logging function
function log(message, type = 'info') {
    const logArea = document.getElementById('logArea');
    const now = new Date();
    const dateTime = now.toLocaleString(); // This includes both date and time
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    let className = 'log-info';
    if (type === 'success') className = 'log-success';
    else if (type === 'error') className = 'log-error';
    
    const logText = `[${dateTime}] ${message}`;
    
    logEntry.innerHTML = `
        <span class="log-timestamp">[${dateTime}]</span> 
        <span class="${className}">${message}</span>
    `;
    
    logArea.appendChild(logEntry);
    logArea.scrollTop = logArea.scrollHeight;
    
    // Immediately save logs to file after each new entry
    saveLogsToFile();
    
    // Keep only last 1000 log entries in memory to prevent performance issues
    while (logArea.children.length > 1000) {
        logArea.removeChild(logArea.firstChild);
    }
}

// Update monitoring status
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

// Add new post to the feed
function addPost(title, url, author = 'Unknown', flair = 'Free', created = null, description = '', upvotes = 0, postId = null) {
    // Check for duplicates
    if (postId && seenPostIds.has(postId)) {
        return; // Don't add duplicate posts
    }
    
    if (postId) {
        seenPostIds.add(postId);
    }
    
    const postsContainer = document.getElementById('postsContainer');
    
    // Clear placeholder if it's the first post
    if (totalPosts === 0) {
        postsContainer.innerHTML = '';
    }
    
    const postDate = created ? new Date(created * 1000) : new Date();
    const timeAgo = getTimeAgo(postDate);
    
    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    
    // Check if post is completed
    const isCompleted = postId && completedPosts.has(postId);
    if (isCompleted) {
        postElement.classList.add('completed');
    }
    
    // Determine flair class and update analytics
    let flairClass = 'other';
    if (flair && flair.toLowerCase().includes('paid')) {
        flairClass = 'paid';
        analyticsData.paid_posts++;
    } else if (flair && flair.toLowerCase().includes('free')) {
        flairClass = 'free';
        analyticsData.free_posts++;
    }
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-content">
                <div class="post-title">${title}</div>
                <div class="post-meta">
                    <span>by u/${author}</span>
                    <span>•</span>
                    <span>${timeAgo}</span>
                    ${flair ? `<span>•</span><span class="flair-badge ${flairClass}">${flair}</span>` : ''}
                </div>
                <a href="${url}" target="_blank" class="post-url" onclick="event.stopPropagation()">${url}</a>
            </div>
            <div class="completion-checkbox ${isCompleted ? 'checked' : ''}" onclick="togglePostCompletion('${postId}', event)"></div>
        </div>
    `;
    
    // Store post data for modal
    postElement.postData = {
        title,
        url,
        author,
        flair,
        created: postDate,
        description: description || 'No description provided.',
        upvotes,
        postId,
        completed: isCompleted
    };
    
    postElement.addEventListener('click', function(e) {
        // Don't open modal if clicking checkbox
        if (e.target.classList.contains('completion-checkbox')) {
            return;
        }
        openPostModal(this.postData);
    });
    
    postsContainer.insertBefore(postElement, postsContainer.firstChild);
    
    // Keep only last 10 posts
    while (postsContainer.children.length > 10) {
        postsContainer.removeChild(postsContainer.lastChild);
    }
    
    totalPosts++;
    document.getElementById('totalPosts').textContent = totalPosts;
    
    // Update analytics counters
    updateAnalyticsCounters();
}

// Toggle monitoring on/off
function toggleMonitoring() {
    if (isMonitoring) {
        // Stop monitoring
        if (typeof eel !== 'undefined') {
            eel.stop_monitoring()((result) => {
                isMonitoring = false;
                updateStatus(false);
                log(result.message, 'info');
            });
        } else {
            // Fallback for testing without Eel
            isMonitoring = false;
            updateStatus(false);
            log('Monitoring stopped (demo mode)', 'info');
        }
    } else {
        // Start monitoring
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
            // Fallback for testing without Eel
            isMonitoring = true;
            updateStatus(true);
            log(`Started monitoring r/${subreddit} every ${interval} seconds (demo mode)`, 'success');
            document.getElementById('currentSubreddit').textContent = subreddit;
            
            // Simulate a post after 3 seconds for demo
            setTimeout(() => {
                simulateNewPost();
            }, 3000);
        }
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
}

// Clear logs with confirmation
function clearLogs() {
    const logArea = document.getElementById('logArea');
    const now = new Date();
    const dateTime = now.toLocaleString();
    
    logArea.innerHTML = `
        <div class="log-entry">
            <span class="log-timestamp">[${dateTime}]</span> 
            <span class="log-info">Logs cleared. Session restarted.</span>
        </div>
    `;
    
    // Save the cleared state to file
    saveLogsToFile();
    
    log('Log history cleared successfully', 'success');
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
    
    // Save cleared logs to file
    saveLogsToFile();
}

// Save logs to file
function saveLogsToFile() {
    if (typeof eel !== 'undefined') {
        const logArea = document.getElementById('logArea');
        const logEntries = Array.from(logArea.children).map(entry => entry.innerText);
        eel.save_logs_to_file(logEntries);
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
    
    // Update UI
    updatePostCompletionUI(postId, !isCompleted);
    
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

// Update post completion UI
function updatePostCompletionUI(postId, completed) {
    const postsContainer = document.getElementById('postsContainer');
    const postElements = postsContainer.children;
    
    for (let postElement of postElements) {
        if (postElement.postData && postElement.postData.postId === postId) {
            const checkbox = postElement.querySelector('.completion-checkbox');
            if (completed) {
                postElement.classList.add('completed');
                checkbox.classList.add('checked');
            } else {
                postElement.classList.remove('completed');
                checkbox.classList.remove('checked');
            }
            postElement.postData.completed = completed;
            break;
        }
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
            }
        });
    }
}

// Demo function for testing without Eel
function simulateNewPost() {
    const titles = [
        "Can someone remove the background from this photo?",
        "Please make this image look more professional",
        "Help me fix the lighting in this picture",
        "Can you add a sunset background to this?",
        "Remove the person in the background please",
        "Make this photo black and white with color accent"
    ];
    
    const descriptions = [
        "Hi everyone! I need help removing the background from this photo for my LinkedIn profile. I'd really appreciate any help with this. Thanks in advance!",
        "Looking to make this image more professional for my portfolio. Any editing help would be amazing!",
        "The lighting in this photo is really bad. Can someone help fix it? Willing to tip for good work!",
        "I love this photo but the background is boring. Could someone add a beautiful sunset? Will pay $10 for good quality work.",
        "There's someone photobombing in the background. Can anyone remove them please?",
        "I want to keep only the red roses in color and make everything else black and white. Thanks!"
    ];
    
    const authors = ['user123', 'photohelp', 'designlover', 'artfan99', 'photoreq'];
    const flairs = ['Free', 'Paid', 'Free', 'Paid', 'Free'];
    
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const randomFlair = flairs[Math.floor(Math.random() * flairs.length)];
    const randomUpvotes = Math.floor(Math.random() * 50);
    const randomPostId = Math.random().toString(36).substr(2, 9);
    const randomUrl = `https://reddit.com/r/PhotoshopRequest/comments/${randomPostId}`;
    
    addPost(randomTitle, randomUrl, randomAuthor, randomFlair, Date.now() / 1000, randomDescription, randomUpvotes, randomPostId);
    log(`New post detected: "${randomTitle}" by u/${randomAuthor} [${randomFlair}]`, 'success');
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Load initial posts from subreddit
function loadInitialPosts(subreddit) {
    if (typeof eel !== 'undefined') {
        log(`Checking for posts in r/${subreddit}...`, 'info');
        eel.get_recent_posts(subreddit, 5)((result) => {
            if (result.status === 'success') {
                const loadType = result.load_type || 'UNKNOWN';
                const newPosts = result.new_posts || 0;
                
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
            } else {
                log(`Failed to load recent posts: ${result.message}`, 'error');
            }
        });
    }
}

// Select download folder
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
        // Demo mode - simulate folder selection
        const demoPath = `C:/Users/Demo/Downloads/reddit_photos_${Date.now()}`;
        document.getElementById('downloadDirInput').value = demoPath;
        log(`Download folder set to: ${demoPath} (demo)`, 'success');
    }
}

// Utility function to format time ago
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
    
    // For older posts, show the actual date and time
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Modal functions
function openPostModal(postData) {
    currentModalPost = postData;
    
    // Populate modal with post data
    document.getElementById('modalTitle').textContent = postData.title;
    document.getElementById('modalAuthor').textContent = `u/${postData.author}`;
    
    // Show full date and time for modal
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


// Enhanced JavaScript functions - Add these to your script.js file

// Global variables for post management
let allPosts = []; // Store all posts
let currentPostLimit = 10; // Default post limit
let currentSortMethod = 'newest'; // Default sort method

// Enhanced addPost function to store posts in array instead of directly adding to DOM
function addPost(title, url, author = 'Unknown', flair = 'Free', created = null, description = '', upvotes = 0, postId = null) {
    // Check for duplicates
    if (postId && seenPostIds.has(postId)) {
        return; // Don't add duplicate posts
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
        timestamp: postDate.getTime() // For easy sorting
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

// Function to render posts in the DOM based on current sorting and limit
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
    
    // Apply limit - FIXED: Now takes from the beginning (latest posts) instead of end
    let postsToShow = sortedPosts;
    if (currentPostLimit !== 'all') {
        const limitNumber = parseInt(currentPostLimit);
        // Take the first X posts (which are the latest after sorting)
        postsToShow = sortedPosts.slice(0, limitNumber);
    }
    
    // Render posts
    postsToShow.forEach(postObj => {
        const postElement = createPostElement(postObj);
        postsContainer.appendChild(postElement);
    });
    
    // Update counter
    updatePostsCounter(postsToShow.length, allPosts.length);
}

// Function to create a post DOM element
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

// Function to apply sorting to posts array
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

// Function called when post limit dropdown changes
function applyPostLimit() {
    const limitSelect = document.getElementById('postLimitSelect');
    currentPostLimit = limitSelect.value;
    
    // Refresh display with new limit
    refreshPostsDisplay();
    
    const limitText = limitSelect.value === 'all' ? 'all' : `last ${limitSelect.value}`;
    log(`Post display limit set to: ${limitText} posts`, 'info');
}

// Function to refresh posts from Reddit
function refreshPosts() {
    const subreddit = document.getElementById('subredditInput').value.trim();
    if (!subreddit) {
        log('Please enter a subreddit name', 'error');
        return;
    }
    
    log('Refreshing posts from Reddit...', 'info');
    
    if (typeof eel !== 'undefined') {
        // Always get a substantial amount of posts for refresh
        // This ensures we have enough posts regardless of the display limit
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
        // Demo mode - simulate refresh with more posts
        log('Refreshing posts (demo mode)...', 'info');
        
        // Clear existing
        allPosts = [];
        seenPostIds.clear();
        totalPosts = 0;
        analyticsData = { paid_posts: 0, free_posts: 0 };
        
        // Add more demo posts to ensure filtering works properly
        setTimeout(() => {
            for (let i = 0; i < 25; i++) { // Increased from 15 to 25
                setTimeout(() => simulateNewPost(), i * 50);
            }
            log('Posts refreshed (demo mode)', 'success');
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        }, 500);
    }
}

// Function to update posts counter
function updatePostsCounter(showing, total) {
    const counter = document.getElementById('postsCounter');
    if (counter) {
        if (currentPostLimit === 'all') {
            counter.textContent = `Showing all ${total} posts`;
        } else {
            counter.textContent = `Showing last ${showing} of ${total} posts`;
        }
    }
}

// Enhanced loadInitialPosts function with newest first sorting
function loadInitialPosts(subreddit) {
    if (typeof eel !== 'undefined') {
        log(`Checking for posts in r/${subreddit}...`, 'info');
        
        // Always get a good amount of posts initially, regardless of display limit
        // This ensures we have enough posts to properly filter and sort
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
                
                // Add posts to UI (they come from Reddit in newest-first order already)
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

// Enhanced toggle post completion to work with new system
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

// Initialize default values when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Set default values for new controls
    const sortSelect = document.getElementById('sortSelect');
    const limitSelect = document.getElementById('postLimitSelect');
    
    if (sortSelect) {
        sortSelect.value = currentSortMethod;
    }
    
    if (limitSelect) {
        limitSelect.value = currentPostLimit.toString();
    }
    
    // Update counter initially
    updatePostsCounter(0, 0);
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Eel callback functions (these will be called from Python)
if (typeof eel !== 'undefined') {
    // Callback for new posts from Python
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
    
    // Callback for log messages from Python
    eel.expose(logMessage);
    function logMessage(message, type) {
        log(message, type);
    }
    
    // Callback for monitoring status updates
    eel.expose(updateMonitoringStatus);
    function updateMonitoringStatus(active) {
        isMonitoring = active;
        updateStatus(active);
    }
}}