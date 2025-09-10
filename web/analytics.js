// analytics.js - Modern Analytics dashboard with ApexCharts

// Global chart instances
let hourlyChart, typeChart, weeklyChart, trendsChart;

// Modern color palette
const chartColors = {
    primary: '#8B5CF6',
    secondary: '#A855F7', 
    tertiary: '#C084FC',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    gradients: [
        ['#8B5CF6', '#A855F7'],
        ['#10B981', '#059669'],
        ['#3B82F6', '#1D4ED8'],
        ['#F59E0B', '#D97706'],
        ['#EF4444', '#DC2626']
    ]
};

// Check if ApexCharts is loaded
function isApexChartsLoaded() {
    return typeof ApexCharts !== 'undefined';
}

// Show error message in chart container
function showChartError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 280px; 
                color: #ef4444; 
                text-align: center;
                font-size: 14px;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                margin: 10px;
            ">
                <div>
                    <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                    <div>${message}</div>
                </div>
            </div>
        `;
    }
}

// Show loading message in chart container
function showChartLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 280px; 
                color: #94a3b8; 
                text-align: center;
                font-size: 14px;
            ">
                <div>
                    <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                    <div>Loading chart...</div>
                </div>
            </div>
        `;
    }
}

// Show analytics modal
function showAnalytics() {
    console.log('Opening analytics modal...');
    
    if (typeof eel !== 'undefined') {
        eel.get_posts_analytics()((result) => {
            if (result.status === 'success') {
                const analytics = result.analytics;
                
                // Update analytics modal with comprehensive data
                updateAnalyticsDisplay(analytics);
                
                // Show modal first
                document.getElementById('analyticsModalOverlay').classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Create modern charts after modal is visible
                setTimeout(() => {
                    createModernAnalyticsCharts(analytics);
                }, 300);
                
            } else {
                log('Failed to load analytics: ' + result.message, 'error');
            }
        });
    } else {
        // Demo mode with sample data
        console.log('Running in demo mode...');
        const demoAnalytics = createDemoAnalytics();
        updateAnalyticsDisplay(demoAnalytics);
        
        // Show modal first
        document.getElementById('analyticsModalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Create modern charts after modal is visible
        setTimeout(() => {
            createModernAnalyticsCharts(demoAnalytics);
        }, 300);
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
    
    // Update new activity pattern metrics
    document.getElementById('analyticsBusiestHour').textContent = `${peakHour}:00 (${peakHourCount} posts)`;
    document.getElementById('analyticsQuietestHour').textContent = `${quietHour}:00 (${quietHourCount} posts)`;
    
    document.getElementById('analyticsWeekendRatio').textContent = `${weekendPosts} weekend vs ${weekdayPosts} weekday`;
    
    const primeTimePercentage = analytics.total_posts > 0 ? ((primeTimePosts / analytics.total_posts) * 100).toFixed(1) : 0;
    document.getElementById('analyticsPrimeTime').textContent = `${primeTimePosts} posts (${primeTimePercentage}%)`;
    
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

// Modern ApexCharts implementation with error handling
function createModernAnalyticsCharts(analytics) {
    console.log('Creating modern analytics charts...');
    
    // Check if ApexCharts is available
    if (!isApexChartsLoaded()) {
        console.error('ApexCharts is not loaded!');
        showChartError('hourlyChart', 'ApexCharts library not loaded');
        showChartError('typeChart', 'ApexCharts library not loaded');
        showChartError('weeklyChart', 'ApexCharts library not loaded');
        showChartError('trendsChart', 'ApexCharts library not loaded');
        return;
    }
    
    console.log('ApexCharts is loaded, creating charts...');
    
    // Show loading state
    showChartLoading('hourlyChart');
    showChartLoading('typeChart');
    showChartLoading('weeklyChart');
    showChartLoading('trendsChart');
    
    // Destroy existing charts to prevent memory leaks
    destroyExistingCharts();
    
    // Create all charts with error handling
    try {
        setTimeout(() => createModernHourlyChart(analytics.hourly_distribution || []), 100);
        setTimeout(() => createModernTypeChart(analytics), 200);
        setTimeout(() => createModernWeeklyChart(analytics.weekday_distribution || {}), 300);
        setTimeout(() => createModernTrendsChart(analytics.posting_trends || []), 400);
    } catch (error) {
        console.error('Error creating charts:', error);
        log('Error creating analytics charts: ' + error.message, 'error');
    }
}

function destroyExistingCharts() {
    try {
        if (hourlyChart && typeof hourlyChart.destroy === 'function') {
            hourlyChart.destroy();
            hourlyChart = null;
        }
        if (typeChart && typeof typeChart.destroy === 'function') {
            typeChart.destroy();
            typeChart = null;
        }
        if (weeklyChart && typeof weeklyChart.destroy === 'function') {
            weeklyChart.destroy();
            weeklyChart = null;
        }
        if (trendsChart && typeof trendsChart.destroy === 'function') {
            trendsChart.destroy();
            trendsChart = null;
        }
    } catch (error) {
        console.error('Error destroying charts:', error);
    }
}

function createModernHourlyChart(hourlyData) {
    try {
        console.log('Creating hourly chart with data:', hourlyData);
        
        // Ensure we have 24 hours of data
        if (!hourlyData || hourlyData.length === 0) {
            hourlyData = new Array(24).fill(0);
        } else if (hourlyData.length < 24) {
            while (hourlyData.length < 24) {
                hourlyData.push(0);
            }
        }

        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

        const options = {
            series: [{
                name: 'Posts',
                data: hourlyData
            }],
            chart: {
                type: 'area',
                height: 280,
                background: 'transparent',
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: [chartColors.primary],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                    stops: [0, 90, 100],
                    colorStops: [
                        {
                            offset: 0,
                            color: chartColors.primary,
                            opacity: 0.8
                        },
                        {
                            offset: 100,
                            color: chartColors.secondary,
                            opacity: 0.1
                        }
                    ]
                }
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            xaxis: {
                categories: hours,
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                strokeDashArray: 3
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function(val) {
                        return val + ' posts';
                    }
                }
            },
            dataLabels: {
                enabled: false
            }
        };

        const chartElement = document.getElementById('hourlyChart');
        if (chartElement) {
            chartElement.innerHTML = '';
            hourlyChart = new ApexCharts(chartElement, options);
            hourlyChart.render().catch(error => {
                console.error('Error rendering hourly chart:', error);
                showChartError('hourlyChart', 'Failed to render chart');
            });
        } else {
            console.error('Hourly chart container not found');
        }
    } catch (error) {
        console.error('Error creating hourly chart:', error);
        showChartError('hourlyChart', 'Error creating chart');
    }
}

function createModernTypeChart(analytics) {
    try {
        console.log('Creating type chart with analytics:', analytics);
        
        const total = analytics.total_posts;
        
        if (total === 0) {
            const chartElement = document.getElementById('typeChart');
            if (chartElement) {
                chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 280px; color: #94a3b8;">No data available</div>';
            }
            return;
        }

        const options = {
            series: [analytics.paid_posts, analytics.free_posts, analytics.other_posts],
            chart: {
                type: 'donut',
                height: 280,
                background: 'transparent',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: [chartColors.success, chartColors.info, chartColors.warning],
            labels: ['Paid', 'Free', 'Other'],
            plotOptions: {
                pie: {
                    donut: {
                        size: '60%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#ffffff'
                            },
                            value: {
                                show: true,
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#ffffff',
                                formatter: function(val) {
                                    return val;
                                }
                            },
                            total: {
                                show: true,
                                label: 'Total Posts',
                                fontSize: '14px',
                                color: '#94a3b8',
                                formatter: function() {
                                    return total;
                                }
                            }
                        }
                    }
                }
            },
            legend: {
                position: 'bottom',
                labels: {
                    colors: '#94a3b8'
                }
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function(val) {
                        const percentage = ((val / total) * 100).toFixed(1);
                        return val + ' posts (' + percentage + '%)';
                    }
                }
            }
        };

        const chartElement = document.getElementById('typeChart');
        if (chartElement) {
            chartElement.innerHTML = '';
            typeChart = new ApexCharts(chartElement, options);
            typeChart.render().catch(error => {
                console.error('Error rendering type chart:', error);
                showChartError('typeChart', 'Failed to render chart');
            });
        } else {
            console.error('Type chart container not found');
        }
    } catch (error) {
        console.error('Error creating type chart:', error);
        showChartError('typeChart', 'Error creating chart');
    }
}

