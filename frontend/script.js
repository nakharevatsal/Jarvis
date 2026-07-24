const button = document.getElementById("askBtn");
button.addEventListener("click", askQuestion);
document
    .getElementById("question")
    .addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            askQuestion();
        }

    });
const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = true;

}
// ============================================
// VOICE STATE
// ============================================
let voiceEnabled = true;
let useNeuralVoice = false; // false = Web Speech API (instant), true = Edge-TTS (higher quality)
let currentAudio = null;    // tracks server-generated audio for stop/mute
let jarvisVoice = null;

// ============================================
// APPROACH 1: WEB SPEECH API (instant, zero backend calls)
// ============================================
function initJarvisVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    const preferredNames = [
        "Google UK English Male",
        "Microsoft Ryan Online (Natural) - English (United Kingdom)",
        "Microsoft George - English (United Kingdom)",
        "Daniel",
        "Arthur"
    ];

    for (const name of preferredNames) {
        const match = voices.find(v => v.name === name);
        if (match) { jarvisVoice = match; return; }
    }

    jarvisVoice = voices.find(v => v.lang === "en-GB" && /male|daniel|george|ryan/i.test(v.name))
               || voices.find(v => v.lang === "en-GB")
               || voices[0];
}
window.speechSynthesis.onvoiceschanged = initJarvisVoice;
initJarvisVoice();

function speakAsJarvis(text) {
    if (!voiceEnabled || !text?.trim()) return;

    window.speechSynthesis.cancel(); // clear any pending queue first

    const utterance = new SpeechSynthesisUtterance(text);
    if (jarvisVoice) utterance.voice = jarvisVoice;

    utterance.pitch = 0.85;
    utterance.rate = 0.95;
    utterance.volume = 1.0;
    utterance.lang = "en-GB";
    utterance.onerror = (e) => console.warn("Speech synthesis error:", e.error);

    window.speechSynthesis.speak(utterance);
}

// ============================================
// APPROACH 2: EDGE-TTS via /speak endpoint (higher quality, async)
// ============================================
async function speakAsJarvisNeural(text) {
    if (!voiceEnabled || !text?.trim()) return;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const audioSrc = `data:audio/${data.audio_format};base64,${data.audio_base64}`;
        currentAudio = new Audio(audioSrc);
        currentAudio.volume = 1.0;

        currentAudio.play().catch(err => {
            // Autoplay blocked until first user interaction — expected on first load
            console.warn("Autoplay blocked, will resume after user interaction:", err);
        });
    } catch (err) {
        console.error("Neural TTS request failed, falling back to Web Speech:", err);
        speakAsJarvis(text); // graceful fallback if backend/edge-tts fails
    }
}

// ============================================
// UNIFIED SPEAK DISPATCHER
// ============================================
function speak(text) {
    if (useNeuralVoice) {
        speakAsJarvisNeural(text);
    } else {
        speakAsJarvis(text);
    }
}

// ============================================
// AUTOPLAY UNLOCK (browsers block audio before user gesture)
// ============================================
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    const primer = new SpeechSynthesisUtterance(" ");
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
    audioUnlocked = true;
}
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
const micBtn = document.getElementById("micBtn");
const status = document.getElementById("listening-status");

let isListening = false;

if (recognition) {

    micBtn.addEventListener("click", () => {

        if (!isListening) {

            recognition.start();

        } else {

            recognition.stop();

        }

    });

    recognition.onstart = () => {

    isListening = true;

    micBtn.classList.add("recording");

    status.innerText = "Listening...";

    document.getElementById("question").disabled = true;

    document.getElementById("answer").innerText = "🎤 Listening...";

};

    recognition.onend = () => {

    isListening = false;

    micBtn.classList.remove("recording");

    status.innerText = "";

    document.getElementById("question").disabled = false;

};

    ;

    recognition.onresult = (event) => {

        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {

            transcript += event.results[i][0].transcript;

        }

        document.getElementById("question").value = transcript;

        if (event.results[event.results.length - 1].isFinal &&
    transcript.trim() !== ""
) {
    askQuestion();
}

    };recognition.onresult = (event) => {

    let transcript = "";

    // Build the full transcript every time
    for (let i = 0; i < event.results.length; i++) {

        transcript += event.results[i][0].transcript;

    }

    document.getElementById("question").value = transcript;

    // Send only once the final result is ready
    if (
        event.results[event.results.length - 1].isFinal &&
        transcript.trim() !== ""
    ) {

        askQuestion();

    }

};

} else {

    micBtn.disabled = true;

    micBtn.innerText = "❌";

}
// ============================================
// TOGGLE CONTROLS
// ============================================
function toggleJarvisVoice() {
    voiceEnabled = !voiceEnabled;
    if (!voiceEnabled) {
        window.speechSynthesis.cancel();
        if (currentAudio) currentAudio.pause();
    }
    const btn = document.getElementById("voice-toggle-btn");
    btn.textContent = voiceEnabled ? "🔊 Voice: ON" : "🔇 Voice: OFF";
    btn.setAttribute("aria-pressed", String(voiceEnabled));
}

function toggleVoiceQuality() {
    useNeuralVoice = !useNeuralVoice;
    const btn = document.getElementById("voice-quality-btn");
    btn.textContent = useNeuralVoice ? "✨ Neural Voice" : "⚡ Instant Voice";
}

// ============================================
// YOUR EXISTING askQuestion() — MODIFIED to speak the answer
// ============================================
async function askQuestion() {
    const question = document.getElementById("question").value;
    const answerDiv = document.getElementById("answer");

    answerDiv.innerText = "Thinking...";

    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: question })
        });

        const data = await response.json();
        answerDiv.innerText = data.answer;

        speak(data.answer); // NEW — speaks the response automatically

    } catch (error) {
        answerDiv.innerText = "Error connecting to backend.";
        console.error(error);
    }
}