require("dotenv").config();
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Review = require("./models/review");
const FeedbackModel = require("./models/feedback");
const SearchTrend = require("./models/searchTrend");
const { initializeLLM, getLocationDetails, getLocationRecommendations, filterPlacesWithLLM } = require("./llm-service-commonjs");
const { processUserQuery } = require("./agent-commonjs");
const app = express();
const PORT = 4000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.warn("⚠️  MONGO_URI not set. MongoDB features will be disabled.");
} else {
  mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));
}

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Data file paths
const PREFERENCES_FILE = path.join(__dirname, "data", "user_preferences.json");
const SAVED_PLACES_FILE = path.join(__dirname, "data", "saved_places.json");
const FEEDBACK_FILE = path.join(__dirname, "data", "feedback.json");

// Initialize preferences file if it doesn't exist
function initPreferencesFile() {
  const dir = path.dirname(PREFERENCES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(PREFERENCES_FILE)) {
    const defaultData = {
      users: [{
        userId: "default_user",
        preferences: {
          favoriteCategories: [],
          visitedPlaces: [],
          savedPlaces: [],
          searchHistory: [],
          ratings: [],
          feedback: [],
          detailedFeedback: [],
          suggestionRatings: []
        },
        settings: {
          preferredRadius: 5,
          preferredTransport: "car",
          maxResults: 10
        }
      }],
      suggestions: {
        categoryWeights: {},
        popularPlaces: []
      }
    };
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(defaultData, null, 2));
  }
}

