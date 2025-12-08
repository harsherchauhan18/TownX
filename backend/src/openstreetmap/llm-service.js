/**
 * LLM Service Module
 * Integrates with Groq API via LangChain to fetch detailed location information
 * Based on the llm_backend implementation
 */

import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

let llm = null;

// Initialize LLM
function initializeLLM() {
  if (!GROQ_API_KEY) {
    console.warn("⚠️  GROQ_API_KEY not found. LLM service will not work. Set it in .env file.");
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
async function getLocationDetails(location) {
  if (!llm) {
    return {
      success: false,
      error: "LLM service not initialized. GROQ_API_KEY not set.",
      details: null,
    };
  }

  try {
    const prompt = `
You are a helpful travel and location information assistant. Provide detailed and useful information about the following place in a structured format.

Place Information:
- Name: ${location.name}
- Category: ${location.category}
- Type: ${location.type || "Not specified"}
- Address: ${location.address ? JSON.stringify(location.address) : "Not specified"}
- Coordinates: ${location.latitude}, ${location.longitude}
- Distance: ${location.distance ? location.distance.toFixed(2) + " km" : "Not specified"}

Please provide:
1. A brief description of this place (2-3 sentences)
2. What services/facilities are typically available here
3. Best time to visit or opening hours (if applicable)
4. Things to know before visiting
5. Why this location is worth visiting

Format your response in a clear, readable way with sections.
    `;

    const aiMsg = await llm.invoke([
      {
        role: "system",
        content:
          "You are a helpful travel assistant that provides detailed information about places and locations. Be informative and concise.",
      },
      { role: "user", content: prompt },
    ]);

    return {
      success: true,
      details: aiMsg.content,
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

Provide 3-5 recommendations for other types of places or activities that would complement a visit to this location. Be specific and practical.
    `;

    const aiMsg = await llm.invoke([
      {
        role: "system",
        content:
          "You are a helpful local travel guide who knows about places and can provide good recommendations.",
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

export { initializeLLM, getLocationDetails, getLocationRecommendations };
