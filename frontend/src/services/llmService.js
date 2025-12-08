// LLM Service - Calls backend LLM endpoint
// Backend uses LangChain ChatGroq with llama-3.3-70b-versatile model

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Send a message to the LLM and get a response
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The LLM's response
 */
export async function getChatResponse(userMessage, conversationHistory = []) {
  try {
    console.log("🤖 Sending message to backend LLM...");

    const response = await fetch(`${API_URL}/llm/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: conversationHistory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Backend LLM error:", errorData);
      throw new Error(
        errorData.error || `API error: ${response.status}`
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to get LLM response");
    }

    console.log("✅ Got response from backend LLM");
    return data.data.message;
  } catch (error) {
    console.error("❌ Error calling backend LLM:", error.message);
    
    // Return a fallback response
    if (error.message.includes("Failed to connect") || error.message.includes("fetch")) {
      return "I'm temporarily unavailable - backend connection failed. Try using the map feature instead! 🗺️";
    }
    
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}

/**
 * Stream a chat response (for real-time updates)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Function} onChunk - Callback for each response chunk
 */
export async function streamChatResponse(
  userMessage,
  conversationHistory = [],
  onChunk = () => {}
) {
  try {
    if (!GROQ_API_KEY) {
      throw new Error("Groq API key not configured");
    }

    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant for TownX, a location-based service application. 
You help users find places, get recommendations, and answer questions about locations and services.
Be friendly, concise, and helpful. Keep responses to 2-3 sentences unless asked for more detail.`,
      },
      ...conversationHistory.slice(-10),
      {
        role: "user",
        content: userMessage,
      },
    ];

    console.log("🤖 Starting stream from Groq API...");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile", // Using current available model
        messages: messages,
        temperature: 0.7,
        max_tokens: 512,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || "";
            fullResponse += content;
            onChunk(content);
          } catch (e) {
            // Skip parsing errors for malformed JSON
          }
        }
      }
    }

    console.log("✅ Stream complete");
    return fullResponse;
  } catch (error) {
    console.error("❌ Error in stream:", error.message);
    return null;
  }
}
