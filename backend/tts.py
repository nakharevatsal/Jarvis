# pip install edge-tts
import edge_tts
import asyncio
import base64

# en-GB-RyanNeural = calm, refined adult British male — closest free match to JARVIS
JARVIS_VOICE = "en-GB-RyanNeural"

async def _generate_audio(text: str) -> bytes:
    """Streams MP3 bytes from Edge's free neural TTS — no API key required."""
    communicate = edge_tts.Communicate(
        text=text,
        voice=JARVIS_VOICE,
        rate="-8%",    # slower, measured delivery
        pitch="-5Hz"   # slightly lower = calm/grounded tone
    )

    audio_chunks = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.extend(chunk["data"])

    return bytes(audio_chunks)


def generate_jarvis_audio_base64(text: str) -> str:
    """Sync wrapper — call this from FastAPI routes. Returns Base64-encoded MP3."""
    audio_bytes = asyncio.run(_generate_audio(text))
    return base64.b64encode(audio_bytes).decode("utf-8")