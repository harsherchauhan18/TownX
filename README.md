# TownX 🗺️⚡

> Your ultimate guide to exploring and connecting with your community

TownX is a full-stack web application that combines interactive mapping, AI-powered recommendations, and community engagement to help users discover and explore their local area. Built with a Stranger Things-inspired aesthetic featuring a stunning meteor shower background and retro neon design.

## ✨ Features

### 🎯 Core Functionality
- **Interactive Maps**: Explore your town with advanced mapping powered by OpenStreetMap and Leaflet
- **Smart Recommendations**: Get personalized location suggestions based on your preferences and search history
- **AI-Powered Search**: Natural language processing for intelligent place discovery using LangChain and Groq
- **Community Reviews**: Share and read reviews from other users about local places
- **Save Favorites**: Bookmark your favorite locations for quick access
- **Real-time Updates**: Track trending searches and popular places in your area

### 🎨 User Experience
- **Stunning Landing Page**: Typewriter effect welcome message with animated meteor shower background
- **Stranger Things Theme**: Retro 80s aesthetic with neon red color palette and flickering animations
- **3D Flip Card Authentication**: Smooth animated login/signup forms
- **Responsive Design**: Fully responsive interface that works on all devices
- **Dark Mode**: Eye-friendly dark theme throughout the application

### 🤖 AI Features
- **LLM-Powered Recommendations**: Intelligent place suggestions using Groq AI
- **Contextual Search**: Understand natural language queries for better results
- **Personalized Suggestions**: Learn from user behavior to improve recommendations
- **Trending Analysis**: Track and display popular search queries

## 🏗️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Lightning-fast build tool
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps
- **Leaflet Routing Machine** - Route planning
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client
- **React Hot Toast** - Beautiful notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Redis** - Caching layer
- **Cloudinary** - Image management

### AI & Data
- **LangChain** - LLM framework
- **Groq** - Fast AI inference
- **OpenStreetMap Nominatim** - Geocoding and place search
- **Custom Recommendation Engine** - Personalized suggestions

## 📁 Project Structure

```
TownXClone/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginSignup.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── MapPage.jsx
│   │   │   ├── RecommenderPage.jsx
│   │   │   └── StrangerMeteorBackground.jsx
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API services
│   │   ├── App.jsx          # Main app component
│   │   └── index.css        # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Express backend server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/           # Utility functions
│   │   ├── service/         # Business logic
│   │   ├── db/              # Database configuration
│   │   ├── openstreetmap/   # OSM integration & suggestion system
│   │   │   ├── server.js    # OSM API server (port 4000)
│   │   │   ├── agent.js     # LangChain agent
│   │   │   ├── llm-service.js
│   │   │   └── models/      # OSM-specific models
│   │   ├── recommender/     # AI recommendation engine
│   │   └── index.js         # Main server (port 8000)
│   └── package.json
│
├── setup.sh                  # Linux/Mac setup script
├── setup.bat                 # Windows setup script
└── PROJECT_README.md         # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas)
- **Redis** (optional, for caching)
- **Groq API Key** (for AI features)

### Installation

#### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

#### Option 2: Manual Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/TownX.git
cd TownX
```

2. **Setup Frontend**
```bash
cd frontend
npm install
```

3. **Setup Backend**
```bash
cd ../backend
npm install
```

4. **Setup OpenStreetMap Service**
```bash
cd src/openstreetmap
npm install
```

### Environment Configuration

#### Frontend (.env)
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_OSM_API_URL=http://localhost:4000/api
```

#### Backend (.env)
Create `backend/.env`:
```env
# Server Configuration
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/townx
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/townx

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=7d

# Email (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

#### OpenStreetMap Service (.env)
Create `backend/src/openstreetmap/.env`:
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/townx

# Groq AI
GROQ_API_KEY=your-groq-api-key-here

# Server
PORT=4000
```

### Running the Application

You need to run **three** services:

#### Terminal 1: Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

#### Terminal 2: Main Backend
```bash
cd backend
npm run dev
```
Backend API runs on: `http://localhost:8000`

#### Terminal 3: OpenStreetMap Service
```bash
cd backend/src/openstreetmap
npm run dev
```
OSM API runs on: `http://localhost:4000`

### Access the Application
Open your browser and navigate to: `http://localhost:5173`

## 🎮 Usage

### First Time User Flow
1. **Landing Page**: View the stunning meteor shower background and typewriter welcome
2. **Click "Enter TownX ⚡"**: Navigate to login/signup
3. **Create Account**: Sign up with email and password
4. **Explore**: Access the interactive map and start discovering places
5. **Search**: Use natural language to find places (e.g., "best coffee shops nearby")
6. **Save Favorites**: Bookmark places you like
7. **Leave Reviews**: Share your experiences with the community

### Key Features to Try
- **Smart Search**: Try queries like "romantic restaurants" or "quiet cafes for work"
- **AI Recommendations**: Get personalized suggestions based on your history
- **Interactive Map**: Click on markers to see place details
- **Trending Searches**: See what others in your area are looking for
- **Save & Review**: Build your personal collection of favorite spots

## 🔧 API Endpoints

### Main Backend (Port 8000)
- `POST /api/v1/user/register` - User registration
- `POST /api/v1/user/login` - User login
- `GET /api/v1/user/profile` - Get user profile
- `POST /api/v1/recommender/suggest` - Get AI recommendations

### OpenStreetMap Service (Port 4000)
- `POST /api/search` - Search for places
- `POST /api/get-suggestions` - Get personalized suggestions
- `POST /api/save-place` - Save a place to favorites
- `POST /api/unsave-place` - Remove from favorites
- `POST /api/rate-place` - Rate a place
- `POST /api/feedback` - Submit feedback
- `POST /api/reviews` - Create a review
- `GET /api/reviews/:placeId` - Get reviews for a place
- `GET /api/trending-searches` - Get trending searches
- `POST /api/track-search` - Track search query
- `GET /api/user-preferences/:userId` - Get user preferences

## 🎨 Customization

### Changing the Theme
The application uses a Stranger Things-inspired theme. To customize:

1. **Colors**: Edit `frontend/src/index.css` for global color variables
2. **Background**: Modify `StrangerMeteorBackground.jsx` for meteor colors and effects
3. **Typography**: Update font families in Tailwind config

### Adding New Features
1. Create new components in `frontend/src/components/`
2. Add routes in `frontend/src/App.jsx`
3. Create backend endpoints in `backend/src/routes/`
4. Add database models in `backend/src/models/`

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run lint
```

### Backend
```bash
cd backend
npm test
```

## 📦 Building for Production

### Frontend
```bash
cd frontend
npm run build
```
Build output will be in `frontend/dist/`

### Backend
```bash
cd backend
npm start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **OnlyBasics**
- **Harshvardhan Singh Chauhan**
- **Harsh Choudhary**
- **Ayush Agarwal**

## 
🙏 Acknowledgments

- OpenStreetMap for mapping data
- Groq for AI inference
- LangChain for LLM framework
- Stranger Things for design inspiration
- The open-source community

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Social features (friend system, sharing)
- [ ] Advanced filters and search
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Integration with more mapping services
- [ ] Voice search
- [ ] AR features for place discovery

---

**Made with ❤️ and ⚡ by OnlyBasics**
