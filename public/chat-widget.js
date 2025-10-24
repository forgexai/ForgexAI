(function () {
  "use strict";

  // Get the deployment ID from the script tag
  const scriptTag = document.currentScript;
  const deploymentId = scriptTag.getAttribute("data-deployment-id");

  if (!deploymentId) {
    console.error("ForgexAI Chat Widget: No deployment ID provided");
    return;
  }

  // Widget configuration
  const config = {
    apiUrl: "https://forgex-ai-backend.vercel.app",
    deploymentId: deploymentId,
    position: "bottom-right", // bottom-right, bottom-left, top-right, top-left
    theme: "light", // light, dark
    width: "350px",
    height: "500px",
  };

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
            <div id="forgexai-chat-widget" style="
                position: fixed;
                ${
                  config.position.includes("bottom")
                    ? "bottom: 20px;"
                    : "top: 20px;"
                }
                ${
                  config.position.includes("right")
                    ? "right: 20px;"
                    : "left: 20px;"
                }
                width: ${config.width};
                height: ${config.height};
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: none;
            ">
                <div style="
                    background: ${
                      config.theme === "dark" ? "#1a1a1a" : "#ffffff"
                    };
                    border: 1px solid ${
                      config.theme === "dark" ? "#333" : "#e1e5e9"
                    };
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px;
                        border-radius: 12px 12px 0 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="font-weight: 600; font-size: 16px;">
                            ForgexAI Assistant
                        </div>
                        <button id="forgexai-close-btn" style="
                            background: none;
                            border: none;
                            color: white;
                            font-size: 18px;
                            cursor: pointer;
                            padding: 0;
                            width: 24px;
                            height: 24px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">×</button>
                    </div>
                    
                    <!-- Messages Container -->
                    <div id="forgexai-messages" style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 15px;
                        background: ${
                          config.theme === "dark" ? "#2a2a2a" : "#f8f9fa"
                        };
                    ">
                        <div style="
                            background: ${
                              config.theme === "dark" ? "#333" : "#e9ecef"
                            };
                            color: ${config.theme === "dark" ? "#fff" : "#333"};
                            padding: 10px;
                            border-radius: 8px;
                            margin-bottom: 10px;
                            font-size: 14px;
                        ">
                            Hello! How can I assist you today?
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="
                        padding: 15px;
                        border-top: 1px solid ${
                          config.theme === "dark" ? "#333" : "#e1e5e9"
                        };
                        background: ${
                          config.theme === "dark" ? "#1a1a1a" : "#ffffff"
                        };
                        border-radius: 0 0 12px 12px;
                    ">
                        <div style="display: flex; gap: 8px;">
                            <input 
                                id="forgexai-input" 
                                type="text" 
                                placeholder="Type your message..."
                                style="
                                    flex: 1;
                                    padding: 10px;
                                    border: 1px solid ${
                                      config.theme === "dark"
                                        ? "#333"
                                        : "#e1e5e9"
                                    };
                                    border-radius: 6px;
                                    font-size: 14px;
                                    outline: none;
                                    background: ${
                                      config.theme === "dark"
                                        ? "#333"
                                        : "#ffffff"
                                    };
                                    color: ${
                                      config.theme === "dark" ? "#fff" : "#333"
                                    };
                                "
                            />
                            <button id="forgexai-send-btn" style="
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: 500;
                            ">Send</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Toggle Button -->
            <button id="forgexai-toggle-btn" style="
                position: fixed;
                ${
                  config.position.includes("bottom")
                    ? "bottom: 20px;"
                    : "top: 20px;"
                }
                ${
                  config.position.includes("right")
                    ? "right: 20px;"
                    : "left: 20px;"
                }
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                font-size: 24px;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">💬</button>
        `;

    document.body.insertAdjacentHTML("beforeend", widgetHTML);
  }

  // Add event listeners
  function addEventListeners() {
    const toggleBtn = document.getElementById("forgexai-toggle-btn");
    const widget = document.getElementById("forgexai-chat-widget");
    const closeBtn = document.getElementById("forgexai-close-btn");
    const sendBtn = document.getElementById("forgexai-send-btn");
    const input = document.getElementById("forgexai-input");

    toggleBtn.addEventListener("click", () => {
      if (widget.style.display === "none" || !widget.style.display) {
        widget.style.display = "block";
        toggleBtn.style.display = "none";
      }
    });

    closeBtn.addEventListener("click", () => {
      widget.style.display = "none";
      toggleBtn.style.display = "flex";
    });

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  // Send message function
  async function sendMessage() {
    const input = document.getElementById("forgexai-input");
    const messagesContainer = document.getElementById("forgexai-messages");

    const message = input.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, "user");
    input.value = "";

    // Add typing indicator
    const typingElement = addMessageToChat("Typing...", "assistant", true);

    try {
      const response = await fetch(
        `${config.apiUrl}/api/deployments/web/${config.deploymentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            userId: "widget-user-" + Date.now(),
            sessionId: "widget-session-" + config.deploymentId,
          }),
        }
      );

      const data = await response.json();

      // Remove typing indicator
      typingElement.remove();

      if (data.success && data.message) {
        addMessageToChat(data.message, "assistant");
      } else {
        addMessageToChat(
          "Sorry, I encountered an error. Please try again.",
          "assistant"
        );
      }
    } catch (error) {
      console.error("Chat widget error:", error);
      typingElement.remove();
      addMessageToChat(
        "Sorry, I encountered an error. Please try again.",
        "assistant"
      );
    }
  }

  // Add message to chat
  function addMessageToChat(message, role, isTyping = false) {
    const messagesContainer = document.getElementById("forgexai-messages");

    const messageElement = document.createElement("div");
    messageElement.style.cssText = `
            background: ${
              role === "user"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : config.theme === "dark"
                ? "#333"
                : "#e9ecef"
            };
            color: ${
              role === "user"
                ? "#fff"
                : config.theme === "dark"
                ? "#fff"
                : "#333"
            };
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 14px;
            ${role === "user" ? "margin-left: 20px;" : "margin-right: 20px;"}
            ${isTyping ? "opacity: 0.7;" : ""}
        `;

    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageElement;
  }

  // Initialize widget when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      createWidget();
      addEventListeners();
    });
  } else {
    createWidget();
    addEventListeners();
  }
})();
