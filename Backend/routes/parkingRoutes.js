// routes/parkingRoutes.js
const express = require("express");
const {
  addNumberPlate,
  bookParkingDate,
  allocateParkingSlot,
  updateBookingTimes,
  getNumberPlates,
} = require("../controllers/parkingController");
const auth = require("../middleware/auth");

const router = express.Router();

// Route to add a number plate
router.post("/numberplate", auth, addNumberPlate);

// Route to get user's number plates
router.get("/numberplate", auth, getNumberPlates);

// Route to book a parking date
router.post("/book/date", auth, bookParkingDate);

// Route to update entry and exit times
router.post("/book/times", auth, updateBookingTimes);

module.exports = router;
