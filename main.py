import eel
import os
import praw
import requests
import threading
import time
import json
from datetime import datetime
from dotenv import load_dotenv
from tkinter import filedialog
import tkinter as tk

load_dotenv()

# Initialize Eel
eel.init('web')

# Reddit setup
reddit = praw.Reddit(
    client_id=os.getenv('CLIENT_ID'),
    client_secret=os.getenv('CLIENT_SECRET'),
    user_agent=os.getenv('USER_AGENT')
)

# Global variables
monitoring = False
monitoring_thread = None
last_post_id = None
seen_posts = set()  # Track posts we've already seen

# File paths for data persistence
LOGS_FILE = 'activity_logs.log'
POSTS_ANALYTICS_FILE = 'posts_analytics.log'
COMPLETED_POSTS_FILE = 'completed_posts.json'
LAST_POST_FILE = 'last_post.json'

@eel.expose
def start_monitoring(subreddit_name, interval):
    """Start monitoring Reddit posts"""
    global monitoring, monitoring_thread, last_post_id
    
    if monitoring:
        return {"status": "error", "message": "Already monitoring"}
    
    monitoring = True
    last_post_id = None
    
    def monitor_loop():
        global last_post_id
        while monitoring:
            try:
                subreddit = reddit.subreddit(subreddit_name)
                # Get the newest post (limit=1 gets the most recent)
                for post in subreddit.new(limit=1):
                    if last_post_id != post.id and post.id not in seen_posts:
                        # Send new post to frontend with full details
                        seen_posts.add(post.id)
                        post_data = {
                            'title': post.title,
                            'url': post.url,
                            'author': str(post.author),
                            'id': post.id,
                            'created': post.created_utc,
                            'flair': post.link_flair_text,
                            'description': post.selftext,
                            'upvotes': post.score
                        }
                        
                        # Log post data for analytics
                        log_post_analytics(post_data, subreddit_name)
                        
                        eel.newPostDetected(post_data)
                        last_post_id = post.id
                    break
                
                time.sleep(interval)
            except Exception as e:
                eel.logMessage(f"Error monitoring: {str(e)}", "error")
                break
    
    monitoring_thread = threading.Thread(target=monitor_loop)
    monitoring_thread.daemon = True
    monitoring_thread.start()
    
    return {"status": "success", "message": f"Started monitoring r/{subreddit_name}"}

@eel.expose
def stop_monitoring():
    """Stop monitoring Reddit posts"""
    global monitoring
    monitoring = False
    return {"status": "success", "message": "Monitoring stopped"}

