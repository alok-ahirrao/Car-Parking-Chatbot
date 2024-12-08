const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController'); // Import the location controller

// Define route to get all locations
router.get('/', locationController.getAllLocations);

module.exports = router;