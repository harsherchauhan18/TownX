import React from "react";
import { X, Star, MapPin, Calendar, User } from "lucide-react";

const ReviewModal = ({ review, isOpen, onClose }) => {
  if (!isOpen || !review) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-600 border-opacity-40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-red-600/30 animate-fadeIn">
          {/* Header */}
          <div className="p-6 border-b border-red-600 border-opacity-30 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-red-400">Review Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-600 hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X className="w-6 h-6 text-red-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Place Name */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {review.placeName}
                  </h3>
                  {review.category && (
                    <span className="inline-block px-3 py-1 bg-red-600 bg-opacity-20 border border-red-600 border-opacity-40 rounded-full text-xs text-red-300">
                      {review.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <label className="text-sm text-red-400 font-semibold mb-2 block">
                Rating
              </label>
              <div className="flex items-center gap-3">
                {renderStars(review.rating)}
                <span className="text-lg font-bold text-white">
                  {review.rating}/5
                </span>
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <div className="mb-6">
                <label className="text-sm text-red-400 font-semibold mb-2 block">
                  Comment
                </label>
                <div className="p-4 bg-gray-800 bg-opacity-60 border border-red-600 border-opacity-20 rounded-lg">
                  <p className="text-white leading-relaxed">{review.comment}</p>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="mb-6">
              <label className="text-sm text-red-400 font-semibold mb-2 block">
                Reviewer
              </label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-400" />
                <span className="text-white">
                  {review.userId === "anonymous" ? "Anonymous User" : review.userId}
                </span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="mb-6">
              <label className="text-sm text-red-400 font-semibold mb-2 block">
                Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-400" />
                <span className="text-white">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>

            {/* Place ID */}
            <div>
              <label className="text-sm text-red-400 font-semibold mb-2 block">
                Place ID
              </label>
              <code className="px-3 py-2 bg-black bg-opacity-40 border border-red-600 border-opacity-20 rounded text-xs text-red-300 block overflow-x-auto">
                {review.placeId}
              </code>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-red-600 border-opacity-30 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:scale-105 transition-transform shadow-lg shadow-red-600/30"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewModal;
