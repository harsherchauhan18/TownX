/**
 * business logic:
 * - read recent user activity (reviews)
 * - build a short user text
 * - ask embedding/search service for nearest place IDs
 * - fetch place metadata from DB and geo-filter by radius
 * - compute blended score and return topk
 */

import Review from '../models/review.model.js';
import Place from '../models/place.model.js';
import embedClient from './embedClient.js';
import { get, set } from './cache.js';
import { haversineKm } from '../utils/geo.js'; // if you have this util; else simple implementation below
import { blendedScore } from './score.js';

async function getRecommendations({ userId, lat, lon, query, radiusKm = 5, topk = 5 }) {
  const cacheKey = `rec:${userId}:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusKm}:${query}`;
  const cached = await get(cacheKey);
  if (cached) return cached;

  // 1) get recent activities (user reviews)
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000); // last 90 days
  const reviews = await Review.find({ userId, createdAt: { $gte: since } }).limit(50).lean();

  // 2) build userText (recent placeName + comments + query) & extract categories
  const texts = (reviews || []).map(r => `${r.placeName || ''} ${r.comment || ''}`).slice(-20);
  if (query) texts.unshift(query);
  
  const preferredCategories = [...new Set((reviews || []).map(r => r.category).filter(Boolean))];
  if (preferredCategories.length) {
      texts.push(preferredCategories.join(' '));
  }
  
  const userText = texts.join(' . ') || query || 'nearby';

  // 3) call embed/search microservice to get candidate placeIds
  // embedClient.search returns { ids: [], dists: [] }
  const topKForSearch = 200;
  const embRes = await embedClient.search(userText, topKForSearch);
  let candidateIds = (embRes && embRes.ids) || [];

  if (!candidateIds.length) {
    // fallback: simple popularity query (nearest by rating)
    const fallback = await Place.find({}).sort({ avg_rating: -1 }).limit(100).lean();
    candidateIds = fallback.map(p => p.placeId || p._id);
  }

  // 4) fetch places by placeId
  const places = await Place.find({ placeId: { $in: candidateIds } }).lean();

  // 5) compute distance and filter by radius
  const nearby = places
    .map(p => {
      const pLat = Number(p.lat) || 0;
      const pLon = Number(p.lon) || 0;
      const dist = haversineKm([lat, lon], [pLat, pLon]);
      return { place: p, dist };
    })
    .filter(x => x.dist <= radiusKm);

  // 6) compute blended score and sort
  const scored = nearby.map(({ place, dist }) => {
    const score = blendedScore({
      place,
      distanceKm: dist,
      userQuery: query,
      userQuery: query,
      userReviews: reviews,
      preferredCategories
    });
    return { place, dist, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const out = scored.slice(0, topk).map(s => ({
    placeId: s.place.placeId || s.place._id,
    name: s.place.name || s.place.placeName || '',
    lat: s.place.lat,
    lon: s.place.lon,
    score: Number(s.score.toFixed(4)),
    distanceKm: Number(s.dist.toFixed(3)),
    tags: s.place.tags || [],
    avg_rating: s.place.avg_rating || s.place.rating || null
  }));

  // 7) cache & return
  await set(cacheKey, out, 300); // 5 min
  return out;
}

export { getRecommendations };
