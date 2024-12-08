// app.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const locationRoutes = require("./routes/locationRoutes");
const bodyParser = require("body-parser");
const platesRouter = require("./routes/plateRoutes");

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes); // Example route
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error: ", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/parking", platesRouter);
app.use('/api/locations', locationRoutes)

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
