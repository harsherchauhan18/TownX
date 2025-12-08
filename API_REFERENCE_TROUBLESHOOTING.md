# API Reference & Troubleshooting Guide

## API Reference

### 1. Agent Search Endpoint

**Endpoint**: `POST /api/agent-search`

**Description**: Process a user's natural language query to extract location types and search parameters.

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "userQuery": "Find cafes nearby",
  "latitude": 28.6139,
  "longitude": 77.209
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userQuery | string | ✓ | Natural language query from user |
| latitude | number | ✗ | User's latitude for location bias |
| longitude | number | ✗ | User's longitude for location bias |

**Response - Success (200)**:
```json
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
    "mapCenter": {
      "latitude": 28.6139,
      "longitude": 77.209
    }
  }
}
```

**Response - Error (400/500)**:
```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| agent.locationTypes | array | Extracted place types (cafe, restaurant, etc.) |
| agent.searchKeywords | array | Keywords for searching |
| agent.searchRadius | number | Search radius in km |
| agent.reasoning | string | Agent's reasoning |
| instructions.message | string | Human-friendly message |
| instructions.searchQuery | string | Query to pass to place search |
| instructions.mapCenter | object | Center location for map |

**Example cURL**:
```bash
curl -X POST http://localhost:4000/api/agent-search \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "Find pizzerias near me",
    "latitude": 28.6139,
    "longitude": 77.209
  }'
```

**Example Python**:
```python
import requests

response = requests.post(
    "http://localhost:4000/api/agent-search",
    json={
        "userQuery": "Find pizzerias near me",
        "latitude": 28.6139,
        "longitude": 77.209
    }
)

data = response.json()
if data["success"]:
    agent = data["agent"]
    print(f"Location types: {agent['locationTypes']}")
    print(f"Keywords: {agent['searchKeywords']}")
```

**Example JavaScript (Fetch)**:
```javascript
const response = await fetch('http://localhost:4000/api/agent-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userQuery: 'Find pizzerias near me',
    latitude: 28.6139,
    longitude: 77.209
  })
});

const data = await response.json();
if (data.success) {
  console.log('Location types:', data.agent.locationTypes);
  console.log('Search keywords:', data.agent.searchKeywords);
}
```

---

### 2. Place Search Endpoint (Existing)

**Endpoint**: `POST /api/search-places`

**Description**: Search for places by query near a location (OpenStreetMap integration).

**Request Body**:
```json
{
  "latitude": 28.6139,
  "longitude": 77.209,
  "query": "coffee cafe",
  "limit": 20
}
```

**Response**:
```json
{
  "success": true,
  "places": [
    {
      "id": 123456,
      "name": "Cafe XYZ",
      "latitude": 28.615,
      "longitude": 77.210,
      "address": {
        "road": "Main Street",
        "city": "Delhi"
      },
      "displayName": "Cafe XYZ, Main Street, Delhi",
      "type": "cafe",
      "category": "amenity",
      "osmType": "node",
      "importance": 0.5,
      "icon": "https://...",
      "placeRank": 28,
      "boundingBox": ["28.614", "28.616", "77.209", "77.211"]
    }
  ],
  "count": 20
}
```

---

## Troubleshooting Guide

### Category 1: Agent/LLM Issues

#### Problem: "GROQ_API_KEY not set"

**Causes**:
- Missing `.env` file
- GROQ_API_KEY not in environment
- Environment not reloaded

**Solutions**:
```bash
# 1. Check if .env exists
ls -la backend/.env

# 2. Create/update .env
echo "GROQ_API_KEY=your_key_here" >> backend/.env

# 3. Verify API key format
cat backend/.env | grep GROQ_API_KEY

# 4. Restart backend server
npm run dev
```

**Verification**:
```bash
# Test agent endpoint
curl -X POST http://localhost:4000/api/agent-search \
  -H "Content-Type: application/json" \
  -d '{"userQuery":"test"}'