function createModernWeeklyChart(weeklyData) {
    try {
        console.log('Creating weekly chart with data:', weeklyData);
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const data = days.map(day => weeklyData[day] || 0);
        const maxValue = Math.max(...data);

        if (maxValue === 0) {
            const chartElement = document.getElementById('weeklyChart');
            if (chartElement) {
                chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 280px; color: #94a3b8;">No weekly data available</div>';
            }
            return;
        }

        const options = {
            series: [{
                name: 'Posts',
                data: data
            }],
            chart: {
                type: 'bar',
                height: 280,
                background: 'transparent',
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: [chartColors.secondary],
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    dataLabels: {
                        position: 'top'
                    },
                    columnWidth: '60%'
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'light',
                    type: 'vertical',
                    shadeIntensity: 0.5,
                    gradientToColors: [chartColors.tertiary],
                    inverseColors: false,
                    opacityFrom: 0.9,
                    opacityTo: 0.6,
                    stops: [0, 100]
                }
            },
            xaxis: {
                categories: days.map(day => day.substring(0, 3)),
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                strokeDashArray: 3
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function(val) {
                        return val + ' posts';
                    }
                }
            },
            dataLabels: {
                enabled: false
            }
        };

        const chartElement = document.getElementById('weeklyChart');
        if (chartElement) {
            chartElement.innerHTML = '';
            weeklyChart = new ApexCharts(chartElement, options);
            weeklyChart.render().catch(error => {
                console.error('Error rendering weekly chart:', error);
                showChartError('weeklyChart', 'Failed to render chart');
            });
        } else {
            console.error('Weekly chart container not found');
        }
    } catch (error) {
        console.error('Error creating weekly chart:', error);
        showChartError('weeklyChart', 'Error creating chart');
    }
}

