import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id):
    try:
        api = YouTubeTranscriptApi()
        
        # list() returns a TranscriptList object
        transcript_list = api.list(video_id)
        
        # Try to find a manual English transcript
        try:
             transcript = transcript_list.find_manually_created_transcript(['en'])
        except:
             # Fallback to generated English
             try:
                 transcript = transcript_list.find_generated_transcript(['en'])
             except:
                 # Fallback to ANY transcript (and we could translate, but let's just get it)
                 # iterate and get the first one?
                 # TranscriptList is iterable
                 transcript = None
                 for t in transcript_list:
                     transcript = t
                     break
        
        if not transcript:
            print(json.dumps({"error": "No transcript found."}))
            return

        # Fetch the actual data
        # transcript.fetch() returns FetchedTranscript
        fetched_transcript = transcript.fetch()
        
        full_text = " ".join([item.text for item in fetched_transcript])
        print(json.dumps({"transcript": full_text}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Video ID required"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    get_transcript(video_id)
