import { Router } from "express";
import {
  getUserReviews,
  getRecentReviews,
  getReviewById,
} from "../controllers/reviewController.js";

const router = Router();

// Get recent reviews (all users)
router.get("/recent", getRecentReviews);

// Get reviews by user ID
router.get("/user/:userId", getUserReviews);

// Get review by ID
router.get("/:id", getReviewById);

export default router;
