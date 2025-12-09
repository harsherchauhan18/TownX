import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, Zap, Shield, Menu, Plus, MapPin } from "lucide-react";
import Balatro from "./Balatro";

const StrangerThingsHome = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const examplePrompts = [
    { icon: "🔦", text: "What's happening in Hawkins?" },
    { icon: "🎮", text: "Tell me about the Upside Down" },
    { icon: "🎯", text: "Create a D&D campaign" },
    { icon: "💡", text: "Explain the Mind Flayer" }
  ];

  const conversations = [
    { title: "Hawkins Lab Investigation", time: "2h ago" },
    { title: "Upside Down Research", time: "Yesterday" },
    { title: "Party Strategy Session", time: "3 days ago" }
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "Welcome to Hawkins! I'm here to help you investigate strange occurrences and answer your questions about the Upside Down.",
        "Eleven here! Well, actually I'm your AI assistant. What would you like to know about the supernatural?",
        "Friends don't lie. I'm detecting your query. Let me analyze the situation and provide you with the best possible response.",
        "The Party would be proud! Let's tackle this mystery together. How can I assist you today?"
      ];
      
      const aiMessage = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)]
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handlePromptClick = (text) => {
    setInput(text);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Balatro Animated Background */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.4 }}>
        <Balatro 
          color1="#DE443B"
          color2="#8B0000"
          color3="#1a0000"
          spinRotation={-2.0}
          spinSpeed={5.0}
          contrast={3.5}
          lighting={0.3}
          spinAmount={0.25}
          isRotate={true}
          mouseInteraction={true}
        />
      </div>

      {/* Sidebar */}
      <div 
        className={`relative z-20 bg-gray-900 bg-opacity-80 backdrop-blur-sm border-r border-red-600 border-opacity-20 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/50">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold neon-red retro-title">Hawkins Lab</span>
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

          {/* Place Recommender Button */}
          <button
            onClick={() => navigate("/recommender")}
            className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-blue-600/30"
          >
            <MapPin className="w-5 h-5" />
            Place Finder
          </button>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            <div className="text-xs text-red-500 text-opacity-50 mb-2 font-semibold">RECENT INVESTIGATIONS</div>
            <div className="space-y-2">
              {conversations.map((conv, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-black bg-opacity-40 border border-red-600 border-opacity-20 cursor-pointer hover:bg-opacity-60 transition-all"
                >
                  <div className="text-sm text-red-400 font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-red-500 text-opacity-50 mt-1">{conv.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-4 border-t border-red-600 border-opacity-20">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:bg-opacity-40 cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-400">Party Member</div>
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
            <h1 className="text-lg font-bold neon-red retro-title">Hawkins AI Assistant</h1>
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
                  WELCOME TO HAWKINS
                </h2>
                <p className="text-xl text-red-400 text-opacity-70 mb-2">
                  Strange things are happening...
                </p>
                <p className="text-sm text-red-500 text-opacity-50">
                  Your AI-powered investigator is ready to help
                </p>
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

              {/* Features */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-red-600 bg-opacity-20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-sm font-semibold text-red-400 mb-1">Lightning Fast</div>
                  <div className="text-xs text-red-500 text-opacity-50">Instant responses from the Upside Down</div>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-red-600 bg-opacity-20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-sm font-semibold text-red-400 mb-1">Secure & Private</div>
                  <div className="text-xs text-red-500 text-opacity-50">Your secrets are safe with us</div>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-red-600 bg-opacity-20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-sm font-semibold text-red-400 mb-1">Always Learning</div>
                  <div className="text-xs text-red-500 text-opacity-50">Evolving with every mystery</div>
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
                placeholder="Send a message to Hawkins Lab..."
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
              Powered by Hawkins Lab • AI Assistant v1.983
            </div>
          </div>
        </div>
      </div>

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