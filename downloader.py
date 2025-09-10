import os
from dotenv import load_dotenv
import praw
import requests


load_dotenv()

client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
user_agent = os.getenv('USER_AGENT')

reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, user_agent=user_agent)

save_directory = 'C:/Users/matus/Desktop/photos-reque/downloads/'
if not os.path.exists(save_directory):
    os.makedirs(save_directory)

def download_image(image_url, save_directory):
    response = requests.get(image_url)
    if response.status_code == 200:

        file_name = image_url.split('/')[-1].split('?')[0]
        file_path = os.path.join(save_directory, file_name)
        with open(file_path, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded {file_name}")


def check(link, save_directory):
    try:
        submission = reddit.submission(url=link)
        
        if submission.url.endswith(('jpg', 'jpeg', 'png')):
            download_image(submission.url, save_directory)
            print(f"\nIMAGE DOWNLOADED\n")
        elif hasattr(submission, 'gallery_data'):
            lenght = len(submission.gallery_data) + 1
            for item in submission.gallery_data['items']:
                image_id = item['media_id']
                image_url = submission.media_metadata[image_id]['s']['u']
                download_image(image_url, save_directory)
            print(f"\nIMAGES -> {lenght} <- DOWNLOADED\n")

    except Exception as e:
        print(f"An error occurred: {e}")
        
        
print("LINK -> ", end="")
link = input()
check(link, save_directory)