const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
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

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
