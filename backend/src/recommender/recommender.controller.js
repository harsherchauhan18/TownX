// orchestrates request -> service -> response
import { getRecommendations } from './recommender.service.js';

async function recommend(req, res) {
  try {
    // expected payload: { userId, lat, lon, query, radiusKm, topk }
    const { userId, lat, lon, query } = req.body;
    if (!userId || typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: 'userId, lat and lon required' });
    }

    const result = await getRecommendations({
      userId,
      lat,
      lon,
      query: query || '',
      radiusKm: Number(process.env.MAX_RADIUS_KM || 5),
      topk: Number(req.body.topk || 5)
    });

    return res.json(result);
  } catch (err) {
    console.error('recommend controller error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

export default { recommend };
