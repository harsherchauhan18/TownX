// Browser-safe keyword detector (no Node APIs)
const locationTypeKeywords = {
  // Food & Dining
  restaurant: ["restaurant", "food", "diner", "eatery", "dining", "lunch", "dinner", "breakfast", "cuisine", "eat", "place to eat"],
  cafe: ["cafe", "coffee", "tea shop", "coffee shop", "espresso", "barista", "cappuccino", "latte", "brew"],
  pizza: ["pizza", "pizzeria"],
  burger: ["burger", "hamburger", "fast food"],
  sushi: ["sushi", "japanese", "ramen"],
  chinese: ["chinese", "asian", "noodles"],
  bakery: ["bakery", "bread", "cake", "pastry", "donut"],
  
  // Accommodation
  hotel: ["hotel", "accommodation", "stay", "lodging", "inn", "motel", "resort", "bed", "hostel", "guest house"],
  
  // Healthcare
  pharmacy: ["pharmacy", "drugstore", "chemist", "medical", "medicine", "drug", "pills", "medicines"],
  hospital: ["hospital", "clinic", "medical center", "doctor", "healthcare", "emergency", "health", "physician", "urgent care"],
  
  // Shopping
  supermarket: ["supermarket", "grocery", "market", "shopping", "store", "mall", "shop", "retail", "bazaar"],
  clothing: ["clothing", "apparel", "fashion", "dress", "garments"],
  electronics: ["electronics", "mobile", "phone", "computer", "gadget"],
  bookstore: ["bookstore", "books", "stationery"],
  
  // Recreation & Nature
  park: ["park", "garden", "green space", "nature", "recreation", "outdoor", "playground", "picnic", "nature reserve"],
  gym: ["gym", "fitness", "exercise", "workout", "sports", "training", "yoga", "zumba"],
  pool: ["pool", "swimming", "aquatic"],
  
  // Education
  school: ["school", "college", "university", "education", "student", "campus", "academic", "institute"],
  
  // Culture & Entertainment
  museum: ["museum", "art gallery", "cultural", "exhibition", "gallery", "art"],
  cinema: ["cinema", "movie", "theater", "film", "movie theatre", "multiplex"],
  pub: ["pub", "bar", "nightclub", "drinks", "alcohol", "beer", "club", "lounge"],
  
  // Transportation & Fuel
  fuel: ["fuel", "gas station", "petrol", "diesel", "charging station", "gas", "petrol pump"],
  transit: ["bus", "metro", "train", "station", "transport", "railway", "airport", "bus stop"],
  parking: ["parking", "car park", "parking lot"],
  
  // Finance & Services
  bank: ["bank", "atm", "financial", "money", "cash", "banking"],
  atm: ["atm", "cash", "withdrawal"],
  
  // Library & Reading
  library: ["library", "book", "reading", "educational", "books", "study"],
  
  // Other Common Places
  salon: ["salon", "barber", "haircut", "spa"],
  laundry: ["laundry", "laundromat"],
  post: ["post office", "postal", "mail"],
};

function simpleDetect(query) {
  const text = (query || "").toLowerCase();
  for (const [type, keywords] of Object.entries(locationTypeKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return { type, confidence: 0.9, method: "keyword" };
    }
  }
  return { type: "general", confidence: 0.2, method: "fallback" };
}

export async function detectLocationType(userQuery) {
  const result = simpleDetect(userQuery);
  return {
    success: true,
    data: {
      userQuery,
      detectedLocationType: result.type,
      validatedLocationType: result.type,
      confidence: result.confidence,
      isValid: result.type !== "general",
      method: result.method,
    },
  };
}
