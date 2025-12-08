import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'anonymous' },
    placeId: { type: String, required: true },
    placeName: { type: String, required: true },
    category: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
