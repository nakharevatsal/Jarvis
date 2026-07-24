const button = document.getElementById("askBtn");

button.addEventListener("click", askQuestion);

async function askQuestion() {

    const question =
        document.getElementById("question").value;

    const answerDiv =
        document.getElementById("answer");

    answerDiv.innerText = "Thinking...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/chat",
            {

                method: "POST",

                headers: {
                    "Content-Type":"application/json"
                },

                body: JSON.stringify({
                    question: question
                })

            }
        );

        const data = await response.json();

        answerDiv.innerText = data.answer;

    }

    catch(error){

        answerDiv.innerText =
            "Error connecting to backend.";

        console.error(error);

    }

}