# Place Recommender Agentic AI System

## Overview

This system implements an intelligent place recommendation agent using **LangGraph.js**, **ChatGroq API**, and **OpenStreetMap**. The agent understands natural language queries and automatically finds relevant locations on an interactive map.

## System Architecture

### Backend Components

#### 1. **Agent Service** (`agent-commonjs.js`)
- **Framework**: LangGraph.js with LLaMA 3.3 70B via Groq API
- **Function**: Processes user natural language queries
- **Workflow Nodes**:
  - `extract`: Extracts location types from user query
  - `validate`: Normalizes location types to OSM categories
  - `radius`: Determines search radius based on query hints

#### 2. **Agent Endpoint** (`/api/agent-search`)
- **Method**: POST
- **Input**: `{ userQuery, latitude?, longitude? }`
- **Output**: Structured search parameters with location types and keywords

#### 3. **OpenStreetMap Integration**
- Uses existing Nominatim API integration
- Endpoint: `/api/search-places` (POST)
- Searches for places by query near user location

### Frontend Components

#### 1. **RecommenderPage.jsx**
- Main chat interface for place search
- Features:
  - Chat-based query input
  - Auto-location detection (Geolocation API)
  - Quick search suggestions
  - Message history display
  - Sidebar with recent searches

#### 2. **MapModal.jsx**
- Interactive Leaflet.js map component
- Features:
  - Real-time place search and visualization
  - Auto-fill search from agent results
  - Result list sidebar
  - User location marker
  - Click-to-center on results
  - Distance calculation

#### 3. **Navigation**
- Added route: `/recommender`
- Navigation button in HomePage sidebar
- Protected route using existing auth

## How It Works

### User Flow

```
User Query
    ↓
Frontend (RecommenderPage)
    ↓
/api/agent-search (Backend)
    ↓
LangGraph Agent Processing
  ├─ Extract location types
  ├─ Validate & normalize
  └─ Determine search radius
    ↓
Agent Response with Search Parameters
    ↓
Frontend Opens MapModal
    ↓
Auto-triggers /api/search-places
    ↓
Results displayed on Leaflet Map
```

### Example Queries

| User Query | Agent Extracts | Search Keywords | Radius |
|-----------|----------------|-----------------|--------|
| "Find cafes nearby" | `["cafe"]` | `["coffee", "cafe"]` | 2 km |
| "Show me restaurants" | `["restaurant"]` | `["restaurant", "food"]` | 5 km |
| "Pizza places around" | `["restaurant"]` | `["pizza", "restaurant"]` | 10 km |
| "Hotels in the area" | `["hotel"]` | `["hotel", "lodging"]` | 15 km |

## Location Type Mappings

The agent normalizes user queries to standard OSM categories:

```javascript
{
  "cafe": ["cafe", "coffee"],
  "restaurant": ["restaurant", "food", "pizza", "burger"],
  "hotel": ["hotel", "lodging", "accommodation"],
  "fuel": ["fuel", "gas", "petrol", "gas_station"],
  "supermarket": ["supermarket", "market", "grocery"],
  "park": ["park", "garden", "recreation"],
  "hospital": ["hospital", "medical", "doctor"],
  "pharmacy": ["pharmacy", "chemist"],
  "bank": ["bank", "atm"],
  "library": ["library"],
  "museum": ["museum"],
  "cinema": ["cinema", "theater"],
  "pub": ["pub", "bar"]
}
```

## API Endpoints

### Agent Search
```
POST /api/agent-search
Content-Type: application/json

{
  "userQuery": "Find cafes nearby",
  "latitude": 28.6139,
  "longitude": 77.209
}

Response:
{
  "success": true,
  "agent": {
    "userQuery": "Find cafes nearby",
    "locationTypes": ["cafe"],
    "searchKeywords": ["coffee", "cafe"],
    "searchRadius": 2,
    "reasoning": "User wants cafes nearby"
  },
  "instructions": {
    "message": "I found you're looking for cafe",
    "action": "open_map_search",
    "searchQuery": "coffee cafe",
    "mapCenter": { "latitude": 28.6139, "longitude": 77.209 }
  }
}
```

