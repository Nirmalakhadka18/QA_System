from youtube_transcript_api import YouTubeTranscriptApi
import json
import sys

def run_test(video_id):
    print(f"Testing {video_id}...")
    try:
        # The standard way to get transcript
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        print(f"SUCCESS: Found {len(transcript)} segments.")
        return True
    except Exception as e:
        print(f"FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    v1 = 'vlaH35-MLsk'
    v2 = 'JGwWNGJdvx8'
    
    run_test(v1)
    run_test(v2)
