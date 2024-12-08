const express = require("express");
const axios = require("axios");
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const FormData = require("form-data");
const User = require("../models/User"); // Ensure the User model is imported

const router = express.Router();
const upload = multer(); // Use multer for handling multipart form data

// Endpoint to handle manual entry of license plate
// Endpoint to handle manual entry of license plate
router.post("/manual-plate", authMiddleware, async (req, res) => {
  try {
    const { licensePlate } = req.body; // Expect the license plate in the body of the request
    const userId = req.user.id;

    if (!licensePlate) {
      return res.status(400).json({ message: "License plate is required" });
    }

    // Retrieve the user from MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure numberPlates array exists
    if (!user.numberPlates) {
      user.numberPlates = []; // Initialize it as an empty array if not defined
    }

    // Add the manual plate if not already included
    if (!user.numberPlates.includes(licensePlate)) {
      user.numberPlates.push(licensePlate); // Add the new plate
    }

    await user.save(); // Save the updated user
    return res.json({ message: "Manual plate added successfully", numberPlates: user.numberPlates });

  } catch (error) {
    console.error("Error adding manual plate:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Endpoint to send image to FastAPI microservice for plate detection
router.post("/detect-plate", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const userId = req.user.id;
    const imageBuffer = req.file.buffer;

    // Prepare form-data for sending the image to FastAPI
    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "image.jpg", // Specify a filename
      contentType: req.file.mimetype // Use the file's mimetype
    });

    // Send the image to FastAPI as multipart/form-data
    const response = await axios.post("http://localhost:8000/detect", formData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        ...formData.getHeaders() // Use formData headers for multipart handling
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Check response from FastAPI
    if (response.data.detected_plates) {
      const detectedPlates = response.data.detected_plates;

      // Retrieve the user from MongoDB
      const user = await User.findById(userId);
      if (user) {
        // Ensure numberPlates array exists
        if (!user.numberPlates) {
          user.numberPlates = []; // Initialize it as an empty array if not defined
        }

        // Add detected plates to numberPlates array if not already included
        detectedPlates.forEach((plate) => {
          if (!user.numberPlates.includes(plate)) {
            user.numberPlates.push(plate); // Add new plates to user
          }
        });

        await user.save();
        return res.json({ message: "Plates added successfully", detectedPlates });
      } else {
        return res.status(404).json({ message: "User not found." });
      }
    } else {
      return res.status(400).json({ message: "No valid license plates detected." });
    }
  } catch (error) {
    console.error("Error detecting plate:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