# Should return agent result, not error about API key
```

#### Problem: Agent returns "Error: Invalid API key"

**Causes**:
- Incorrect Groq API key
- Expired API key
- API key from wrong account

**Solutions**:
1. Go to https://console.groq.com
2. Verify API key is correct
3. Generate new key if needed
4. Update `.env` file
5. Restart backend

#### Problem: Agent takes too long or times out

**Causes**:
- Network latency
- Groq API overloaded
- Large query processing

**Solutions**:
```javascript
// Increase timeout in agent-commonjs.js
const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 1024,
  maxRetries: 3,  // Increase from 2
  timeout: 15000  // Add timeout in ms
});
```

#### Problem: Agent returns empty locationTypes

**Causes**:
- Query too vague
- LLM having difficulty
- Network issue

**Solutions**:
1. Try more specific queries
2. Check network connection
3. Review agent logs in backend console
4. Restart backend service

---

### Category 2: Frontend/Map Issues

#### Problem: Map not displaying in modal

**Causes**:
- Leaflet not loaded
- CSS not applied
- Container sizing issues
- Browser compatibility

**Solutions**:
```javascript
// In MapModal.jsx, check:

// 1. Verify leaflet import
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 2. Check container has dimensions
<div ref={mapContainer} style={{ height: '100%' }} />

// 3. Force map resize
setTimeout(() => {
  if (map.current) {
    map.current.invalidateSize();
  }
}, 100);

// 4. Check browser console for CSS errors
// Should see no 404s for leaflet assets
```

**Browser DevTools Check**:
```javascript
// In console:
L.version  // Should print Leaflet version
map.current._size  // Should show map dimensions
```

#### Problem: Markers not showing on map

**Causes**:
- Marker icon URL broken
- Coordinates invalid
- Marker cleanup issue

**Solutions**:
```javascript
// Fix marker icons (already in MapModal.jsx)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Check coordinates validity
console.log('Coordinates:', latitude, longitude);
console.log('Valid range: [-90,90] x [-180,180]');
```

#### Problem: "Cannot find module 'leaflet'"

**Causes**:
- Leaflet not installed
- node_modules missing

**Solutions**:
```bash
# In frontend directory
npm install leaflet leaflet-routing-machine

# If still issues, clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Category 3: Location/Geolocation Issues

#### Problem: Geolocation not working

**Causes**:
- HTTPS required (not localhost)
- User denied permission
- Browser doesn't support
- Location services disabled

**Solutions**:
```javascript
// In RecommenderPage.jsx

// 1. Check browser support
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('Location obtained:', position.coords);
    },
    (error) => {
      console.warn('Geolocation error:', error.code);
      // Fallback to default
      setUserLocation({ latitude: 28.6139, longitude: 77.209 });
    }
  );
}

// 2. For production, use HTTPS
// https://yourapp.com/recommender

// 3. Check Chrome DevTools -> Security -> Geolocation
```

#### Problem: "User denied permission" error

**Causes**:
- User clicked "Deny"
- Permission blocked in browser settings

**Solutions**:
1. Browser settings → Site Settings → Location
2. Find your domain and change to "Allow"
3. Reload page
4. Accept permission prompt

---

### Category 4: API Connection Issues

#### Problem: "Cannot reach backend" or connection timeout

**Causes**:
- Backend not running
- Wrong port
- CORS issues
- Firewall blocking

**Solutions**:
```bash
# 1. Check if backend is running
curl http://localhost:4000/api/health
# Should return: {"status":"ok"}

# 2. Start backend if not running
cd backend
npm run dev

# 3. Verify port
netstat -an | grep 4000  # Windows
lsof -i :4000            # macOS/Linux

# 4. Check CORS headers
curl -I http://localhost:4000/api/health
# Should have Access-Control headers
```

#### Problem: "CORS error" in browser console

**Causes**:
- Frontend running on different port
- Backend CORS not configured
- Backend not running

**Solutions**:
```javascript
// In server.js, ensure CORS is enabled
app.use(cors());  // Should be present

// Or explicitly configure:
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

#### Problem: 500 error from agent endpoint

**Causes**:
- Backend error
- Invalid request
- LLM service failure

**Solutions**:
```bash
# 1. Check backend console logs
# Should show [AGENT] processing messages

