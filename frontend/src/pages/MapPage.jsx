import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Home } from "lucide-react";

const MapPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const iframeRef = React.useRef(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const detectedTypeRef = React.useRef(null);

  // Capture the detected type on mount (before it gets cleared)
  React.useEffect(() => {
    const detectedType = sessionStorage.getItem("agentDetectedLocationType");
    if (detectedType) {
      console.log('📍 MapPage: Captured detected type on mount:', detectedType);
      detectedTypeRef.current = detectedType;
      // Clear immediately after capturing
      sessionStorage.removeItem("agentDetectedLocationType");
    }
  }, []); // Only run once on mount

  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log('📍 MapPage: iframe loaded event triggered');
    setIframeLoaded(true);
  };

  // Auto-search for detected location type
  React.useEffect(() => {
    const detectedType = detectedTypeRef.current;
    
    if (!detectedType) {
      console.log('📍 MapPage: No detected type available');
      return;
    }

    if (!iframeRef.current) {
      console.error('📍 MapPage: iframe ref not available');
      return;
    }

    if (!iframeLoaded) {
      console.log('📍 MapPage: iframe not loaded yet, will send when ready');
      return;
    }

    console.log('📍 MapPage: iframe is loaded, sending message');
    
    // Function to send message
    const sendMessage = () => {
      try {
        if (!iframeRef.current) {
          console.error('📍 MapPage: iframe ref is null');
          return;
        }
        
        const message = {
          type: "AUTO_SEARCH",
          locationType: detectedType,
        };
        
        console.log('📍 MapPage: Sending message to iframe:', message);
        iframeRef.current.contentWindow.postMessage(message, "*");
        console.log('📍 MapPage: postMessage sent successfully');
      } catch (error) {
        console.error("📍 MapPage: Error posting message:", error.message);
      }
    };

    sendMessage();
    
  }, [iframeLoaded]);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`relative z-10 bg-gray-900 bg-opacity-80 backdrop-blur-sm border-r border-blue-600 border-opacity-20 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden flex flex-col`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg shadow-blue-600/50">
              <span className="text-lg">🗺️</span>
            </div>
            <span className="text-xl font-bold text-blue-400">TownX Maps</span>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => navigate("/")}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-red-600/30"
          >
            <Home className="w-5 h-5" />
            Home
          </button>

          {/* Info Section */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs text-blue-400 text-opacity-50 mb-4 font-semibold">
              MAP INFORMATION
            </div>
            
            <div className="bg-blue-600 bg-opacity-10 rounded-lg border border-blue-600 border-opacity-20 p-4 space-y-3">
              <div>
                <p className="text-blue-300 text-sm font-semibold mb-1">📍 Features</p>
                <ul className="text-xs text-blue-300 text-opacity-70 space-y-1">
                  <li>• Search nearby places</li>
                  <li>• View map markers</li>
                  <li>• Get directions</li>
                  <li>• Filter by category</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-purple-600 bg-opacity-10 rounded-lg border border-purple-600 border-opacity-20 p-4">
              <p className="text-purple-300 text-sm font-semibold mb-2">💡 How to Use</p>
              <p className="text-xs text-purple-300 text-opacity-70">
                Use the search box to find places, click on categories to filter results, and interact with the map to explore your area.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-blue-600 border-opacity-20 text-xs text-blue-300 text-opacity-50 text-center">
            <p>Powered by OpenStreetMap</p>
            <p className="mt-1">& Leaflet.js</p>
          </div>
        </div>
      </div>

      {/* Main Content - Map */}
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
              <h1 className="text-xl font-bold text-white">OpenStreetMap Viewer</h1>
              <p className="text-xs text-blue-300">Find places near you</p>
            </div>
          </div>
        </div>

        {/* Map Container - Full Height */}
        <div className="flex-1 relative overflow-hidden">
          <iframe
            ref={iframeRef}
            src="http://localhost:4000"
            className="w-full h-full border-none"
            title="OpenStreetMap Viewer"
            allow="geolocation"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
