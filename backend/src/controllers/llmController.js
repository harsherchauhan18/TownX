import { ChatGroq } from "@langchain/groq";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 512,
  maxRetries: 2,
});

/**
 * Chat endpoint - Process user query and return LLM response
 */
export const chatWithLLM = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    console.log("🤖 Processing LLM request:", message);

    // Build message array with conversation history
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant for TownX, a location-based service and discovery application.

**Your Capabilities:**
1. Help users find places (restaurants, hotels, hospitals, schools, parks, etc.)
2. Provide detailed information about locations, cities, neighborhoods, and points of interest
3. Give recommendations for things to do, places to visit, and local attractions
4. Answer questions about location features, amenities, services, and accessibility
5. Provide context about areas, demographics, safety, cost of living, and local culture
6. Suggest the map feature for real-time location searches

**When users ask about locations:**
- Provide rich, detailed information about the place/area
- Include useful details like: what it's known for, popular attractions, best times to visit, local tips
- Mention nearby areas or related places of interest
- Give context about transportation, accessibility, and practical information
- Be specific and informative while staying concise (3-5 sentences for location info)

**When users ask to find places:**
- Acknowledge their request
- Suggest using the "AI Location Finder" or Map feature
- Briefly mention what they can expect to find

**Tone:** Friendly, knowledgeable, and helpful. Be a local expert and travel guide.`,
      },
      // Add conversation history (last 10 messages for context)
      ...conversationHistory.slice(-10),
      {
        role: "user",
        content: message,
      },
    ];

    // Get response from LLM
    const response = await llm.invoke(messages);

    console.log("✅ Got LLM response");

    res.status(200).json({
      success: true,
      data: {
        message: response.content,
        model: "llama-3.3-70b-versatile",
      },
    });
  } catch (error) {
    console.error("❌ LLM Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process LLM request",
    });
  }
};
