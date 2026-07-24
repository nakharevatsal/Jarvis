import os
import requests
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# Read API key
API_KEY = os.getenv("OPENROUTER_API_KEY")

# OpenRouter endpoint
URL = "https://openrouter.ai/api/v1/chat/completions"


def ask_llm(question: str) -> str:

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "openrouter/free" ,
        "messages": [
            {
                "role": "user",
                "content": question
            }
        ]
    }

    try:
        response = requests.post(
    URL,
    headers=headers,
    json=payload,
    timeout=30
)

        response.raise_for_status()

        data = response.json()

        answer = data["choices"][0]["message"]["content"]

        return answer

    except Exception as e:
        return f"Error: {str(e)}"