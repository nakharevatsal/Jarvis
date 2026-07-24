from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm import ask_llm

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