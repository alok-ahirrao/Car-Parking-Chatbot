// controllers/parkingController
const User = require("../models/User");
const Booking = require("../models/Booking");

// Function to randomly allocate a parking slot (for example purposes)
const allocateRandomSlot = (maxSlots) => {
  return Math.floor(Math.random() * maxSlots) + 1; // Generates a random number between 1 and maxSlots
};

// Fetch user's number plates
exports.getNumberPlates = async (req, res) => {
  
  try {
    const user = await User.findById(req.user.id).select('numberPlates');
    res.json({ numberPlates: user.numberPlates || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Book parking date (after checking available slots)
// Book parking date (after checking available slots)
exports.bookParkingDate = async (req, res) => {
  const { date, numberPlate, location,entryTime, exitTime } = req.body;

  try {
    // Check if number plate is valid
    const user = await User.findById(req.user.id);
    if (!user.numberPlates.includes(numberPlate)) {
      return res.status(400).json({ message: "Invalid number plate" });
    }

    // Check if the date is already booked
    const existingBooking = await Booking.findOne({ date, numberPlate });
    if (existingBooking) {
      return res.status(400).json({ message: "This date is already booked" });
    }

    // Randomly allocate a slot number (assume there are 10 slots available)
    const slotNumber = allocateRandomSlot(10); // Modify this number as needed

    // Create a new booking
    const booking = new Booking({
      userId: req.user.id,
      date,
      numberPlate,
      location,
      slotNumber, // Assign the randomly allocated slot number
      entryTime, // Set the entryTime from the request
      exitTime, // Set the exitTime from the request
    });

    await booking.save();
    res.status(200).json({
      message: "Booking confirmed",
      bookingId: booking._id,
      slotNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update entry and exit times for a booking
exports.updateBookingTimes = async (req, res) => {
  const { bookingId, entryTime, exitTime } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update entry and exit times
    booking.entryTime = entryTime;
    booking.exitTime = exitTime;

    await booking.save();
    res.status(200).json({
      message: "Entry and exit times updated successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Function to add a number plate (if needed)
exports.addNumberPlate = async (req, res) => {
  const { numberPlate } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add number plate to user's list
    user.numberPlates.push(numberPlate);
    await user.save();

    res.status(201).json({ message: "Number plate added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
