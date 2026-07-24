from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm import ask_llm
from tts import generate_jarvis_audio_base64  # NEW

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

class SpeakRequest(BaseModel):  # NEW
    text: str

@app.get("/")
def home():
    return {"message": "Jarvis Backend is Running!"}

@app.post("/chat")
def chat(request: ChatRequest):
    question = request.question
    answer = ask_llm(question)
    return {
        "answer": answer
    }

@app.post("/speak")  # NEW — separate endpoint, called after /chat returns text
def speak(request: SpeakRequest):
    try:
        audio_base64 = generate_jarvis_audio_base64(request.text)
        return {
            "audio_base64": audio_base64,
            "audio_format": "mp3"
        }
    except Exception as e:
        return {"error": str(e)}