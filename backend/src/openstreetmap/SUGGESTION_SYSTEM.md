# 🎯 Personalized Suggestion System

## Overview
The application now includes an intelligent suggestion system that learns from user behavior to provide personalized place recommendations. The system uses JSON-based storage that can easily be migrated to a database later.

## Features

### 1. **Smart Suggestions** 💡
- Suggestions appear automatically when you set your location
- Based on your search history, favorite categories, and saved places
- Shows quick-search chips for one-click searching

### 2. **Save to Favorites** ⭐
- Click the star (☆) icon on any place to save it
- Access saved places via the "Saved Places" tab
- Saved places remember category preferences for better suggestions

### 3. **Two-Tab Interface**
- **Found Places**: Shows current search results
- **Saved Places**: Your personal collection of favorite locations

### 4. **Smart Learning**
The system tracks:
- Search queries (last 50 searches)
- Favorite categories (auto-detected from saves)
- Saved places with timestamps
- Place ratings (for future enhancement)
- Visit history

## How It Works

### User Preferences Storage (`data/user_preferences.json`)

```json
{
  "users": [{
    "userId": "default_user",
    "preferences": {
      "favoriteCategories": ["cafe", "restaurant"],
      "visitedPlaces": [],
      "savedPlaces": [
        {
          "id": "123456",
          "name": "Starbucks",
          "category": "cafe",
          "latitude": 28.6139,
          "longitude": 77.2090,
          "savedAt": "2025-12-05T..."
        }
      ],
      "searchHistory": ["restaurants", "cafes", "hotels"],
      "ratings": []
    },
    "settings": {
      "preferredRadius": 5,
      "preferredTransport": "car",
      "maxResults": 10
    }
  }]
}
```

### API Endpoints

#### 1. Get Suggestions
**POST** `/api/get-suggestions`
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "userId": "default_user"
}
```

Returns personalized suggestions based on user preferences.

#### 2. Save Place
**POST** `/api/save-place`
```json
{
  "userId": "default_user",
  "place": {
    "id": "123",
    "name": "McDonald's",
    "category": "restaurant",
    "type": "fast_food",
    "latitude": 28.6,
    "longitude": 77.2
  }
}
```

#### 3. Rate Place
**POST** `/api/rate-place`
```json
{
  "userId": "default_user",
  "placeId": "123",
  "score": 5
}
```

#### 4. Track Search
**POST** `/api/track-search`
```json
{
  "userId": "default_user",
  "query": "restaurants"
}
```

#### 5. Mark as Visited
**POST** `/api/mark-visited`
```json
{
  "userId": "default_user",
  "place": { /* place object */ }
}
```

#### 6. Get User Preferences
**GET** `/api/user-preferences/:userId`
**GET** `/api/user-preferences` (for default_user)

Returns complete user profile with preferences and settings.

## Suggestion Algorithm

The system calculates a suggestion score based on:

1. **Category Preference** (5 points per match)
   - Counts how often user searched/saved places in this category

2. **Search History** (3 points per match)
   - Matches place type with recent searches

3. **Visited Places** (2 points)
   - Suggests similar categories to previously visited places

4. **User Ratings** (2x rating score)
   - Boosts places with high user ratings

5. **OSM Importance** (10x importance)
   - Uses OpenStreetMap's importance score (0-1)

## Migration to Database

The JSON structure is designed for easy database migration:

### Recommended Database Schema

#### Users Table
```sql
CREATE TABLE users (
  user_id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Saved Places Table
```sql
CREATE TABLE saved_places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  place_id VARCHAR(255),
  place_name VARCHAR(255),
  category VARCHAR(100),
  type VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

#### Search History Table
```sql
CREATE TABLE search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  query VARCHAR(255),
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

#### Ratings Table
```sql
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  place_id VARCHAR(255),
  score INT CHECK(score >= 1 AND score <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

#### User Settings Table
```sql
CREATE TABLE user_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  preferred_radius DECIMAL(5, 2) DEFAULT 5.0,
  preferred_transport VARCHAR(50) DEFAULT 'car',
  max_results INT DEFAULT 10,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

## Usage Examples

### 1. Search and Save
```javascript
// User searches for "cafes"
await searchNearbyPlaces(); // System tracks search automatically

// User saves a cafe
await savePlace({
  id: '123',
  name: 'Starbucks',
  category: 'cafe',
  type: 'coffee_shop',
  latitude: 28.6,
  longitude: 77.2
});
```

### 2. Get Personalized Suggestions
```javascript
// When location is set, suggestions load automatically
// Displays chips like: "cafes", "restaurants", "hotels"
// Click any chip to auto-fill and search
```

### 3. View Saved Places
```javascript
// Click "Saved Places" tab
toggleView('saved');

// Get routes to saved places
// Delete saved places with trash icon
```

## Future Enhancements

1. **Collaborative Filtering**
   - Suggest places based on similar users' preferences

2. **Time-Based Suggestions**
   - Morning: cafes, breakfast spots
   - Afternoon: restaurants, shopping
   - Evening: entertainment, dining

3. **Distance-Based Learning**
   - Learn user's preferred travel distance
   - Auto-adjust search radius

4. **Category Clustering**
   - Group related categories (cafe + restaurant = food)
   - Suggest complementary categories

5. **Social Features**
   - Share saved places with friends
   - See popular places in your network

6. **Offline Support**
   - Cache suggestions for offline use
   - Sync when back online

## Technical Details

- **Storage**: JSON file (`data/user_preferences.json`)
- **Backend**: Express.js with Node.js fs module
- **Frontend**: Vanilla JavaScript
- **Data Structure**: Nested objects for easy migration
- **Scalability**: Ready for MongoDB, PostgreSQL, or MySQL

## Files Modified

- `server.js` - Added suggestion API endpoints and logic
- `public/index.html` - Added UI for suggestions and saved places
- `data/user_preferences.json` - User data storage

## Notes

- The default user ID is `"default_user"`
- Search history keeps last 50 searches
- All timestamps use ISO 8601 format
- System auto-creates preferences file on first run
- Safe for multiple concurrent users (with unique userIds)
