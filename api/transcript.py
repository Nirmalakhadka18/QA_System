from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from youtube_transcript_api import YouTubeTranscriptApi

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed_path.query)
        video_id = query.get('videoId', [None])[0]
        
        if not video_id:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'Python Transcript Service Ready'}).encode())
            return

        try:
            transcript_text = ""
            
            # Pattern 1: youtube-transcript-api (Fast)
            try:
                # Try standard get_transcript
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
                transcript_text = " ".join([t['text'] for t in transcript])
            except Exception as e1:
                print(f"API Pattern 1 failed: {e1}")
                try:
                   # Try list_transcripts
                   transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                   transcript = transcript_list.find_transcript(['en']).fetch()
                   transcript_text = " ".join([t['text'] for t in transcript]) 
                except Exception as e2:
                    print(f"API Pattern 2 failed: {e2}")

            if not transcript_text:
                raise Exception("Could not fetch using any method")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'transcript': transcript_text}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
            return
    
    def do_POST(self):
        self.send_response(405)
        self.end_headers()
