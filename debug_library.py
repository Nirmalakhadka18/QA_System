import youtube_transcript_api
from youtube_transcript_api import YouTubeTranscriptApi
import sys

print(f"Python Executable: {sys.executable}")
print(f"Library Location: {youtube_transcript_api.__file__}")
print("\n--- Attributes of youtube_transcript_api ---")
print(dir(youtube_transcript_api))

print("\n--- Attributes of YouTubeTranscriptApi ---")
try:
    print(dir(YouTubeTranscriptApi))
except Exception as e:
    print(f"Could not inspect class: {e}")

print("\n--- Testing Import ---")
try:
    # Alternative import style
    import youtube_transcript_api
    print("Direct import successful")
except ImportError as e:
    print(f"Import failed: {e}")
