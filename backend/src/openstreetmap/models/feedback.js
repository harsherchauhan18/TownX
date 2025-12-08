import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const feedbackSchema = new Schema(
  {
    userId: { type: String, default: 'default_user' },
    placeId: { type: String, required: true },
    placeName: { type: String, required: true },
    category: { type: String },
    feedbackType: { type: String, enum: ['positive', 'negative'], required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

export default models.Feedback || model('Feedback', feedbackSchema);