function createModernTrendsChart(trendsData) {
    try {
        console.log('Creating trends chart with data:', trendsData);
        
        if (trendsData.length === 0) {
            const chartElement = document.getElementById('trendsChart');
            if (chartElement) {
                chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 280px; color: #94a3b8;">No trend data available</div>';
            }
            return;
        }

        const categories = trendsData.map(point => {
            const date = new Date(point.date);
            return (date.getMonth() + 1) + '/' + date.getDate();
        });

        const totalPosts = trendsData.map(point => point.posts);
        const paidPosts = trendsData.map(point => point.paid || 0);
        const freePosts = trendsData.map(point => point.free || 0);

        const options = {
            series: [
                {
                    name: 'Total Posts',
                    type: 'area',
                    data: totalPosts
                },
                {
                    name: 'Paid Posts',
                    type: 'line',
                    data: paidPosts
                },
                {
                    name: 'Free Posts',
                    type: 'line',
                    data: freePosts
                }
            ],
            chart: {
                type: 'area',
                height: 280,
                background: 'transparent',
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: [chartColors.primary, chartColors.success, chartColors.info],
            fill: {
                type: ['gradient', 'solid', 'solid'],
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            stroke: {
                curve: 'smooth',
                width: [0, 3, 3]
            },
            xaxis: {
                categories: categories,
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '12px'
                    }
                }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                strokeDashArray: 3
            },
            legend: {
                labels: {
                    colors: '#94a3b8'
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                y: {
                    formatter: function(val) {
                        return val + ' posts';
                    }
                }
            },
            dataLabels: {
                enabled: false
            }
        };

        const chartElement = document.getElementById('trendsChart');
        if (chartElement) {
            chartElement.innerHTML = '';
            trendsChart = new ApexCharts(chartElement, options);
            trendsChart.render().catch(error => {
                console.error('Error rendering trends chart:', error);
                showChartError('trendsChart', 'Failed to render chart');
            });
        } else {
            console.error('Trends chart container not found');
        }
    } catch (error) {
        console.error('Error creating trends chart:', error);
        showChartError('trendsChart', 'Error creating chart');
    }
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
    
    // Destroy charts when closing modal to free memory
    destroyExistingCharts();
}

// Debug function to test charts manually
function testCharts() {
    console.log('Testing charts...');
    console.log('ApexCharts loaded:', isApexChartsLoaded());
    console.log('Chart containers exist:');
    console.log('- hourlyChart:', !!document.getElementById('hourlyChart'));
    console.log('- typeChart:', !!document.getElementById('typeChart'));
    console.log('- weeklyChart:', !!document.getElementById('weeklyChart'));
    console.log('- trendsChart:', !!document.getElementById('trendsChart'));
}

// Expose debug function globally
if (typeof window !== 'undefined') {
    window.testCharts = testCharts;
}