// simple blended scoring used in service. Normalize inputs to [0,1]
function normalizeRating(r) {
  if (!r && r !== 0) return 0.5;
  return Math.max(0, Math.min(1, (r - 1) / 4)); // rating scale 1-5 -> 0-1
}

function priceSimilarity(userHistory, place) {
  // placeholder: if you store price in place and user, implement proper similarity
  return 0.5;
}

function tagMatchScore(query, placeTags = []) {
  if (!query) return 0;
  const q = query.toLowerCase();
  if (!placeTags || !placeTags.length) return 0;
  let hits = 0;
  placeTags.forEach(t => {
    if (!t) return;
    if (q.includes(t.toLowerCase())) hits += 1;
  });
  return Math.min(1, hits / Math.max(1, placeTags.length));
}

function blendedScore({ place, distanceKm = 0, userQuery = '', userReviews = [], preferredCategories = [] }) {
  const ratingScore = normalizeRating(place.avg_rating || place.rating || 3);
  const distanceScore = 1 - Math.min(distanceKm / (Number(process.env.MAX_RADIUS_KM || 5)), 1);
  const tagScore = tagMatchScore(userQuery, place.tags || []);
  
  // Category boost: check if place tags overlap with user's preferred categories
  let categoryScore = 0;
  if (preferredCategories.length > 0 && place.tags && place.tags.length > 0) {
    const placeTagsLower = place.tags.map(t => t.toLowerCase());
    const matches = preferredCategories.filter(c => placeTagsLower.includes(c.toLowerCase()));
    categoryScore = Math.min(1, matches.length / Math.max(1, preferredCategories.length)); // Normalize 0-1
  }

  // weights: rating 0.35, distance 0.3, tag 0.2, category 0.15
  const score = 0.35 * ratingScore + 0.3 * distanceScore + 0.2 * tagScore + 0.15 * categoryScore;
  return score;
}

export { blendedScore };
