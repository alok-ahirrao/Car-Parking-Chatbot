const Location = require("../models/Location"); // Ensure you're importing the model correctly

// Function to get all locations
// Function to get all locations
exports.getAllLocations = async (req, res) => {
    try {
      // Query the database to find all locations
      const locations = await Location.find();
  
      // If no locations are found
      if (locations.length === 0) {
        return res.status(404).json({ message: 'No locations found' });
      }
  
      // Return the list of locations
      res.status(200).json(locations);
    } catch (error) {
      // Catch any errors and send a response
      res.status(500).json({ message: 'Failed to retrieve locations', error: error.message });
    }
  };