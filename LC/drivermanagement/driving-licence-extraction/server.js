// server.js
const express = require('express');
const fs = require('fs');
// You no longer need: const dotenv = require('dotenv');

// --- 🛠️ CORRECTED DOTENV CONFIGURATION ---
// This line both imports the module and immediately runs the config method,
// pointing it to your 'key.env' file.
require('dotenv').config({path:'./key.env'}); 
// ------------------------------------------

const path = require('path');
const connectDB = require('./config/db');
const licenseRoutes = require('./routes/LicenseRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000; 

// ... rest of your server code remains the same ...
// Middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure uploads directory serving
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploaded files with proper MIME types
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsPath, path.basename(req.url));
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
            res.set('Content-Type', 'image/jpeg');
        } else if (ext === '.png') {
            res.set('Content-Type', 'image/png');
        }
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});

// Add a route to check if image exists
app.get('/uploads/:filename', (req, res, next) => {
    const filePath = path.join(uploadsPath, req.params.filename);
    if (fs.existsSync(filePath)) {
        next();
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});

// API routes
app.use('/api', licenseRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}. Open http://localhost:${PORT}`);
});