### Place Search (Existing)
```
POST /api/search-places
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.209,
  "query": "coffee cafe",
  "limit": 20
}

Response:
{
  "success": true,
  "places": [
    {
      "id": "osm_id",
      "name": "Cafe Name",
      "latitude": 28.615,
      "longitude": 77.210,
      "displayName": "Full address",
      "type": "cafe",
      "category": "amenity",
      ...
    },
    ...
  ],
  "count": 20
}
```

## Environment Setup

### Backend Requirements

1. **Install Dependencies**
   ```bash
   cd backend
   npm install @langchain/groq @langchain/langgraph
   ```

2. **Environment Variables** (in `.env`)
   ```
   GROQ_API_KEY=your_groq_api_key_here
   MONGO_URI=mongodb://...  # Optional
   ```

3. **Start Backend**
   ```bash
   npm run dev
   # Server runs on http://localhost:4000
   ```

### Frontend Requirements

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install leaflet leaflet-routing-machine
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   # Usually runs on http://localhost:5173
   ```

## Key Features

### 1. **Natural Language Understanding**
- Agent parses complex queries
- Handles multiple location types
- Extracts location hints (nearby, far, around)
- Fallback mode for LLM failures

### 2. **Intelligent Search**
- Auto-fills map search from agent results
- Bounded search with location bias
- Fallback to unbounded search if needed
- Caches user location via Geolocation API

### 3. **Interactive Map**
- Real-time marker updates
- Click to center on result
- Sidebar with sorted results
- Distance calculation to user

### 4. **Seamless Integration**
- No modifications to existing OpenStreetMap code
- Uses existing `/api/search-places` endpoint
- Compatible with existing auth system
- Non-breaking changes to codebase

## Error Handling

### Agent Level
- If LLM fails, returns original query as-is
- Graceful fallback to basic extraction
- Timeout protection (10s per request)

### Search Level
- Handles empty results gracefully
- Fallback from bounded to unbounded search
- Network error messages to user
- User location defaults (Delhi: 28.6139, 77.209)

### Map Level
- Auto-detects geolocation or uses default
- Handles map resize on modal open
- Marker cleanup on new search
- Bounds fitting for results

## File Structure

```
backend/src/openstreetmap/
├── agent-commonjs.js          # LangGraph agent service
├── server.js                   # Express server with /api/agent-search endpoint
└── public/                     # Existing map interface

frontend/
├── src/
│   ├── App.jsx                # Updated with /recommender route
│   ├── components/
│   │   └── MapModal.jsx       # Interactive map modal
│   ├── pages/
│   │   ├── HomePage.jsx       # Updated with navigation
│   │   └── RecommenderPage.jsx # New recommender interface
│   └── ...
└── ...
```

## Performance Considerations

1. **LLM Response Time**: ~1-3 seconds for agent processing
2. **Map Load Time**: ~500ms for Leaflet initialization
3. **Search Time**: ~1-2 seconds for OSM Nominatim
4. **Marker Rendering**: ~100ms for 20 markers

## Security Notes

- GROQ_API_KEY should never be exposed to frontend
- Geolocation requires HTTPS in production
- All API calls properly validate input
- Rate limiting recommended for production

## Future Enhancements

1. **Advanced Filtering**: Price range, ratings, hours
2. **Route Planning**: Navigation to selected places
3. **User Preferences**: Saved favorite search patterns
4. **Analytics**: Track popular searches
5. **Multi-language**: Support different languages
6. **Voice Input**: Speech-to-text for queries

## Troubleshooting

### Agent Not Working
- Check `GROQ_API_KEY` in `.env`
- Verify backend is running on port 4000
- Check browser console for network errors

### Map Not Displaying
- Ensure leaflet CSS is loaded
- Check browser console for marker icon errors
- Verify coordinates are valid lat/lon

### Search Not Returning Results
- Check internet connection
- Verify location coordinates are within valid range
- Try different search keywords

### Location Detection Failing
- HTTPS required for production
- User must allow geolocation permission
- Browser must support Geolocation API

## Support

For issues or feature requests, refer to the main project README.
