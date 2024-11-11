document.getElementById("send-button").addEventListener("click", sendMessage);
        document.getElementById("user-message").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });

        async function sendMessage() {
            const userMessage = document.getElementById("user-message").value.trim();
            if (!userMessage) return;

            addMessage("", userMessage, "user-message");
            document.getElementById("user-message").value = "";

            showLoadingAnimation();

            try {
                const response = await fetch("http://127.0.0.1:5000/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message: userMessage })
                });

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();
                hideLoadingAnimation();
                addMessage("", data.response, "bot-response");

            } catch (error) {
                console.error("Error:", error);
                hideLoadingAnimation();
                addMessage("Error", "Failed to connect to Gemma.", "bot-response");
            }
        }

        function addMessage(sender, message, className) {
            const chatBox = document.getElementById("chat-box");
            const messageElement = document.createElement("div");
            messageElement.classList.add("message", className);

            const avatar = document.createElement("img");
            avatar.classList.add("message-avatar");
            avatar.src = className === "user-message" ? "user.png" : "chatbot.png";

            const messageBubble = document.createElement("div");
            messageBubble.classList.add("message-bubble");
            messageBubble.innerHTML = `<strong>${sender}</strong> ${message}`;

            // Append avatar first, then message bubble
            messageElement.appendChild(avatar);
            messageElement.appendChild(messageBubble);
            chatBox.appendChild(messageElement);

            chatBox.scrollTop = chatBox.scrollHeight;
        }


        function showLoadingAnimation() {
            const chatBox = document.getElementById("chat-box");

            const loadingElement = document.createElement("div");
            loadingElement.classList.add("message", "bot-response");
            loadingElement.setAttribute("id", "loading-animation");
            loadingElement.innerHTML = `
                <div class="loading">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            `;

            chatBox.appendChild(loadingElement);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function hideLoadingAnimation() {
            const loadingElement = document.getElementById("loading-animation");
            if (loadingElement) {
                loadingElement.remove();
            }
        }