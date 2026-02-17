from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import youtube_transcript_api

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urlparse(self.path).query
        params = parse_qs(query)
        video_id = params.get('videoId', [None])[0]

        if not video_id:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Missing videoId'}).encode())
            return

        try:
            # Use the library name directly and check available methods
            if hasattr(youtube_transcript_api.YouTubeTranscriptApi, 'get_transcript'):
                transcript_list = youtube_transcript_api.YouTubeTranscriptApi.get_transcript(video_id)
                full_text = " ".join([i['text'] for i in transcript_list])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'transcript': full_text}).encode())
            else:
                raise AttributeError("YouTubeTranscriptApi.get_transcript not found. Available attributes: " + str(dir(youtube_transcript_api.YouTubeTranscriptApi)))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
