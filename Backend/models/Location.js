const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }
});

// Explicitly specify the collection name as 'location' (singular)
const Location = mongoose.model('Location', locationSchema, 'location');

module.exports = Location;