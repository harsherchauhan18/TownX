import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, Zap, Shield, Menu, Plus, MapPin, Loader, LogOut } from "lucide-react";
import { detectLocationType } from "../services/locationAgent";
import { getChatResponse } from "../services/llmService";
import { getUserReviews } from "../services/reviewService";
import { useAuth } from "../context/AuthContext";
import ReviewModal from "../components/ReviewModal";

const StrangerThingsHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [locationSearchInput, setLocationSearchInput] = useState("");
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user's reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?._id) {
        console.log("⚠️ No user ID available yet");
        return;
      }
      
      try {
        console.log("📝 Fetching reviews for user:", user._id);
        const response = await getUserReviews(user._id);
        if (response.success) {
          console.log("✅ Fetched reviews:", response.data.reviews.length);
          setReviews(response.data.reviews);
          
          // If no reviews found for this user, try fetching default_user reviews as fallback
          if (response.data.reviews.length === 0) {
            console.log("⚠️ No user-specific reviews, fetching default_user reviews");
            const defaultResponse = await getUserReviews("default_user");
            if (defaultResponse.success) {
              console.log("✅ Fetched default reviews:", defaultResponse.data.reviews.length);
              setReviews(defaultResponse.data.reviews);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch reviews:", error);
      }
    };

    fetchReviews();
  }, [user]);

  const examplePrompts = [
    { icon: "🗺️", text: "Tell me about Central Park" },
    { icon: "🏛️", text: "What are the best museums in Paris?" },
    { icon: "🍕", text: "Find me Italian restaurants nearby" },
    { icon: "🏨", text: "Recommend hotels in Tokyo" }
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get response from LLM
      const aiResponseText = await getChatResponse(input, conversationHistory);
      
      const aiMessage = {
        role: "assistant",
        content: aiResponseText,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptClick = (text) => {
    setInput(text);
  };

  const handleLocationSearch = async () => {
    if (!locationSearchInput.trim()) return;

    setIsLoadingAgent(true);
    try {
      // Call the location agent to detect type
      const result = await detectLocationType(locationSearchInput);
      
      if (result.success) {
        const locationType = result.data.validatedLocationType;
        
        // Store the detected location type in sessionStorage
        sessionStorage.setItem("agentDetectedLocationType", locationType);
        
        // Navigate to map page
        navigate("/map");
        
        // The map will read from sessionStorage and auto-search
      } else {
        console.error("Agent error:", result.error);
        alert("Failed to detect location type. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error processing your request. Please try again.");
    } finally {
      setIsLoadingAgent(false);
      setLocationSearchInput("");
    }
  };

  const handleReviewClick = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Navigate to login anyway
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-700 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <div 
        className={`relative z-10 bg-gray-900 bg-opacity-80 backdrop-blur-sm border-r border-red-600 border-opacity-20 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/50">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold neon-red retro-title">TownX AI</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              setMessages([]);
              setInput("");
            }}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-red-600/30"
          >
            <Plus className="w-5 h-5" />
            New Investigation
          </button>

          {/* Map Tab Button */}
          <button
            onClick={() => navigate("/map")}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-blue-600/30"
          >
            <MapPin className="w-5 h-5" />
            Map Viewer
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform hover:from-red-700 hover:to-red-800"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>

          {/* Location Agent Search */}
          <div className="mb-6 p-4 bg-blue-600 bg-opacity-20 border border-blue-600 border-opacity-40 rounded-lg">
            <label className="text-xs text-blue-400 font-semibold block mb-2">🤖 AI LOCATION FINDER</label>
            <input
              type="text"
              value={locationSearchInput}
              onChange={(e) => setLocationSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoadingAgent && handleLocationSearch()}
              placeholder="e.g., 'Find cafes', 'Show me hotels'"
              className="w-full px-3 py-2 bg-black bg-opacity-60 border border-blue-600 border-opacity-30 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 outline-none mb-2"
              disabled={isLoadingAgent}
            />
            <button
              onClick={handleLocationSearch}
              disabled={!locationSearchInput.trim() || isLoadingAgent}
              className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoadingAgent ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
            <p className="text-xs text-blue-300 text-opacity-60 mt-2">AI will detect location type & auto-search</p>
          </div>

          {/* Reviews */}
          <div className="flex-1 overflow-y-auto">
            <div className="text-xs text-red-500 text-opacity-50 mb-2 font-semibold">RECENT INVESTIGATIONS</div>
            <div className="space-y-2">
              {reviews.length === 0 ? (
                <div className="p-3 text-xs text-red-500 text-opacity-40 text-center">
                  No reviews yet
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review._id}
                    onClick={() => handleReviewClick(review)}
                    className="p-3 rounded-lg bg-black bg-opacity-40 border border-red-600 border-opacity-20 cursor-pointer hover:bg-opacity-60 transition-all"
                  >
                    <div className="text-sm text-red-400 font-medium truncate">{review.placeName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-600"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-red-500 text-opacity-50">{formatTimestamp(review.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-4 border-t border-red-600 border-opacity-20">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:bg-opacity-40 cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-400">{user?.email || "Guest User"}</div>
                <div className="text-xs text-red-500 text-opacity-50">Active Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="h-16 border-b border-red-600 border-opacity-20 flex items-center px-6 bg-gray-900 bg-opacity-60 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-red-600 hover:bg-opacity-10 rounded-lg transition-all"
          >
            <Menu className="w-5 h-5 text-red-400" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold neon-red retro-title">TownX AI Assistant</h1>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              {/* Welcome Section */}
              <div className="text-center mb-12 animate-fadeIn">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-600/50 animate-spin" style={{ animationDuration: '20s' }}>
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-5xl font-black neon-red mb-4 retro-title flicker">
                  WELCOME TO TOWNX
                </h2>
                <p className="text-xl text-red-400 text-opacity-70 mb-2">
                  Your AI Location Assistant
                </p>
                <p className="text-sm text-red-500 text-opacity-50">
                  Ask about places, get recommendations, or find locations near you
                </p>
                
                {/* Quick Info Badges */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span className="px-4 py-2 bg-red-600 bg-opacity-20 border border-red-600 border-opacity-40 rounded-full text-xs text-red-300">
                    🗺️ Location Details
                  </span>
                  <span className="px-4 py-2 bg-red-600 bg-opacity-20 border border-red-600 border-opacity-40 rounded-full text-xs text-red-300">
                    🔍 Find Places
                  </span>
                  <span className="px-4 py-2 bg-red-600 bg-opacity-20 border border-red-600 border-opacity-40 rounded-full text-xs text-red-300">
                    💡 Get Recommendations
                  </span>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptClick(prompt.text)}
                    className="p-6 bg-gradient-to-br from-gray-800 to-black border-2 border-red-600 border-opacity-30 rounded-2xl hover:border-opacity-60 hover:scale-[1.02] transition-all text-left group"
                  >
                    <div className="text-3xl mb-3">{prompt.icon}</div>
                    <div className="text-red-400 font-semibold group-hover:text-red-300 transition-colors">
                      {prompt.text}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Help Text */}
              <div className="mt-8 p-4 bg-blue-600 bg-opacity-10 border border-blue-600 border-opacity-30 rounded-xl">
                <p className="text-sm text-blue-300 text-center">
                  💬 <strong>Try asking:</strong> "Tell me about Times Square" or "What's special about the Eiffel Tower?" or "Find cafes near me"
                </p>
              </div>

              {/* Features */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-red-600 bg-opacity-20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-sm font-semibold text-red-400 mb-1">Location Intelligence</div>
                  <div className="text-xs text-red-500 text-opacity-50">Get detailed info about any place</div>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-red-600 bg-opacity-20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-sm font-semibold text-red-400 mb-1">Smart Discovery</div>
                  <div className="text-xs text-red-500 text-opacity-50">Find places with AI assistance</div>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-red-600 bg-opacity-20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-sm font-semibold text-red-400 mb-1">Context Aware</div>
                  <div className="text-xs text-red-500 text-opacity-50">Remembers your conversation</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 animate-fadeIn ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-red-600 to-red-700 text-white"
                        : "bg-gray-800 bg-opacity-60 border border-red-600 border-opacity-30 text-red-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4 animate-fadeIn">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-800 bg-opacity-60 border border-red-600 border-opacity-30 p-4 rounded-2xl">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-red-600 border-opacity-20 p-6 bg-gray-900 bg-opacity-60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about locations, get recommendations, or find places..."
                className="w-full px-6 py-4 pr-14 bg-black bg-opacity-60 rounded-2xl text-white border-2 border-red-600 border-opacity-30 focus:border-red-600 outline-none text-base transition-all"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center transition-all shadow-lg shadow-red-600/30 ${
                  input.trim() && !isTyping
                    ? "opacity-100 hover:scale-105 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="mt-3 text-center text-xs text-red-500 text-opacity-40">
              Powered by TownX • AI Location Assistant • Groq LLM
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        review={selectedReview}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReview(null);
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StrangerThingsHome;
