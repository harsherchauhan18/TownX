import { ChatGroq } from "@langchain/groq";
import { StateGraph, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not set in environment variables");
}

/**
 * LangGraph Agent for Place Recommendations
 * Agent takes natural language queries and extracts location types
 */

// Define the state interface
const agentState = {
  userQuery: "",
  locationTypes: [],
  searchKeywords: [],
  searchRadius: 5,
  maxResults: 10,
  reasoning: "",
};

// Initialize LLM
const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 1024,
  maxRetries: 2,
  apiKey: GROQ_API_KEY,
});

/**
 * Node: Extract location types from user query
 */
async function extractLocationTypes(state) {
  try {
    const systemPrompt = `You are an expert at understanding user location queries. 
Your task is to extract what type of places the user is looking for.

Return ONLY a JSON object with NO markdown formatting or code blocks, exactly like this format:
{
  "locationTypes": ["type1", "type2"],
  "searchKeywords": ["keyword1", "keyword2"],
  "reasoning": "brief explanation"
}

Examples:
- "I want coffee nearby" → {"locationTypes": ["cafe"], "searchKeywords": ["coffee", "cafe"], "reasoning": "User wants cafes"}
- "Find me restaurants" → {"locationTypes": ["restaurant"], "searchKeywords": ["restaurant"], "reasoning": "User looking for restaurants"}
- "Pizza places" → {"locationTypes": ["restaurant"], "searchKeywords": ["pizza", "restaurant"], "reasoning": "User looking for pizza restaurants"}
- "Hotels near me" → {"locationTypes": ["hotel"], "searchKeywords": ["hotel"], "reasoning": "User looking for hotels"}
- "Gas stations and supermarkets" → {"locationTypes": ["fuel", "supermarket"], "searchKeywords": ["gas station", "supermarket"], "reasoning": "User looking for multiple types"}

Always provide multiple relevant keywords for better search results.`;

    const response = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Extract location types from this query: "${state.userQuery}"`,
      },
    ]);

    // Parse the response - handle cases where it might have markdown
    let responseText = response.content.trim();
    
    // Remove markdown code blocks if present
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const parsed = JSON.parse(responseText);

    return {
      ...state,
      locationTypes: parsed.locationTypes || [],
      searchKeywords: parsed.searchKeywords || [],
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("❌ Error in extractLocationTypes:", error.message);
    // Fallback: try to extract at least the query as-is
    return {
      ...state,
      locationTypes: [state.userQuery.toLowerCase()],
      searchKeywords: [state.userQuery.toLowerCase()],
      reasoning: "Fallback extraction due to LLM error",
    };
  }
}

/**
 * Node: Validate and refine search parameters
 */
async function validateSearchParams(state) {
  try {
    // Map common location names to OSM categories
    const locationMappings = {
      cafe: ["cafe", "coffee"],
      restaurant: ["restaurant", "food", "pizza", "burger", "chinese", "indian"],
      hotel: ["hotel", "lodging", "accommodation"],
      fuel: ["fuel", "gas", "petrol", "gas_station"],
      supermarket: ["supermarket", "market", "grocery"],
      park: ["park", "garden", "recreation"],
      hospital: ["hospital", "medical", "doctor"],
      pharmacy: ["pharmacy", "chemist"],
      bank: ["bank", "atm"],
      library: ["library"],
      museum: ["museum"],
      cinema: ["cinema", "theater"],
      pub: ["pub", "bar"],
    };

    // Normalize and map location types
    const normalizedTypes = [];
    const allKeywords = [];

    for (const locType of state.locationTypes) {
      const lower = locType.toLowerCase().trim();
      let found = false;

      // Direct match
      if (locationMappings[lower]) {
        normalizedTypes.push(lower);
        allKeywords.push(...locationMappings[lower]);
        found = true;
      }

      // Partial match
      if (!found) {
        for (const [key, aliases] of Object.entries(locationMappings)) {
          if (aliases.some((a) => lower.includes(a) || a.includes(lower))) {
            if (!normalizedTypes.includes(key)) {
              normalizedTypes.push(key);
              allKeywords.push(...aliases);
            }
            found = true;
            break;
          }
        }
      }

      // If no match found, use original (OSM will handle it)
      if (!found) {
        normalizedTypes.push(lower);
        allKeywords.push(lower);
      }
    }

    return {
      ...state,
      locationTypes: normalizedTypes.length > 0 ? normalizedTypes : state.locationTypes,
      searchKeywords: [...new Set([...state.searchKeywords, ...allKeywords])],
    };
  } catch (error) {
    console.error("❌ Error in validateSearchParams:", error.message);
    return state;
  }
}

/**
 * Node: Determine radius based on query
 */
async function determineSearchRadius(state) {
  try {
    const query = state.userQuery.toLowerCase();

    // Detect radius hints from query
    let radius = 5; // default

    if (query.includes("nearby") || query.includes("close")) {
      radius = 2;
    } else if (query.includes("far") || query.includes("around")) {
      radius = 10;
    } else if (query.includes("area") || query.includes("city")) {
      radius = 15;
    }

    return {
      ...state,
      searchRadius: radius,
    };
  } catch (error) {
    console.error("❌ Error in determineSearchRadius:", error.message);
    return state;
  }
}

/**
 * Create and compile the graph
 */
export function createAgentGraph() {
  const workflow = new StateGraph(agentState);

  // Add nodes
  workflow.addNode("extract", extractLocationTypes);
  workflow.addNode("validate", validateSearchParams);
  workflow.addNode("radius", determineSearchRadius);

  // Add edges
  workflow.addEdge(START, "extract");
  workflow.addEdge("extract", "validate");
  workflow.addEdge("validate", "radius");
  workflow.addEdge("radius", END);

  return workflow.compile();
}

/**
 * Process user query through the agent
 */
export async function processUserQuery(userQuery) {
  try {
    if (!userQuery || userQuery.trim().length === 0) {
      return {
        success: false,
        error: "User query cannot be empty",
      };
    }

    const agent = createAgentGraph();

    const initialState = {
      userQuery: userQuery.trim(),
      locationTypes: [],
      searchKeywords: [],
      searchRadius: 5,
      maxResults: 10,
      reasoning: "",
    };

    const result = await agent.invoke(initialState);

    return {
      success: true,
      data: {
        userQuery: result.userQuery,
        locationTypes: result.locationTypes,
        searchKeywords: result.searchKeywords,
        searchRadius: result.searchRadius,
        reasoning: result.reasoning,
      },
    };
  } catch (error) {
    console.error("❌ Error processing user query:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
