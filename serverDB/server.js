const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

mongoose
  .connect("mongodb://127.0.0.1:27017/aigardener")
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// SCHEMA MONGOOSE
const plantSchema = new mongoose.Schema({
  userId: String,
  name: { type: String, required: true },
  species: String,
  location: String,
  imageBase64: String,
  watering: {
    enabled: Boolean,
    frequency: Number,
    time: String,
    notificationId: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const Plant = mongoose.model("Plant", plantSchema);

// API ROUTE
app.post("/add-plant", async (req, res) => {
  try {
    const {
      userId,
      name,
      species,
      location,
      remindersActive,
      frequency,
      preferredTime,
      imageBase64,
      notificationId
    } = req.body;

    const newPlant = new Plant({
      userId: userId,
      name: name,
      species: species,
      location: location,
      imageBase64: imageBase64,
      watering: {
        enabled: remindersActive,
        frequency: remindersActive ? frequency : null,
        time: remindersActive ? preferredTime : null,
        notificationId: remindersActive ? notificationId : null,
      },
    });

    await newPlant.save();
    console.log(`✅ Plant saved: ${name}`);
    res.status(201).json({ message: "Success! Plant is in the database." });
  } catch (error) {
    console.error("❌ Error saving plant:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Show all plants for a user
app.get("/plants", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId!" });
    }

    console.log(`📥 Fetching plants for user: ${userId}`);
    const plants = await Plant.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(plants); 
  } catch (error) {
    console.error("Error reading plants:", error);
    res.status(500).json({ error: "Plants could not be retrieved." });
  }
});

// Delete plant route
app.delete("/plants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Plant.findByIdAndDelete(id);
    res.status(200).json({ message: "Plant deleted" });
  } catch (error) {
    res.status(500).json({ error: "Could not delete plant" });
  }
});

// Update plant route
app.put("/plants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedPlant = await Plant.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedPlant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json(updatedPlant);
  } catch (error) {
    console.error("Error updating plant:", error);
    res.status(500).json({ error: "Could not update plant" });
  }
});

// START SERVER
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📡 For the phone, use your PC's IP address: ${PORT}`);
});
