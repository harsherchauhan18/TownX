import Review from "../models/review.models.js";

/**
 * Get all reviews for a user
 */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    console.log("📝 Fetching reviews for user:", userId);

    // Fetch reviews sorted by most recent first
    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log(`✅ Found ${reviews.length} reviews`);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        count: reviews.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch reviews",
    });
  }
};

/**
 * Get all recent reviews (for all users)
 */
export const getRecentReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    console.log("📝 Fetching recent reviews, limit:", limit);

    // Fetch recent reviews sorted by most recent first
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(`✅ Found ${reviews.length} reviews`);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        count: reviews.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch reviews",
    });
  }
};

/**
 * Get a single review by ID
 */
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📝 Fetching review by ID:", id);

    const review = await Review.findById(id).lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    console.log("✅ Review found");

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("❌ Error fetching review:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch review",
    });
  }
};
