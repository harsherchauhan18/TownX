import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Get recent reviews (all users)
export const getRecentReviews = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    throw error;
  }
};

// Get reviews for a specific user
export const getUserReviews = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    throw error;
  }
};

// Get a specific review by ID
export const getReviewById = async (reviewId) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching review:", error);
    throw error;
  }
};
