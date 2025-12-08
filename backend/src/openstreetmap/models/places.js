const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const PlaceSchema = new Schema({
  placeId: { type: String, index: true, unique: false },
  name: String,
  lat: Number,
  lon: Number,
  tags: [String],
  description: String,
  avg_rating: Number,
  n_ratings: Number,
  embedding: { type: [Number], default: [] } // optional persisted embedding
}, { timestamps: true });

module.exports = model('Place', PlaceSchema);