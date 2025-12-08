import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const reviewSchema = new Schema(
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

export default models.Review || model('Review', reviewSchema);