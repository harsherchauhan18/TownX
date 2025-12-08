import { Router } from 'express';
const router = Router();
import controller from './recommender.controller.js'; // fixed extension
import { processUserQuery } from '../openstreetmap/agent.js';

// POST /api/v1/recommender/recommend
router.post('/recommend', controller.recommend);

// POST /api/v1/recommender/agent-search
router.post('/agent-search', async (req, res) => {
  try {
    const { userQuery, latitude, longitude } = req.body;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: "userQuery is required"
      });
    }

    // Process query through agent
    const agentResult = await processUserQuery(userQuery);

    // Return structured response
    return res.status(200).json({
      success: true,
      agent: {
        userQuery,
        locationTypes: agentResult.locationTypes || [],
        searchKeywords: agentResult.searchKeywords || [],
        searchRadius: agentResult.searchRadius || 5,
        reasoning: agentResult.reasoning || ""
      },
      instructions: {
        message: `I found you're looking for ${agentResult.searchKeywords?.join(", ") || "places"}. Let me show you a map with results.`,
        action: "open_map_search",
        searchQuery: (agentResult.searchKeywords || []).join(" "),
        mapCenter: { latitude: latitude || 28.6139, longitude: longitude || 77.209 }
      }
    });
  } catch (error) {
    console.error("[ERROR] /api/v1/recommender/agent-search:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process query"
    });
  }
});

// optional: health
router.get('/health', (req, res) => res.json({ ok: true }));

export default router;
