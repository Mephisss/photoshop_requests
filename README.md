# Reddit PhotoshopRequest Monitor
A modern, real-time monitoring application for tracking posts in the r/PhotoshopRequest subreddit.

![Application Screenshot](screenshot1.png)

## Features

### Real-Time Monitoring
- **Live Post Feed**: Monitor r/PhotoshopRequest for new posts in real-time
- **Smart Loading**: Intelligent post loading that tracks your last session
- **Post Filtering**: Sort by newest, most upvoted, paid/free requests
- **Completion Tracking**: Mark posts as complete and track your progress

### Advanced Analytics
- **Visual Dashboard**: Interactive charts showing posting patterns
- **Activity Analysis**: Hourly, daily, and weekly posting trends
- **Request Type Breakdown**: Paid vs Free request analytics
- **Engagement Metrics**: Upvote patterns and author statistics

### Automated Downloads
- **Bulk Image Download**: Download all images from Reddit posts
- **Gallery Support**: Handles both single images and Reddit galleries
- **Progress Tracking**: Real-time download progress with status updates
- **Custom Directories**: Choose your preferred download location

### Modern UI
- **Glassmorphism Design**: Beautiful blur effects and modern aesthetics
- **Responsive Layout**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes for long monitoring sessions
- **Smooth Animations**: Polished interactions and transitions

## Installation

### Prerequisites
- Python 3.7 or higher
- Reddit API credentials (see setup below)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/reddit-photoshop-monitor.git
cd reddit-photoshop-monitor
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Reddit API Setup
1. Visit [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Fill in the form:
   - **Name**: Your app name (e.g., "PhotoshopRequest Monitor")
   - **Description**: Optional description
   - **Redirect URI**: `http://localhost:8080` (required but not used)

### 4. Environment Configuration
Create a `.env` file in the project root:

```env
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
USER_AGENT=script:photoshop_monitor:v1.0 (by /u/yourusername)
```

**Where to find your credentials:**
- `CLIENT_ID`: Located under your app name (14-character string)
- `CLIENT_SECRET`: Labeled as "secret" in your app settings
- `USER_AGENT`: Use the format above with your Reddit username

### 5. Run the Application
```bash
python main.py
```

The application will automatically open in your default browser at `http://localhost:8080`

## Usage Guide

### Getting Started
1. **Configure Settings**: Set your preferred polling interval and download directory
2. **Start Monitoring**: Click "Start Monitoring" to begin tracking new posts
3. **View Posts**: New posts appear in real-time in the Live Feed
4. **Download Images**: Use manual download or click posts for details

### Key Features

#### Post Management
- **Click any post** to view detailed information in a modal
- **Mark posts as complete** using the checkbox on each post
- **Sort and filter** posts using the dropdown controls
- **Refresh manually** to get the latest posts from Reddit

#### Analytics Dashboard
- Click **"View Analytics"** to open the comprehensive dashboard
- View **hourly activity patterns** to find peak posting times
- Analyze **paid vs free request ratios** for business insights
- Track **posting trends** over time with interactive charts

#### Download Management
- **Automatic Detection**: Supports single images and Reddit galleries
- **Progress Tracking**: Real-time progress bars with status updates
- **Custom Locations**: Browse and select your preferred download folder
- **Bulk Operations**: Download all images from multi-image posts

### Keyboard Shortcuts
- `Escape`: Close modals and overlays
- `Enter`: (in URL input) Start download

## Configuration

### Application Settings
- **Polling Interval**: How often to check for new posts (10-3600 seconds)
- **Download Directory**: Where to save downloaded images
- **Post Display Limit**: Number of posts to show (5-100 or all)
- **Sort Options**: Various sorting methods for the post feed

### File Persistence
The application automatically saves:
- **Activity Logs**: `activity_logs.log`
- **Analytics Data**: `posts_analytics.log`
- **Completed Posts**: `completed_posts.json`
- **Session State**: `last_post.json`

## Project Structure

```
reddit-photoshop-monitor/
├── main.py                 # Main Python application
├── downloader.py          # Standalone image downloader
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables (create this)
├── web/                  # Frontend web application
│   ├── index.html        # Main HTML interface
│   ├── styles.css        # Modern CSS styling
│   ├── main.js          # Core application logic
│   ├── post-management.js # Post handling and sorting
│   ├── monitoring.js     # Reddit API monitoring
│   ├── analytics.js      # Analytics and charts
│   ├── ui-utils.js       # UI utilities and modals
│   ├── persistence.js    # Data persistence
│   └── demo.js          # Demo mode functionality
└── README.md             # This file
```

## Technology Stack

### Backend
- **Python 3.7+**: Core application logic
- **PRAW (Python Reddit API Wrapper)**: Reddit API integration
- **Eel**: Python-JavaScript bridge for web UI
- **Requests**: HTTP library for image downloads

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Vanilla JavaScript**: No framework dependencies
- **ApexCharts**: Interactive charts and visualizations
- **Modern CSS**: Glassmorphism design with backdrop filters

## Troubleshooting

### Common Issues

**"Reddit API connection failed"**
- Verify your `.env` file credentials
- Check your Reddit app settings
- Ensure you're using the correct app type (script)

**"No posts loading"**
- Check your internet connection
- Verify the subreddit name is correct
- Try refreshing the posts manually

**"Download failed"**
- Ensure the download directory exists and is writable
- Check if the Reddit post contains downloadable images
- Verify the post URL is from Reddit

**Charts not displaying**
- Ensure you have an internet connection (ApexCharts loads from CDN)
- Try refreshing the analytics modal
- Check browser console for JavaScript errors

### Performance Tips
- Use reasonable polling intervals (60+ seconds recommended)
- Limit post display count for better performance
- Clear logs periodically to free up memory

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/reddit-photoshop-monitor.git

# Install development dependencies
pip install -r requirements.txt

# Run in development mode
python main.py
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


