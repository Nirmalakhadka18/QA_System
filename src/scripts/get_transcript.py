import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id):
    try:
        # Validated API for installed version 1.2.4
        transcript = YouTubeTranscriptApi().fetch(video_id)
        # Transcript object is iterable yielding snippets with .text attribute
        transcript_text = " ".join([snippet.text for snippet in transcript])
        print(json.dumps({"transcript": transcript_text}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Video ID required"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    get_transcript(video_id)