@eel.expose
def download_from_url(post_url, save_directory):
    """Download images from Reddit post URL"""
    try:
        if not os.path.exists(save_directory):
            os.makedirs(save_directory)
        
        submission = reddit.submission(url=post_url)
        downloaded_count = 0
        
        # Single image
        if submission.url.endswith(('jpg', 'jpeg', 'png', 'gif')):
            if download_image(submission.url, save_directory):
                downloaded_count = 1
        
        # Gallery
        elif hasattr(submission, 'gallery_data') and submission.gallery_data:
            for item in submission.gallery_data['items']:
                image_id = item['media_id']
                if image_id in submission.media_metadata:
                    image_url = submission.media_metadata[image_id]['s']['u']
                    image_url = image_url.replace('&amp;', '&')  # Fix URL encoding
                    if download_image(image_url, save_directory):
                        downloaded_count += 1
        
        return {
            "status": "success", 
            "message": f"Downloaded {downloaded_count} images",
            "count": downloaded_count
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Download failed: {str(e)}"}

def download_image(image_url, save_directory):
    """Download a single image"""
    try:
        response = requests.get(image_url, headers={'User-Agent': 'RedditMonitor/1.0'})
        if response.status_code == 200:
            file_name = image_url.split('/')[-1].split('?')[0]
            if not file_name.endswith(('.jpg', '.jpeg', '.png', '.gif')):
                file_name += '.jpg'
            
            file_path = os.path.join(save_directory, file_name)
            with open(file_path, 'wb') as file:
                file.write(response.content)
            return True
    except Exception as e:
        eel.logMessage(f"Failed to download {image_url}: {str(e)}", "error")
    return False

@eel.expose
def get_recent_posts(subreddit_name, limit=5):
    """Get recent posts from subreddit - smart loading based on last seen post"""
    try:
        subreddit = reddit.subreddit(subreddit_name)
        posts = []
        
        # Get the last seen post info
        last_post_info = load_last_post_info()
        
        # Determine loading strategy
        if last_post_info is None:
            # First time launch - get last 1000 posts for comprehensive analysis
            actual_limit = 1000
            load_type = "FIRST_LAUNCH"
            eel.logMessage(f"First launch detected - loading last {actual_limit} posts for analysis", "info")
        else:
            # Subsequent launch - get posts since last seen
            last_post_id = last_post_info.get('post_id')
            last_timestamp = last_post_info.get('timestamp', 0)
            
            # Get more posts to ensure we catch everything since last launch
            actual_limit = 500  # Higher limit to catch all posts since last launch
            load_type = "INCREMENTAL_UPDATE"
            
            current_time = time.time()
            hours_since_last = (current_time - last_timestamp) / 3600
            eel.logMessage(f"Loading posts since last launch ({hours_since_last:.1f} hours ago)", "info")
        
        new_posts_count = 0
        last_seen_post = None
        
        # Get posts using .new() which returns newest first
        for post in subreddit.new(limit=actual_limit):
            # For incremental updates, stop when we reach the last seen post
            if load_type == "INCREMENTAL_UPDATE" and last_post_info and post.id == last_post_info.get('post_id'):
                eel.logMessage(f"Reached last seen post '{post.id}' - stopping incremental load", "info")
                break
            
            if post.id not in seen_posts:
                seen_posts.add(post.id)
                post_data = {
                    'title': post.title,
                    'url': post.url,
                    'author': str(post.author),
                    'id': post.id,
                    'created': post.created_utc,
                    'flair': post.link_flair_text,
                    'description': post.selftext,
                    'upvotes': post.score
                }
                
                # Log post data for analytics
                log_post_analytics(post_data, subreddit_name, is_initial_load=True, load_type=load_type)
                
                posts.append(post_data)
                new_posts_count += 1
                
                # Track the most recent post (first in the list)
                if last_seen_post is None:
                    last_seen_post = {
                        'post_id': post.id,
                        'timestamp': time.time(),
                        'post_created': post.created_utc,
                        'subreddit': subreddit_name
                    }
        
        # Save the most recent post info for next launch
        if last_seen_post:
            save_last_post_info(last_seen_post)
        
        # IMPORTANT: Posts are already in newest-first order from Reddit API
        # No need to reverse or sort - Reddit's .new() returns newest first
        
        # Log the results
        if load_type == "FIRST_LAUNCH":
            eel.logMessage(f"First launch complete: loaded {new_posts_count} posts for analysis", "success")
        else:
            if new_posts_count > 0:
                eel.logMessage(f"Found {new_posts_count} new posts since last launch", "success")
            else:
                eel.logMessage("No new posts since last launch", "info")
        
        return {
            "status": "success", 
            "posts": posts,  # Already in newest-first order
            "load_type": load_type, 
            "new_posts": new_posts_count
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Failed to get recent posts: {str(e)}"}

def load_last_post_info():
    """Load information about the last seen post"""
    try:
        if os.path.exists(LAST_POST_FILE):
            with open(LAST_POST_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error loading last post info: {str(e)}")
        return None

def save_last_post_info(post_info):
    """Save information about the most recent post seen"""
    try:
        with open(LAST_POST_FILE, 'w', encoding='utf-8') as f:
            json.dump(post_info, f, indent=2)
    except Exception as e:
        print(f"Error saving last post info: {str(e)}")

def should_do_full_load():
    """Check if we should load full history (100 posts) or just recent (5 posts) - DEPRECATED"""
    # This function is now deprecated as we use load_last_post_info() for smarter loading
    return load_last_post_info() is None

@eel.expose
def select_download_folder():
    """Open folder selection dialog"""
    try:
        # Create a root window and hide it
        root = tk.Tk()
        root.withdraw()
        root.wm_attributes('-topmost', 1)
        
        # Open folder dialog
        folder = filedialog.askdirectory(
            title="Select Download Folder",
            initialdir=os.path.expanduser("~/Downloads")
        )
        
        root.destroy()
        
        if folder:
            return {"status": "success", "folder": folder}
        else:
            return {"status": "cancelled", "message": "Folder selection cancelled"}
            
    except Exception as e:
        return {"status": "error", "message": f"Failed to select folder: {str(e)}"}

def log_post_analytics(post_data, subreddit_name, is_initial_load=False, load_type="UNKNOWN"):
    """Log post data for analytics and future analysis"""
    try:
        # Convert timestamp to readable format
        post_datetime = datetime.fromtimestamp(post_data['created'])
        
        # Determine post type based on flair
        flair = post_data.get('flair', '').lower() if post_data.get('flair') else 'unknown'
        if 'paid' in flair:
            post_type = 'PAID'
        elif 'free' in flair:
            post_type = 'FREE'
        else:
            post_type = 'OTHER'
        
        # Calculate post length metrics
        title_length = len(post_data['title'])
        description_length = len(post_data.get('description', ''))
        
        # Create analytics log entry
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'detection_type': load_type,
            'post_id': post_data['id'],
            'subreddit': subreddit_name,
            'author': post_data['author'],
            'post_created': post_datetime.isoformat(),
            'post_date': post_datetime.strftime('%Y-%m-%d'),
            'post_time': post_datetime.strftime('%H:%M:%S'),
            'post_hour': post_datetime.hour,
            'post_weekday': post_datetime.strftime('%A'),
            'post_type': post_type,
            'flair_raw': post_data.get('flair', ''),
            'title_length': title_length,
            'description_length': description_length,
            'upvotes': post_data.get('upvotes', 0),
            'title': post_data['title'][:100] + '...' if title_length > 100 else post_data['title']  # Truncate long titles
        }
        
        # Write to analytics log file
        with open(POSTS_ANALYTICS_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
            
    except Exception as e:
        print(f"Failed to log post analytics: {str(e)}")

@eel.expose
def get_posts_analytics():
    """Get analytics data from posts log for dashboard"""
    try:
        if not os.path.exists(POSTS_ANALYTICS_FILE):
            return {"status": "success", "analytics": create_empty_analytics()}
        
        posts = []
        with open(POSTS_ANALYTICS_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        posts.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        continue
        
        if not posts:
            return {"status": "success", "analytics": create_empty_analytics()}
        
        # Calculate comprehensive analytics
        analytics = calculate_detailed_analytics(posts)
        
        return {"status": "success", "analytics": analytics}
        
    except Exception as e:
        return {"status": "error", "message": f"Failed to get analytics: {str(e)}"}

def create_empty_analytics():
    """Create empty analytics structure"""
    return {
        "total_posts": 0,
        "paid_posts": 0,
        "free_posts": 0,
        "other_posts": 0,
        "paid_percentage": 0,
        "free_percentage": 0,
        "peak_hours": {},
        "weekday_distribution": {},
        "hourly_distribution": [0] * 24,
        "daily_posts": {},
        "avg_title_length": 0,
        "avg_description_length": 0,
        "most_active_hour": 0,
        "most_active_day": "Unknown",
        "top_authors": {},
        "posting_trends": [],
        "engagement_metrics": {
            "avg_upvotes": 0,
            "paid_avg_upvotes": 0,
            "free_avg_upvotes": 0
        }
    }

def calculate_detailed_analytics(posts):
    """Calculate comprehensive analytics from posts data"""
    total_posts = len(posts)
    paid_posts = sum(1 for p in posts if p['post_type'] == 'PAID')
    free_posts = sum(1 for p in posts if p['post_type'] == 'FREE')
    other_posts = sum(1 for p in posts if p['post_type'] == 'OTHER')
    
    # Hour distribution (24-hour array)
    hourly_distribution = [0] * 24
    hour_counts = {}
    for post in posts:
        hour = post['post_hour']
        hourly_distribution[hour] += 1
        hour_counts[hour] = hour_counts.get(hour, 0) + 1
    
    # Weekday distribution
    weekday_counts = {}
    for post in posts:
        weekday = post['post_weekday']
        weekday_counts[weekday] = weekday_counts.get(weekday, 0) + 1
    
    # Daily posting trends (last 30 days)
    daily_posts = {}
    for post in posts:
        date = post['post_date']
        daily_posts[date] = daily_posts.get(date, 0) + 1
    
    # Author analysis
    author_counts = {}
    for post in posts:
        author = post['author']
        author_counts[author] = author_counts.get(author, 0) + 1
    
    # Sort authors by post count and get top 10
    top_authors = dict(sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:10])
    
    # Engagement metrics
    total_upvotes = sum(p['upvotes'] for p in posts)
    paid_upvotes = sum(p['upvotes'] for p in posts if p['post_type'] == 'PAID')
    free_upvotes = sum(p['upvotes'] for p in posts if p['post_type'] == 'FREE')
    
    avg_upvotes = total_upvotes / total_posts if total_posts > 0 else 0
    paid_avg_upvotes = paid_upvotes / paid_posts if paid_posts > 0 else 0
    free_avg_upvotes = free_upvotes / free_posts if free_posts > 0 else 0
    
    # Length analysis
    avg_title_length = sum(p['title_length'] for p in posts) / total_posts if total_posts > 0 else 0
    avg_description_length = sum(p['description_length'] for p in posts) / total_posts if total_posts > 0 else 0
    
    # Posting trends (group by date for trend analysis)
    posting_trends = []
    sorted_dates = sorted(daily_posts.keys())
    for date in sorted_dates:
        posting_trends.append({
            'date': date,
            'posts': daily_posts[date],
            'paid': sum(1 for p in posts if p['post_date'] == date and p['post_type'] == 'PAID'),
            'free': sum(1 for p in posts if p['post_date'] == date and p['post_type'] == 'FREE')
        })
    
    return {
        "total_posts": total_posts,
        "paid_posts": paid_posts,
        "free_posts": free_posts,
        "other_posts": other_posts,
        "paid_percentage": round((paid_posts / total_posts * 100), 1) if total_posts > 0 else 0,
        "free_percentage": round((free_posts / total_posts * 100), 1) if total_posts > 0 else 0,
        "peak_hours": hour_counts,
        "weekday_distribution": weekday_counts,
        "hourly_distribution": hourly_distribution,
        "daily_posts": daily_posts,
        "avg_title_length": round(avg_title_length, 1),
        "avg_description_length": round(avg_description_length, 1),
        "most_active_hour": max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else 0,
        "most_active_day": max(weekday_counts.items(), key=lambda x: x[1])[0] if weekday_counts else "Unknown",
        "top_authors": top_authors,
        "posting_trends": posting_trends,
        "engagement_metrics": {
            "avg_upvotes": round(avg_upvotes, 1),
            "paid_avg_upvotes": round(paid_avg_upvotes, 1),
            "free_avg_upvotes": round(free_avg_upvotes, 1)
        }
    }

@eel.expose
def save_logs_to_file(log_entries):
    """Save activity logs to file"""
    try:
        with open(LOGS_FILE, 'w', encoding='utf-8') as f:
            for entry in log_entries:
                f.write(entry + '\n')
        return {"status": "success", "message": "Logs saved successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to save logs: {str(e)}"}

@eel.expose
def load_logs_from_file():
    """Load activity logs from file"""
    try:
        if os.path.exists(LOGS_FILE):
            with open(LOGS_FILE, 'r', encoding='utf-8') as f:
                logs = [line.strip() for line in f.readlines() if line.strip()]
            return logs
        return []
    except Exception as e:
        print(f"Failed to load logs: {str(e)}")
        return []

@eel.expose
def save_completed_posts(completed_post_ids):
    """Save completed posts to file"""
    try:
        data = {
            'completed_posts': completed_post_ids,
            'last_updated': datetime.now().isoformat()
        }
        with open(COMPLETED_POSTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return {"status": "success", "message": "Completed posts saved successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to save completed posts: {str(e)}"}

@eel.expose
def load_completed_posts():
    """Load completed posts from file"""
    try:
        if os.path.exists(COMPLETED_POSTS_FILE):
            with open(COMPLETED_POSTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get('completed_posts', [])
        return []
    except Exception as e:
        print(f"Failed to load completed posts: {str(e)}")
        return []

@eel.expose
def test_reddit_connection():
    """Test Reddit API connection"""
    try:
        # Try to access a subreddit
        subreddit = reddit.subreddit('test')
        subreddit.display_name  # This will fail if credentials are wrong
        return {"status": "success", "message": "Reddit API connected successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Reddit API connection failed: {str(e)}"}

if __name__ == '__main__':
    # Start the Eel app
    eel.start('index.html', size=(1200, 800), port=8080)