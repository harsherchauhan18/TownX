/**
 * LLM Service Module (CommonJS)
 * Integrates with Groq API via LangChain to fetch detailed location information
 * Based on the llm_backend implementation
 */

const { ChatGroq } = require("@langchain/groq");
require("dotenv").config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
let llm = null;

// Initialize LLM
function initializeLLM() {
  if (!GROQ_API_KEY) {
    console.warn(
      "⚠️  GROQ_API_KEY not found. LLM service will not work. Set it in .env file."
    );
    return false;
  }

  try {
    llm = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 500,
      maxRetries: 2,
      apiKey: GROQ_API_KEY,
    });
    console.log("✅ LLM Service initialized successfully");
    return true;
  } catch (err) {
    console.error("❌ Failed to initialize LLM:", err);
    return false;
  }
}

/**
 * Get detailed information about a location using LLM
 * @param {Object} location - Location object with name, category, type, address, etc.
 * @returns {Promise<Object>} - Detailed information about the location
 */
async function getLocationDetails(location, options = {}) {
  if (!llm) {
    return {
      success: false,
      error: "LLM service not initialized. GROQ_API_KEY not set.",
      details: null,
    };
  }

  try {
    const feedbackSummary = options.feedbackSummary || "No prior feedback available.";
    const addressStr =
      location.address && typeof location.address === "object"
        ? Object.entries(location.address)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
        : "Not specified";

    const prompt = `
You are a helpful travel and location information assistant. Provide detailed and useful information about the following place in a structured format.

Place Information:
- Name: ${location.name}
- Category: ${location.category}
- Type: ${location.type || "Not specified"}
- Address: ${addressStr}
- Coordinates: ${location.latitude}, ${location.longitude}
- Distance: ${location.distance ? location.distance.toFixed(2) + " km" : "Not specified"}

Please provide (in exactly this format):

📍 ABOUT THIS PLACE:
Brief description (1-2 sentences)

🏢 SERVICES & FACILITIES:
List key services/facilities available here

🕐 HOURS & BEST TIME:
Typical opening hours and best time to visit

ℹ️ THINGS TO KNOW:
Important information before visiting

⭐ WHY VISIT:
Why this location is worth visiting

🗣️ WHAT VISITORS SAID (from stored feedback and reviews):
${feedbackSummary}

Keep it concise and practical.
    `;

    const aiMsg = await llm.invoke([
      {
        role: "system",
        content:
          "You are a helpful travel assistant that provides detailed, accurate information about places and locations. Be informative, concise, and practical. Format your response clearly with the sections requested.",
      },
      { role: "user", content: prompt },
    ]);

    // Only return serializable data
    let details = aiMsg && typeof aiMsg.content === 'string' ? aiMsg.content : '';
    return {
      success: true,
      details,
      location: location.name,
      category: location.category,
    };
  } catch (err) {
    console.error("❌ Error fetching location details from LLM:", err);
    return {
      success: false,
      error: `Failed to fetch details: ${err.message}`,
      details: null,
    };
  }
}

async function filterPlacesWithLLM({ places, filters }) {
  if (!llm) {
    return { success: false, error: "LLM service not initialized" };
  }

  const limited = (places || []).slice(0, 60);
  const filterText = JSON.stringify(filters || {});
  const placeText = JSON.stringify(
    limited.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      type: p.type,
      distance: p.distance,
      importance: p.importance,
      avgRating: p.avgRating,
      extratags: p.extratags || {},
    }))
  );

  const prompt = `You are assisting with filtering and ranking places based on user preferences.
User filters (JSON): ${filterText}
Places (JSON array): ${placeText}

Task:
1) Select the places that best satisfy the filters (query/cuisine keywords, price bucket budget/moderate/expensive, minRating 0-5, availability hints, features wifi/parking/delivery/vegetarian). Use category/type/name/extratags text to infer cuisine (e.g., "Chinese", "Sushi", "Italian").
2) If data is missing, make a best-effort guess from category/type/extratags; do NOT discard everything for missing data.
3) Return ONLY a JSON object: {"placeIds": ["id1", "id2", ...], "reason": "short rationale"}. Place IDs sorted best to worst. Keep at most 30 results.
Respond with valid JSON only.`;

  try {
    const aiMsg = await llm.invoke([
      {
        role: "system",
        content:
          "You are a precise JSON-only assistant. Always return valid JSON with keys placeIds and reason.",
      },
      { role: "user", content: prompt },
    ]);

    const text = aiMsg && typeof aiMsg.content === "string" ? aiMsg.content.trim() : "";
    const parsed = JSON.parse(text);
    const placeIds = Array.isArray(parsed.placeIds) ? parsed.placeIds : [];
    return { success: true, placeIds, reason: parsed.reason || "" };
  } catch (err) {
    console.error("❌ Error filtering places with LLM:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get recommendations for nearby places based on a location
 * @param {Object} location - Location object
 * @returns {Promise<Object>} - Recommendations
 */
async function getLocationRecommendations(location) {
  if (!llm) {
    return {
      success: false,
      error: "LLM service not initialized",
      recommendations: null,
    };
  }

  try {
    const prompt = `
You are a local travel expert. Based on this place, suggest similar or complementary places to visit nearby:

Place: ${location.name} (${location.category})
Category: ${location.category}

Provide 3-5 recommendations for other types of places or activities that would complement a visit to this location. Be specific and practical. Format as a numbered list.
    `;

    const aiMsg = await llm.invoke([
      {
        role: "system",
        content:
          "You are a helpful local travel guide who knows about places and can provide good recommendations. Provide practical suggestions.",
      },
      { role: "user", content: prompt },
    ]);

    return {
      success: true,
      recommendations: aiMsg.content,
      location: location.name,
    };
  } catch (err) {
    console.error("❌ Error fetching recommendations from LLM:", err);
    return {
      success: false,
      error: `Failed to fetch recommendations: ${err.message}`,
      recommendations: null,
    };
  }
}

module.exports = {
  initializeLLM,
  getLocationDetails,
  getLocationRecommendations,
  filterPlacesWithLLM,
};
