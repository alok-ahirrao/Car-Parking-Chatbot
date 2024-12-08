// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    numberPlate: { type: String, required: true },
    location:{type:String,required:true },
    date: { type: Date, required: true },
  
    entryTime: { type: String, required: true },
    exitTime: { type: String, required: true },
    slotNumber: { type: Number, required: true }
});

module.exports = mongoose.model('Booking', bookingSchema);
