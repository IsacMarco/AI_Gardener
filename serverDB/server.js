const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- 1. CONFIGURĂRI IMPORTANTE ---

// CORS permite telefonului să vorbească cu PC-ul
app.use(cors());

// Mărim limita de date primite la 50MB ca să încapă pozele Base64!
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. CONECTARE LA BAZA DE DATE ---
// 'aigardener' este numele bazei de date. Se creează singură.
mongoose.connect('mongodb://127.0.0.1:27017/aigardener')
  .then(() => console.log('✅ Conectat la MongoDB!'))
  .catch(err => console.error('❌ Eroare conectare MongoDB:', err));

// --- 3. DEFINIREA MODELULUI (Schema plantei) ---
const plantSchema = new mongoose.Schema({
  userId: String,
  name: { type: String, required: true },
  species: String,
  location: String,
  imageBase64: String,
  watering: {
    enabled: Boolean,
    frequency: Number,
    time: String
  },
  createdAt: { type: Date, default: Date.now }
});

const Plant = mongoose.model('Plant', plantSchema);

// --- 4. RUTA API (Unde trimite telefonul datele) ---
app.post('/add-plant', async (req, res) => {
  try {
    const { 
      userId,  
      name, 
      species, 
      location, 
      remindersActive, 
      frequency, 
      preferredTime, 
      imageBase64 
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
        time: remindersActive ? preferredTime : null
      }
    });

    await newPlant.save();

    console.log(`✅ Plantă salvată: ${name}`);
    res.status(201).json({ message: "Succes! Planta e în bază." });

  } catch (error) {
    console.error("❌ Eroare la salvare:", error);
    res.status(500).json({ error: "Eroare server: " + error.message });
  }
});

// --- RUTA PENTRU AFISAREA PLANTELOR ---
app.get('/plants', async (req, res) => {
  try {
    const { userId } = req.query; // Citim ID-ul din URL

    if (!userId) {
      return res.status(400).json({ error: "Lipseste userId!" });
    }

    console.log(`📥 Caut plantele pentru userul: ${userId}`);

    // Cautam in MongoDB doar plantele acelui user
    // .sort({ createdAt: -1 }) le pune pe cele mai noi primele
    const plants = await Plant.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(plants); // Le trimitem inapoi ca JSON (lista)
  } catch (error) {
    console.error("Eroare la citire:", error);
    res.status(500).json({ error: "Nu am putut citi plantele." });
  }
});

// Exemplu in serverul tau Node.js
app.delete('/plants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Plant.findByIdAndDelete(id);
    res.status(200).json({ message: "Plant deleted" });
  } catch (error) {
    res.status(500).json({ error: "Could not delete" });
  }
});

// RUTA UPDATE
app.put('/plants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Structura ta poate varia (ex: updates.name, updates.watering etc)
    // Aici facem un update simplu care suprascrie campurile trimise
    const updatedPlant = await Plant.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedPlant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json(updatedPlant);
  } catch (error) {
    console.error("Error updating:", error);
    res.status(500).json({ error: "Could not update plant" });
  }
});

// --- 5. PORNIRE SERVER ---
// Ascultam pe 0.0.0.0 ca sa fim vizibili in retea, nu doar local
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serverul rulează!`);
  console.log(`📡 Pentru telefon, folosește IP-ul PC-ului tău:3000`);
});