from youtube_transcript_api import YouTubeTranscriptApi

def test_video(video_id, name):
    print(f"\n--- Testing {name} ({video_id}) ---")
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        print("✅ SUCCESS!")
        print(f"Transcript length: {len(transcript)} entries")
    except Exception as e:
        print(f"❌ FAILED: {e}")

# 1. Control: Me at the zoo (Public, No Copyright)
test_video('jNQXAC9IVRw', "Me at the zoo")

# 2. Test: Passenger - Let Her Go (Music Video, Likely Restricted)
test_video('RBumgq5yVrA', "Passenger - Let Her Go")
