import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StrangerMeteorBackground from './StrangerMeteorBackground';

const LandingPage = () => {
  const navigate = useNavigate();
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Welcome to TownX';
  const [currentIndex, setCurrentIndex] = useState(0);

  // Typewriter effect
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100); // Adjust speed here (100ms per character)

      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  const features = [
    {
      icon: '🗺️',
      title: 'Interactive Maps',
      description: 'Explore your town with our advanced mapping system and discover hidden gems'
    },
    {
      icon: '🎯',
      title: 'Smart Recommendations',
      description: 'Get personalized suggestions based on your preferences and location'
    },
    {
      icon: '👥',
      title: 'Community Hub',
      description: 'Connect with locals and share your favorite spots in town'
    },
    {
      icon: '⚡',
      title: 'Real-time Updates',
      description: 'Stay informed with live updates about events and activities nearby'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Meteor Shower Background */}
      <StrangerMeteorBackground />

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          {/* Typewriter Title */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 neon-red retro-title">
            {displayedText}
            <span className="animate-blink">|</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-red-300 text-opacity-80 mb-8 max-w-2xl mx-auto">
            Your ultimate guide to exploring and connecting with your community
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/login')}
            className="px-12 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xl rounded-xl shadow-lg shadow-red-600/50 transition-all duration-300 hover:scale-105 hover:shadow-red-600/70 active:scale-95 border-2 border-red-500"
          >
            Enter TownX ⚡
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-800 via-black to-gray-800 border-2 border-red-600 border-opacity-30 rounded-2xl p-6 shadow-xl shadow-red-600/10 transition-all duration-300 hover:border-opacity-60 hover:shadow-red-600/30 hover:scale-105 animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-4 text-center">{feature.icon}</div>
              <h3 className="text-xl font-bold text-red-400 mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-red-300 text-opacity-70 text-center text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Tagline */}
        <div className="text-center mt-16 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <p className="text-red-400 text-opacity-50 text-sm font-semibold tracking-widest">
            STRANGER THINGS ⚡ POWERED BY TOWNX
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-blink {
          animation: blink 1s infinite;
        }

        .neon-red {
          color: #ff0000;
          text-shadow: 
            0 0 10px rgba(255, 0, 0, 0.8),
            0 0 20px rgba(255, 0, 0, 0.6),
            0 0 30px rgba(255, 0, 0, 0.4),
            0 0 40px rgba(255, 0, 0, 0.2);
        }

        .retro-title {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
