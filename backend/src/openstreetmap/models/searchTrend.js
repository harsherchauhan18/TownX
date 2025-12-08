import { Schema, model } from 'mongoose';

const searchTrendSchema = new Schema(
  {
    query: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    count: {
      type: Number,
      default: 1,
      min: 1
    },
    category: {
      type: String,
      default: null
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for trending queries (sort by count descending, date descending)
searchTrendSchema.index({ count: -1, lastSearchedAt: -1 });

export default model('SearchTrend', searchTrendSchema);
