import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MapPin, MessageCircle, Plus, Menu } from "lucide-react";
import MapModal from "../components/MapModal";
import axios from "axios";

const RecommenderPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [agentData, setAgentData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const messagesEndRef = useRef(null);

  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Default location
          setUserLocation({
            latitude: 28.6139,
            longitude: 77.209,
          });
        }
      );
    } else {
      // Default location
      setUserLocation({
        latitude: 28.6139,
        longitude: 77.209,
      });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const examplePrompts = [
    { icon: "☕", text: "Find cafes nearby" },
    { icon: "🍕", text: "Show me restaurants" },
    { icon: "🏨", text: "Hotels in the area" },
    { icon: "⛽", text: "Gas stations nearby" },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoadingAgent(true);
    setIsTyping(true);

    try {
      // Call agent endpoint
      const response = await axios.post("http://localhost:8000/api/v1/recommender/agent-search", {
        userQuery: userMessage.content,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });

      if (response.data.success) {
        const agentResult = response.data;

        // Store agent data for map
        setAgentData(agentResult.agent);

        // Add AI response with search details
        const aiMessage = {
          role: "assistant",
          content: agentResult.instructions.message,
          agentData: agentResult.agent,
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Auto-open map modal
        setTimeout(() => {
          setMapOpen(true);
        }, 500);
      } else {
        const errorMessage = {
          role: "assistant",
          content: `I couldn't process your request: ${response.data.error}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Agent error:", error);
      const errorMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Make sure the backend is running on localhost:8000`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoadingAgent(false);
    }
  };

  const handlePromptClick = (text) => {
    setInput(text);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-700 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Sidebar */}
      <div
        className={`relative z-10 bg-gray-900 bg-opacity-80 backdrop-blur-sm border-r border-blue-600 border-opacity-20 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg shadow-blue-600/50">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-400">PlaceFinder</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              setMessages([]);
              setInput("");
              setAgentData(null);
            }}
            className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" />
            New Search
          </button>

          {/* Recent Searches */}
          <div className="flex-1 overflow-y-auto">
            <div className="text-xs text-blue-400 text-opacity-50 mb-2 font-semibold">
              QUICK SEARCHES
            </div>
            <div className="space-y-2">
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt.text)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-blue-600 bg-opacity-10 hover:bg-opacity-20 transition text-sm text-blue-300 hover:text-blue-200 truncate border border-blue-600 border-opacity-20 hover:border-opacity-40"
                  title={prompt.text}
                >
                  <span className="mr-2">{prompt.icon}</span>
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>

          {/* Location Display */}
          {userLocation && (
            <div className="mt-4 p-3 bg-blue-600 bg-opacity-10 rounded-lg border border-blue-600 border-opacity-20 text-xs">
              <p className="text-blue-300 mb-1">📍 Current Location</p>
              <p className="text-blue-400">
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-5">
        {/* Header */}
        <div className="border-b border-blue-600 border-opacity-20 bg-gray-900 bg-opacity-40 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-600 hover:bg-opacity-20 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-blue-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Place Recommender AI</h1>
              <p className="text-xs text-blue-300">Powered by LangGraph & OpenStreetMap</p>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="mb-8">
                <MessageCircle className="w-16 h-16 text-blue-400 mx-auto opacity-30 mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to PlaceFinder</h2>
              <p className="text-gray-400 text-center max-w-md mb-8">
                Ask me to find places nearby! I'll use AI to understand what you're looking for and show you a map with results.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt.text);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="px-4 py-3 bg-blue-600 bg-opacity-20 hover:bg-opacity-40 border border-blue-600 border-opacity-40 hover:border-opacity-60 rounded-lg transition text-center text-blue-200 text-sm"
                  >
                    <span className="block text-lg mb-1">{prompt.icon}</span>
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none"
                    : "bg-gray-700 bg-opacity-50 text-gray-100 rounded-bl-none border border-blue-600 border-opacity-20"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.agentData && (
                  <div className="mt-2 pt-2 border-t border-white border-opacity-20 text-xs text-opacity-80">
                    <p>🔍 Search: {message.agentData.searchKeywords.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-700 bg-opacity-50 text-gray-100 px-4 py-3 rounded-lg rounded-bl-none border border-blue-600 border-opacity-20">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-blue-600 border-opacity-20 bg-gray-900 bg-opacity-40 backdrop-blur-sm px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoadingAgent && handleSend()}
              placeholder="Ask me to find places... (e.g., 'Find cafes nearby')"
              disabled={isLoadingAgent}
              className="flex-1 bg-gray-800 bg-opacity-50 border border-blue-600 border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:border-opacity-100 transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoadingAgent}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: The agent will automatically open a map with search results
          </p>
        </div>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        agentData={agentData}
        userLocation={userLocation}
      />
    </div>
  );
};

export default RecommenderPage;