// Load user preferences
function loadPreferences() {
  try {
    const data = fs.readFileSync(PREFERENCES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[ERROR] Loading preferences:", err.message);
    return null;
  }
}

// Save user preferences
function savePreferences(data) {
  try {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[ERROR] Saving preferences:", err.message);
    return false;
  }
}

// ========== SAVED PLACES FILE MANAGEMENT ==========

// Initialize saved places file
function initSavedPlacesFile() {
  const dir = path.dirname(SAVED_PLACES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(SAVED_PLACES_FILE)) {
    const defaultData = {
      savedPlaces: [{
        userId: "default_user",
        places: []
      }],
      metadata: {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        totalSavedPlaces: 0
      }
    };
    fs.writeFileSync(SAVED_PLACES_FILE, JSON.stringify(defaultData, null, 2));
  }
}

// Load saved places
function loadSavedPlaces() {
  try {
    const data = fs.readFileSync(SAVED_PLACES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[ERROR] Loading saved places:", err.message);
    return null;
  }
}

// Save saved places
function saveSavedPlaces(data) {
  try {
    data.metadata.lastUpdated = new Date().toISOString();
    data.metadata.totalSavedPlaces = data.savedPlaces.reduce((sum, user) => sum + user.places.length, 0);
    fs.writeFileSync(SAVED_PLACES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[ERROR] Saving saved places:", err.message);
    return false;
  }
}

// ========== FEEDBACK FILE MANAGEMENT ==========

// Initialize feedback file
function initFeedbackFile() {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(FEEDBACK_FILE)) {
    const defaultData = {
      feedback: [{
        userId: "default_user",
        feedback: []
      }],
      metadata: {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        totalFeedback: 0
      }
    };
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(defaultData, null, 2));
  }
}

// Load feedback
function loadFeedback() {
  try {
    const data = fs.readFileSync(FEEDBACK_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[ERROR] Loading feedback:", err.message);
    return null;
  }
}

// Save feedback
function saveFeedback(data) {
  try {
    data.metadata.lastUpdated = new Date().toISOString();
    data.metadata.totalFeedback = data.feedback.reduce((sum, user) => sum + user.feedback.length, 0);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[ERROR] Saving feedback:", err.message);
    return false;
  }
}

// Get or create user profile
function getUserProfile(userId = "default_user") {
  const data = loadPreferences();
  if (!data) return null;
  
  let user = data.users.find(u => u.userId === userId);
  if (!user) {
    user = {
      userId: userId,
      preferences: {
        favoriteCategories: [],
        visitedPlaces: [],
        savedPlaces: [],
        searchHistory: [],
        ratings: [],
        feedback: [],
        detailedFeedback: [],
        suggestionRatings: []
      },
      settings: {
        preferredRadius: 5,
        preferredTransport: "car",
        maxResults: 10
      }
    };
    data.users.push(user);
    savePreferences(data);
  }
  return user;
}

// Calculate suggestion score based on user preferences
function calculateSuggestionScore(place, userPreferences) {
  let score = 0;
  
  // Category preference weight
  const categoryCount = userPreferences.favoriteCategories.filter(
    cat => cat === place.category
  ).length;
  score += categoryCount * 5;
  
  // Type preference
  const searchHistory = userPreferences.searchHistory || [];
  const typeMatches = searchHistory.filter(
    search => search.toLowerCase().includes(place.type?.toLowerCase() || '')
  ).length;
  score += typeMatches * 3;
  
  // Visited places similarity
  const visitedCategories = userPreferences.visitedPlaces.map(p => p.category);
  if (visitedCategories.includes(place.category)) {
    score += 2;
  }
  
  // Rating-based boost
  const rating = userPreferences.ratings.find(r => r.placeId === place.id);
  if (rating) {
    score += rating.score * 2;
  }
  
  // Importance from OSM
  if (place.importance) {
    score += place.importance * 10;
  }
  
  return score;
}

// Initialize all data files
initPreferencesFile();
initSavedPlacesFile();
initFeedbackFile();
console.log("✅ Server initialized");

// Initialize LLM Service
const llmInitialized = initializeLLM();
if (!llmInitialized) {
  console.warn("⚠️  LLM service disabled. Set GROQ_API_KEY in .env file to enable detailed location information.");
}

// Make HTTPS request to Nominatim
function fetchNominatim(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "nominatim.openstreetmap.org",
      path: path,
      method: "GET",
      timeout: 10000,
      headers: {
        "User-Agent": "PlaceFinder/1.0"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Invalid JSON"));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });

    req.end();
  });
}

// ========== SUGGESTION SYSTEM API ENDPOINTS ==========

// Get personalized suggestions
app.post("/api/get-suggestions", async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: "Missing location" });
    }
    
    const user = getUserProfile(userId || "default_user");
    if (!user) {
      return res.status(500).json({ success: false, error: "Cannot load user profile" });
    }
    
    // Generate suggestions based on user preferences
    const suggestions = [];
    const prefs = user.preferences;
    
    // Suggest based on favorite categories
    for (const category of prefs.favoriteCategories.slice(0, 3)) {
      suggestions.push({
        type: "favorite_category",
        query: category,
        reason: `You often search for ${category}`
      });
    }
    
    // Suggest based on search history patterns
    const recentSearches = prefs.searchHistory.slice(-5);
    const uniqueSearches = [...new Set(recentSearches)];
    for (const search of uniqueSearches.slice(0, 2)) {
      suggestions.push({
        type: "recent_search",
        query: search,
        reason: `Based on your recent search`
      });
    }
    
    // Suggest similar to saved places
    const savedCategories = [...new Set(prefs.savedPlaces.map(p => p.category))];
    for (const cat of savedCategories.slice(0, 2)) {
      suggestions.push({
        type: "saved_similar",
        query: cat,
        reason: `Similar to your saved places`
      });
    }
    
    // Popular suggestions if no preferences
    if (suggestions.length === 0) {
      suggestions.push(
        { type: "popular", query: "restaurants", reason: "Popular nearby" },
        { type: "popular", query: "cafes", reason: "Popular nearby" },
        { type: "popular", query: "hotels", reason: "Popular nearby" }
      );
    }
    
    res.json({ success: true, suggestions: suggestions.slice(0, 5) });
  } catch (err) {
    console.error("[ERROR] /api/get-suggestions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save place to favorites
app.post("/api/save-place", (req, res) => {
  try {
    const { userId, place } = req.body;
    const uid = userId || "default_user";
    
    if (!place) {
      return res.status(400).json({ success: false, error: "Missing place data" });
    }
    
    // Update user preferences
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    let user = data.users.find(u => u.userId === uid);
    if (!user) {
      // Create new user if doesn't exist
      user = {
        userId: uid,
        preferences: {
          favoriteCategories: [],
          visitedPlaces: [],
          savedPlaces: [],
          searchHistory: [],
          ratings: [],
          feedback: [],
          detailedFeedback: [],
          suggestionRatings: []
        },
        settings: {}
      };
      data.users.push(user);
    }
    
    // Add to saved places if not already saved
    const exists = user.preferences.savedPlaces.find(p => p.id === place.id);
    if (!exists) {
      const placeObj = {
        id: place.id,
        name: place.name,
        category: place.category,
        type: place.type,
        latitude: place.latitude,
        longitude: place.longitude,
        savedAt: new Date().toISOString()
      };
      
      user.preferences.savedPlaces.push(placeObj);
      
      // Update category preferences
      if (!user.preferences.favoriteCategories.includes(place.category)) {
        user.preferences.favoriteCategories.push(place.category);
      }
      
      savePreferences(data);
      
      // Also save to dedicated saved_places.json
      const savedData = loadSavedPlaces();
      if (savedData) {
        let savedUser = savedData.savedPlaces.find(u => u.userId === uid);
        if (!savedUser) {
          savedUser = { userId: uid, places: [] };
          savedData.savedPlaces.push(savedUser);
        }
        
        // Add with additional metadata
        savedUser.places.push({
          ...placeObj,
          address: place.address || '',
          displayName: place.displayName || '',
          osmType: place.osmType || 'node',
          importance: place.importance || 0
        });
        
        saveSavedPlaces(savedData);
      }
    }
    
    res.json({ success: true, savedPlaces: user.preferences.savedPlaces });
  } catch (err) {
    console.error("[ERROR] /api/save-place:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unsave a place
app.post("/api/unsave-place", (req, res) => {
  try {
    const { userId, placeId } = req.body;
    const uid = userId || "default_user";
    
    if (!placeId) {
      return res.status(400).json({ success: false, error: "Missing placeId" });
    }
    
    // Remove from user preferences
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === uid);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Remove from saved places
    user.preferences.savedPlaces = user.preferences.savedPlaces.filter(p => p.id !== placeId);
    savePreferences(data);
    
    // Also remove from dedicated saved_places.json
    const savedData = loadSavedPlaces();
    if (savedData) {
      const savedUser = savedData.savedPlaces.find(u => u.userId === uid);
      if (savedUser) {
        savedUser.places = savedUser.places.filter(p => p.id !== placeId);
        saveSavedPlaces(savedData);
      }
    }
    
    res.json({ success: true, savedPlaces: user.preferences.savedPlaces });
  } catch (err) {
    console.error("[ERROR] /api/unsave-place:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rate a place
app.post("/api/rate-place", (req, res) => {
  try {
    const { userId, placeId, score } = req.body;
    
    if (!placeId || score === undefined) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }
    
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === (userId || "default_user"));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Update or add rating
    const existingRating = user.preferences.ratings.find(r => r.placeId === placeId);
    if (existingRating) {
      existingRating.score = score;
      existingRating.updatedAt = new Date().toISOString();
    } else {
      user.preferences.ratings.push({
        placeId: placeId,
        score: score,
        createdAt: new Date().toISOString()
      });
    }
    
    savePreferences(data);
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] /api/rate-place:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Track search history
app.post("/api/track-search", async (req, res) => {
  try {
    const { userId, query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: "Missing query" });
    }
    
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === (userId || "default_user"));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Add to search history (keep last 50)
    user.preferences.searchHistory.push(query);
    if (user.preferences.searchHistory.length > 50) {
      user.preferences.searchHistory.shift();
    }
    
    savePreferences(data);

    // Track trending searches in MongoDB
    await trackSearchQuery(query);

    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] /api/track-search:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Track search query to MongoDB
async function trackSearchQuery(query, category = null) {
  if (!MONGO_URI || !query) return;
  try {
    const trend = await SearchTrend.findOneAndUpdate(
      { query: query.toLowerCase().trim(), category },
      { $inc: { count: 1 }, lastSearchedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[TREND] Tracked search: "${query}" (count: ${trend.count})`);
  } catch (err) {
    console.error("[TREND] Error tracking search:", err.message);
  }
}

// Get trending searches
app.get("/api/trending-searches", async (req, res) => {
  try {
    if (!MONGO_URI) {
      return res.status(503).json({ success: false, error: "MongoDB not configured" });
    }

    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const trends = await SearchTrend.find({})
      .sort({ count: -1, lastSearchedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      trending: trends.map(t => ({ query: t.query, count: t.count, lastSearched: t.lastSearchedAt }))
    });
  } catch (err) {
    console.error("[ERROR] /api/trending-searches:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark place as visited
app.post("/api/mark-visited", (req, res) => {
  try {
    const { userId, place } = req.body;
    
    if (!place) {
      return res.status(400).json({ success: false, error: "Missing place data" });
    }
    
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === (userId || "default_user"));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Add to visited places
    user.preferences.visitedPlaces.push({
      id: place.id,
      name: place.name,
      category: place.category,
      visitedAt: new Date().toISOString()
    });
    
    // Update category preferences
    if (!user.preferences.favoriteCategories.includes(place.category)) {
      user.preferences.favoriteCategories.push(place.category);
    }
    
    savePreferences(data);
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] /api/mark-visited:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user preferences
app.get("/api/user-preferences/:userId", (req, res) => {
  try {
    const userId = req.params.userId || "default_user";
    const user = getUserProfile(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    res.json({ success: true, preferences: user.preferences, settings: user.settings });
  } catch (err) {
    console.error("[ERROR] /api/user-preferences:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get default user preferences
app.get("/api/user-preferences", (req, res) => {
  try {
    const user = getUserProfile("default_user");
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    res.json({ success: true, preferences: user.preferences, settings: user.settings });
  } catch (err) {
    console.error("[ERROR] /api/user-preferences:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== FEEDBACK SYSTEM ENDPOINTS ==========

// Submit feedback (thumbs up/down)
app.post("/api/feedback", (req, res) => {
  try {
    const { userId, placeId, placeName, category, feedbackType, timestamp } = req.body;
    const uid = userId || "default_user";
    
    if (!placeId || !feedbackType) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }
    
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === uid);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Initialize feedback array if not exists
    if (!user.preferences.feedback) {
      user.preferences.feedback = [];
    }
    
    // Add feedback
    const feedbackObj = {
      placeId,
      placeName,
      category,
      feedbackType,
      timestamp: timestamp || new Date().toISOString()
    };
    
    user.preferences.feedback.push(feedbackObj);
    
    // Adjust category weights based on feedback
    if (feedbackType === 'positive') {
      if (!user.preferences.favoriteCategories.includes(category)) {
        user.preferences.favoriteCategories.push(category);
      }
    } else if (feedbackType === 'negative') {
      // Remove from favorites if too many negative feedbacks
      const negativeFeedbacks = user.preferences.feedback.filter(
        f => f.category === category && f.feedbackType === 'negative'
      ).length;
      
      if (negativeFeedbacks >= 3) {
        user.preferences.favoriteCategories = user.preferences.favoriteCategories.filter(
          c => c !== category
        );
      }
    }
    
    savePreferences(data);

    // Persist feedback to MongoDB for long-term storage
    if (MONGO_URI) {
      FeedbackModel.create({
        userId: uid,
        placeId,
        placeName,
        category,
        feedbackType,
        comment: "",
      }).catch((err) => console.error("[Mongo] Failed to store feedback:", err.message));
    }
    
    console.log(`[FEEDBACK] ${feedbackType} for ${placeName} (${category})`);
    
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] /api/feedback:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a review for a place
app.post("/api/reviews", async (req, res) => {
  try {
    const { userId, placeId, placeName, category, rating, comment } = req.body;
    if (!MONGO_URI) {
      return res.status(503).json({ success: false, error: "MongoDB not configured" });
    }
    if (!placeId || !placeName || !rating) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const review = await Review.create({
      userId: userId || "anonymous",
      placeId,
      placeName,
      category,
      rating,
      comment: comment || "",
    });

    res.json({ success: true, review });
  } catch (err) {
    console.error("[ERROR] /api/reviews:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get reviews for a place
app.get("/api/reviews/:placeId", async (req, res) => {
  try {
    if (!MONGO_URI) {
      return res.status(503).json({ success: false, error: "MongoDB not configured" });
    }
    const { placeId } = req.params;
    const reviews = await Review.find({ placeId }).sort({ createdAt: -1 }).lean();
    const avgRating =
      reviews.length === 0
        ? null
        : reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;

    res.json({ success: true, reviews, avgRating });
  } catch (err) {
    console.error("[ERROR] /api/reviews/:placeId:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send location details via email
app.post("/api/send-location-email", async (req, res) => {
  try {
    const { to, subject, locationName, category, latitude, longitude, distance, reviews } = req.body;
    
    if (!to || !locationName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Import nodemailer directly (no need for sendmail module)
    const nodemailer = (await import('nodemailer')).default;
    const dotenv = (await import('dotenv')).default;
    
    // Load environment variables
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    
    // Check if email credentials are available
    if (!process.env.USER_EMAIL || !process.env.USER_PASS) {
      console.error("❌ Email credentials not configured");
      return res.status(500).json({ 
        success: false, 
        message: "Email service not configured on server" 
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
      },
    });

    // Compose email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📍 Location Recommendation</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #667eea; margin-top: 0;">${locationName}</h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>📂 Category:</strong> ${category}</p>
            <p style="margin: 8px 0;"><strong>🌍 Coordinates:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
            ${distance ? `<p style="margin: 8px 0;"><strong>📏 Distance:</strong> ${distance.toFixed(2)} km</p>` : ''}
            <p style="margin: 8px 0;">
              <a href="https://www.google.com/maps?q=${latitude},${longitude}" 
                 style="color: #667eea; text-decoration: none; font-weight: bold;">
                🗺️ View on Google Maps
              </a>
            </p>
          </div>
          
          ${reviews ? `
            <div style="margin-top: 20px;">
              <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">⭐ Reviews</h3>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-line;">
                ${reviews}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
            <p>Sent via TownX - Your AI Location Assistant</p>
          </div>
        </div>
      </div>
    `;

    const emailText = `
      Location Recommendation: ${locationName}
      
      Category: ${category}
      Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
      ${distance ? `Distance: ${distance.toFixed(2)} km` : ''}
      
      Google Maps: https://www.google.com/maps?q=${latitude},${longitude}
      
      ${reviews || ''}
      
      ---
      Sent via TownX - Your AI Location Assistant
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"TownX Location Assistant" <${process.env.USER_EMAIL}>`,
      to: to,
      subject: subject || `Location Recommendation: ${locationName}`,
      text: emailText,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    res.json({ 
      success: true, 
      message: "Email sent successfully",
      messageId: info.messageId 
    });

  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to send email" 
    });
  }
});

// Submit detailed feedback with reason and comment
app.post("/api/detailed-feedback", (req, res) => {
  try {
    const { userId, placeId, placeName, category, reason, comment, timestamp } = req.body;
    const uid = userId || "default_user";
    
    if (!placeId || !reason) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }
    
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === uid);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Initialize detailed feedback array if not exists
    if (!user.preferences.detailedFeedback) {
      user.preferences.detailedFeedback = [];
    }
    
    // Add detailed feedback
    const detailedFb = {
      placeId,
      placeName,
      category,
      reason,
      comment: comment || '',
      timestamp: timestamp || new Date().toISOString()
    };
    
    user.preferences.detailedFeedback.push(detailedFb);
    savePreferences(data);
    
    // Also save to dedicated feedback.json
    const fbData = loadFeedback();
    if (fbData) {
      let fbUser = fbData.feedback.find(u => u.userId === uid);
      if (!fbUser) {
        fbUser = { userId: uid, feedback: [] };
        fbData.feedback.push(fbUser);
      }
      fbUser.feedback.push(detailedFb);
      saveFeedback(fbData);
    }
    
    console.log(`[DETAILED FEEDBACK] ${placeName}: ${reason} - ${comment}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] /api/detailed-feedback:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rate suggestion accuracy
app.post("/api/rate-suggestion", (req, res) => {
  try {
    const { userId, suggestion, wasHelpful, timestamp } = req.body;
    
    if (!suggestion || wasHelpful === undefined) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }
    
    const data = loadPreferences();
    if (!data) {
      return res.status(500).json({ success: false, error: "Cannot load preferences" });
    }
    
    const user = data.users.find(u => u.userId === (userId || "default_user"));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Initialize suggestion ratings if not exists
    if (!user.preferences.suggestionRatings) {
      user.preferences.suggestionRatings = [];
    }
    
    // Add rating
    user.preferences.suggestionRatings.push({
      suggestion,
      wasHelpful,
      timestamp: timestamp || new Date().toISOString()
    });
    
    savePreferences(data);
    console.log(`[SUGGESTION RATING] "${suggestion.query}" was ${wasHelpful ? 'helpful' : 'not helpful'}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] /api/rate-suggestion:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== PLACE SEARCH ENDPOINTS ==========

// Search places
app.post("/api/search-places", async (req, res) => {
  try {
    const { latitude, longitude, query, limit } = req.body;

    if (!latitude || !longitude || !query) {
      return res.status(400).json({ success: false, error: "Missing params" });
    }

    const q = encodeURIComponent(query);
    // Use bounded search with location bias for better nearby results
    const viewbox = `${longitude - 0.05},${latitude + 0.05},${longitude + 0.05},${latitude - 0.05}`;
    const path = `/search?q=${q}&format=json&limit=${limit || 10}&viewbox=${viewbox}&bounded=1`;

    console.log(`[SEARCH] "${query}" near ${latitude.toFixed(4)},${longitude.toFixed(4)}`);
    const results = await fetchNominatim(path);

    if (!Array.isArray(results)) {
      console.log("[RESULT] No array returned, trying unbounded search");
      // Fallback to unbounded search
      const fallbackPath = `/search?q=${q}&format=json&limit=${limit || 10}`;
      const fallbackResults = await fetchNominatim(fallbackPath);
      
      if (!Array.isArray(fallbackResults)) {
        return res.json({ success: true, places: [], count: 0 });
      }

      const places = fallbackResults.map((p) => ({
        id: p.osm_id,
        name: p.name || p.display_name.split(',')[0],
        latitude: parseFloat(p.lat),
        longitude: parseFloat(p.lon),
        address: p.address,
        displayName: p.display_name,
        type: p.type,
        category: p.class,
        osmType: p.osm_type,
        importance: p.importance,
        icon: p.icon,
        addressType: p.addresstype,
        boundingBox: p.boundingbox,
        placeRank: p.place_rank
      }));

      console.log(`[RESULT] Found ${places.length} places (fallback)`);
      return res.json({ success: true, places, count: places.length });
    }

    const places = results.map((p) => ({
      id: p.osm_id,
      name: p.name || p.display_name.split(',')[0],
      latitude: parseFloat(p.lat),
      longitude: parseFloat(p.lon),
      address: p.address,
      displayName: p.display_name,
      type: p.type,
      category: p.class,
      osmType: p.osm_type,
      importance: p.importance,
      icon: p.icon,
      addressType: p.addresstype,
      boundingBox: p.boundingbox,
      placeRank: p.place_rank
    }));

    console.log(`[RESULT] Found ${places.length} places (bounded)`);
    res.json({ success: true, places, count: places.length });
  } catch (err) {
    console.error("[ERROR] /api/search-places:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sort places by feedback score and saved status
app.post("/api/sort-places-by-feedback", (req, res) => {
  try {
    const { places, userId } = req.body;
    
    if (!Array.isArray(places)) {
      return res.status(400).json({ success: false, error: "Places array required" });
    }

    const uid = userId || "default_user";
    const data = loadPreferences();
    const user = data ? data.users.find(u => u.userId === uid) : null;

    // Get user's saved places and feedback
    const savedPlaceIds = new Set(
      user?.preferences?.savedPlaces?.map(p => p.id) || []
    );
    const userFeedback = user?.preferences?.feedback || [];

    // Calculate feedback score for each place
    const placesWithScore = places.map(place => {
      let feedbackScore = 0;
      let isSaved = false;

      // Check if place is saved
      if (savedPlaceIds.has(String(place.id))) {
        isSaved = true;
        feedbackScore += 100; // Saved places get highest priority
      }

      // Count positive and negative feedbacks for this place
      const positiveFeedbacks = userFeedback.filter(
        f => String(f.placeId) === String(place.id) && f.feedbackType === 'positive'
      ).length;

      const negativeFeedbacks = userFeedback.filter(
        f => String(f.placeId) === String(place.id) && f.feedbackType === 'negative'
      ).length;

      // Add score based on feedback
      feedbackScore += positiveFeedbacks * 10;
      feedbackScore -= negativeFeedbacks * 5;

      // Also add category-level feedback
      const categoryFeedback = userFeedback.filter(f => f.category === place.category);
      const categoryPositive = categoryFeedback.filter(f => f.feedbackType === 'positive').length;
      const categoryNegative = categoryFeedback.filter(f => f.feedbackType === 'negative').length;
      
      feedbackScore += categoryPositive * 2;
      feedbackScore -= categoryNegative * 1;

      return {
        ...place,
        feedbackScore,
        isSaved,
        positiveFeedbacks,
        negativeFeedbacks
      };
    });

    // Sort by: saved first, then by feedback score, then by importance
    const sortedPlaces = placesWithScore.sort((a, b) => {
      // Saved places always first
      if (a.isSaved !== b.isSaved) {
        return b.isSaved ? 1 : -1;
      }
      
      // Then by feedback score
      if (a.feedbackScore !== b.feedbackScore) {
        return b.feedbackScore - a.feedbackScore;
      }
      
      // Finally by importance
      return (b.importance || 0) - (a.importance || 0);
    });

    console.log(`[SORT] Sorted ${sortedPlaces.length} places by feedback`);
    res.json({ success: true, places: sortedPlaces });
  } catch (err) {
    console.error("[ERROR] /api/sort-places-by-feedback:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reverse geocode
app.post("/api/reverse-geocode", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: "Missing coords" });
    }

    const path = `/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`;
    console.log(`[GEOCODE] ${latitude},${longitude}`);

    const result = await fetchNominatim(path);
    res.json({
      success: true,
      data: {
        name: result.name || "Location",
        displayName: result.display_name,
        address: result.address,
        latitude: result.lat,
        longitude: result.lon
      }
    });
  } catch (err) {
    console.error("[ERROR] /api/reverse-geocode:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== LLM ENDPOINTS ==========

// Get detailed information about a location using LLM
app.post("/api/location-details", async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res
        .status(400)
        .json({ success: false, error: "Location data is required" });
    }

    if (!llmInitialized) {
      return res.status(503).json({
        success: false,
        error: "LLM service is not available. Please set GROQ_API_KEY in .env",
      });
    }

    console.log(`[LLM] Fetching details for: ${location.name}`);

    let feedbackSummary = "No prior feedback available.";
    if (MONGO_URI && location.id) {
      try {
        const reviews = await Review.find({ placeId: location.id }).sort({ createdAt: -1 }).lean();
        if (reviews.length > 0) {
          const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
          const recent = reviews
            .slice(0, 3)
            .map((r) => `${r.rating || '?'}⭐: ${(r.comment || '').slice(0, 80)}`)
            .join(" | ");
          feedbackSummary = `Avg rating ${avg.toFixed(1)} from ${reviews.length} review(s). Recent: ${recent}`;
        }
      } catch (err) {
        console.warn("[LLM] Could not load feedback for details:", err.message);
      }
    }

    const details = await getLocationDetails(location, { feedbackSummary });
    // Safeguard: Only send serializable data
    function safeJson(obj) {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        return { success: false, error: 'Non-serializable data returned from LLM.' };
      }
    }
    res.json(safeJson(details));
  } catch (err) {
    console.error("[ERROR] /api/location-details:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Filter places using LLM (best-effort, falls back client-side if unavailable)
app.post("/api/llm-filter-places", async (req, res) => {
  try {
    const { places, filters } = req.body || {};
    if (!places || !Array.isArray(places) || places.length === 0) {
      return res.json({ success: true, places: [], reason: "No places supplied to filter" });
    }

    if (!llmInitialized) {
      return res.status(503).json({ success: false, error: "LLM service is not available" });
    }

    const result = await filterPlacesWithLLM({ places, filters });
    if (!result.success || !Array.isArray(result.placeIds)) {
      return res.status(500).json({ success: false, error: result.error || "LLM filtering failed" });
    }

    const idSet = new Set(result.placeIds);
    const ordered = result.placeIds
      .map((id) => places.find((p) => p.id === id))
      .filter(Boolean);

    // Append any remaining places (keep at most 30 total) to avoid losing options
    const remaining = places.filter((p) => !idSet.has(p.id)).slice(0, Math.max(0, 30 - ordered.length));
    const combined = [...ordered, ...remaining];

    res.json({ success: true, places: combined, reason: result.reason || "" });
  } catch (err) {
    console.error("[ERROR] /api/llm-filter-places:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get recommendations for a location using LLM
app.post("/api/location-recommendations", async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res
        .status(400)
        .json({ success: false, error: "Location data is required" });
    }

    if (!llmInitialized) {
      return res.status(503).json({
        success: false,
        error: "LLM service is not available. Please set GROQ_API_KEY in .env",
      });
    }

    console.log(`[LLM] Fetching recommendations for: ${location.name}`);
    const recommendations = await getLocationRecommendations(location);

    res.json(recommendations);
  } catch (err) {
    console.error("[ERROR] /api/location-recommendations:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== AGENTIC AI ENDPOINT ==========

// Process user query through agentic AI
app.post("/api/agent-search", async (req, res) => {
  try {
    const { userQuery, latitude, longitude } = req.body;

    if (!userQuery) {
      return res.status(400).json({ success: false, error: "userQuery is required" });
    }

    console.log(`[AGENT] Processing query: "${userQuery}"`);

    // Process query through agent
    const agentResult = await processUserQuery(userQuery);

    if (!agentResult.success) {
      return res.status(500).json({ success: false, error: agentResult.error });
    }

    const { locationTypes, searchKeywords, searchRadius, reasoning } = agentResult.data;

    // Return agent result with next steps
    res.json({
      success: true,
      agent: {
        userQuery,
        locationTypes,
        searchKeywords,
        searchRadius,
        reasoning,
      },
      instructions: {
        message: `I found you're looking for ${locationTypes.join(", ")}`,
        action: "open_map_search",
        searchQuery: searchKeywords.join(" "),
        mapCenter: latitude && longitude ? { latitude, longitude } : null,
      },
    });

    // Track search query for analytics
    if (searchKeywords.length > 0) {
      const mainQuery = searchKeywords[0];
      await new Promise((resolve) => {
        setTimeout(async () => {
          try {
            if (MONGO_URI) {
              await trackSearchQuery(mainQuery);
            }
          } catch (e) {
            console.warn("[AGENT] Failed to track search:", e.message);
          }
          resolve();
        }, 100);
      });
    }
  } catch (err) {
    console.error("[ERROR] /api/agent-search:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
});
