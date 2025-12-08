import React, { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const MapModal = ({ isOpen, onClose, agentData, userLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [markers, setMarkers] = useState([]);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    // Initialize map if not already done
    if (!map.current) {
      const defaultCenter = userLocation 
        ? [userLocation.latitude, userLocation.longitude] 
        : [28.6139, 77.209]; // Default: Delhi

      map.current = L.map(mapContainer.current).setView(defaultCenter, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add user location marker
      if (userLocation) {
        L.circleMarker(
          [userLocation.latitude, userLocation.longitude],
          {
            radius: 8,
            fillColor: "#3b82f6",
            color: "#1e40af",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8,
          }
        )
          .addTo(map.current)
          .bindPopup("Your Location");
      }
    }

    // Invalidate map size after modal animation
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
      }
    }, 100);

    return () => {
      // Don't destroy map on modal close, just hide
    };
  }, [isOpen, userLocation]);

  // Set initial search query from agent data
  useEffect(() => {
    if (agentData && agentData.searchQuery) {
      setSearchQuery(agentData.searchQuery);
      // Auto-trigger search
      handleSearch(agentData.searchQuery);
    }
  }, [agentData]);

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim() || !userLocation) {
      alert("Please enter a search query and ensure location is available");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/search-places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          query: query.trim(),
          limit: 20,
        }),
      });

      const data = await response.json();

      if (data.success && data.places) {
        setSearchResults(data.places);

        // Clear old markers
        markers.forEach((m) => m.remove());
        setMarkers([]);

        // Add new markers
        const newMarkers = [];
        data.places.forEach((place) => {
          const marker = L.marker(
            [place.latitude, place.longitude],
            {
              title: place.name,
            }
          )
            .addTo(map.current)
            .bindPopup(
              `<div style="max-width: 200px;">
                <h3 style="margin: 0 0 5px 0; font-weight: bold;">${place.name}</h3>
                <p style="margin: 0 0 5px 0; font-size: 0.9em;">${place.displayName}</p>
                <p style="margin: 0; font-size: 0.85em; color: #666;">Type: ${place.type}</p>
              </div>`
            );
          newMarkers.push(marker);
        });

        setMarkers(newMarkers);

        // Fit bounds if markers exist
        if (newMarkers.length > 0) {
          const group = new L.featureGroup(newMarkers);
          map.current.fitBounds(group.getBounds().pad(0.1));
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching places: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Place Finder Map</h2>
            {agentData && (
              <p className="text-sm text-gray-600 mt-1">
                Finding: {agentData.locationTypes?.join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(searchQuery)}
              placeholder="Search for places..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          <div
            ref={mapContainer}
            className="flex-1 rounded-lg"
            style={{ height: "100%" }}
          />

          {/* Results Sidebar */}
          <div className="w-80 border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                Results ({searchResults.length})
              </h3>
              {searchResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {isLoading ? "Searching..." : "No results found"}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((place) => (
                    <div
                      key={place.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition"
                      onClick={() => {
                        // Center map on this place
                        if (map.current) {
                          map.current.setView([place.latitude, place.longitude], 16);
                        }
                      }}
                    >
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {place.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {place.displayName}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {place.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(
                            Math.sqrt(
                              Math.pow(place.latitude - userLocation.latitude, 2) +
                                Math.pow(
                                  place.longitude - userLocation.longitude,
                                  2
                                )
                            ) * 111
                          ).toFixed(1)}{" "}
                          km
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