# 2. Check backend error logs
# Look for [ERROR] messages

# 3. Test with curl
curl -X POST http://localhost:4000/api/agent-search \
  -H "Content-Type: application/json" \
  -d '{"userQuery":"test","latitude":28.6139,"longitude":77.209}'

# 4. Check response status and message
# Backend console should show the error
```

---

### Category 5: Search Result Issues

#### Problem: No search results returned

**Causes**:
- Invalid coordinates
- No places exist for query
- OpenStreetMap API error
- Network timeout

**Solutions**:
```javascript
// 1. Verify coordinates
console.log('Latitude:', userLocation.latitude);  // Should be -90 to 90
console.log('Longitude:', userLocation.longitude); // Should be -180 to 180

// 2. Try with major city
const testCoords = { latitude: 28.6139, longitude: 77.209 }; // Delhi

// 3. Try with general query
// Instead of: "specific pizza restaurant"
// Try: "restaurant"

// 4. Check API response
fetch('http://localhost:4000/api/search-places', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 28.6139,
    longitude: 77.209,
    query: 'restaurant',
    limit: 10
  })
}).then(r => r.json()).then(d => console.log(d));
```

#### Problem: Distance calculation shows NaN

**Causes**:
- Invalid coordinates
- Math operation error

**Solutions**:
```javascript
// In MapModal.jsx, verify calculation
const distance = Math.sqrt(
  Math.pow(place.latitude - userLocation.latitude, 2) +
  Math.pow(place.longitude - userLocation.longitude, 2)
) * 111; // Convert to km

// Ensure all values are numbers
console.log(typeof place.latitude); // Should be 'number'
console.log(typeof userLocation.latitude); // Should be 'number'
```

---

## Performance Debugging

### Check Response Times

```bash
# Time agent response
time curl -X POST http://localhost:4000/api/agent-search \
  -H "Content-Type: application/json" \
  -d '{"userQuery":"Find cafes"}'
```

**Expected Times**:
- Agent processing: 1-3 seconds
- Map load: ~500ms
- Place search: 1-2 seconds
- Total: 2-6 seconds

### Monitor Network in Browser

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Reload page
4. Filter by XHR
5. Check:
   - Request/response headers
   - Response time
   - Response size
   - Status codes

### Check Backend Logs

```bash
# Look for timing information
# Backend should log:
# [AGENT] Processing query...
# [SEARCH] Found N places
# [RESULT] Query took X ms
```

---

## Common Error Messages & Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "userQuery cannot be empty" | No query provided | Ensure user enters text |
| "Missing latitude/longitude" | Location not available | Enable geolocation or use default |
| "Cannot parse LLM response" | Agent response malformed | Check Groq API key, restart |
| "Invalid coordinates" | Out of range values | Verify lat/lon are valid |
| "Timeout waiting for LLM" | Network slow | Increase timeout, check connection |
| "Places array required" | Wrong request format | Check API request body |
| "User not found" | User ID issue | Check authentication |
| "MongoDB not configured" | No MONGO_URI | Set in .env (optional feature) |

---

## Debug Logging

### Enable Verbose Logging

**Backend** (in agent-commonjs.js):
```javascript
// Add at top
const DEBUG = true;

function log(msg) {
  if (DEBUG) console.log('[AGENT DEBUG]', msg);
}

// Use in functions:
log(`Query: ${state.userQuery}`);
log(`Extracted types: ${JSON.stringify(state.locationTypes)}`);
```

**Frontend** (in RecommenderPage.jsx):
```javascript
// Add in API call
.then(response => {
  console.log('[AGENT RESPONSE]', response.data);
  return response.data;
})
.catch(error => {
  console.error('[AGENT ERROR]', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status
  });
  throw error;
});
```

---

## Support Resources

- **Groq Docs**: https://console.groq.com/docs
- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **Leaflet Docs**: https://leafletjs.com/
- **OpenStreetMap API**: https://nominatim.org/

---

**Last Updated**: December 2024
**Version**: 1.0.0
