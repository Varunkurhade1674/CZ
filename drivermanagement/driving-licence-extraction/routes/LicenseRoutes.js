// /routes/licenseRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');
const admin = require('firebase-admin');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Configure Multer to store the uploaded image in the 'uploads' folder with proper filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Clean the original filename and add timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = path.basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase();
        cb(null, `license-${cleanName}-${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Helper function to convert local file to Gemini-compatible format
function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType,
        },
    };
}

// RESTful POST route for extraction and saving (CREATE)
router.post('/licenses', upload.single('licenseImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({
                message: 'AI extraction not configured. Set GEMINI_API_KEY and restart server.'
            });
        }
        const driverId = (req.body && req.body.driverId) ? String(req.body.driverId).trim() : '';
        const driverName = (req.body && req.body.driverName) ? String(req.body.driverName).trim() : '';
        if (!driverId) {
            return res.status(400).json({ message: 'driverId (driver phone number) is required.' });
        }

        const originalPath = req.file.path;
        const mimeType = req.file.mimetype;
        
        // Keep the original file extension
        const ext = path.extname(req.file.originalname).toLowerCase();
        const timestamp = Date.now();
        const newFilename = `license-${timestamp}${ext}`;
        const newPath = path.join('uploads', newFilename);

        // Move file to uploads directory with proper extension
        fs.renameSync(originalPath, path.join(__dirname, '..', newPath));

        console.log('Saved image file:', {
            originalName: req.file.originalname,
            savedAs: newFilename,
            mimeType: mimeType
        });

        const imagePart = fileToGenerativePart(path.join(__dirname, '..', newPath), mimeType);

        // **The Prompt and JSON Schema for Extraction**
        const prompt = "Extract the following fields from this driving license image: name, license number, date of birth (DOB), address, validity date, date of issue (DOI), blood group (BG), class of vehicle (COV), LMV validity date, MCWG validity date. The output MUST be a JSON object.";
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [imagePart, prompt],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        licenseNumber: { type: "string" },
                        dob: { type: "string", description: "Date of Birth in DD-MM-YYYY format" },
                        address: { type: "string" },
                        validity: { type: "string", description: "The expiration or valid-until date" },
                        doi: { type: "string", description: "Date of Issue" },
                        bg: { type: "string", description: "Blood Group" },
                        cov: { type: "string", description: "Class of Vehicle" },
                        lmvValidity: { type: "string", description: "LMV Validity Date" },
                        mcwgValidity: { type: "string", description: "MCWG Validity Date" },
                    },
                    required: ["name", "licenseNumber"],
                }
            }
        });

        const extractedJson = JSON.parse(response.text);

        // Save/update under drivers/{driverId} nested dl field
        const driverRef = db.collection('drivers').doc(driverId);
        await driverRef.set({
            name: driverName || extractedJson.name || '',
            phone: driverId,
            dl: {
                imagePath: newFilename,
                extractedData: extractedJson,
                extractedAt: new Date()
            }
        }, { merge: true });

        const doc = await driverRef.get();
        const driver = doc.data() || {};
        const savedDL = driver.dl || {};

        res.status(201).json({
            message: 'Driving License extracted and saved to driver successfully!',
            data: savedDL.extractedData,
            imagePath: savedDL.imagePath,
            id: doc.id
        });

    } catch (error) {
        console.error('Extraction/Saving Error:', error);
        if (error && (error.status === 403 || /reported as leaked|PERMISSION_DENIED/i.test(error.message))) {
            return res.status(403).json({
                message: 'AI extraction unavailable: API key invalid or leaked. Rotate key in Google AI Studio and update GEMINI_API_KEY.'
            });
        }
        res.status(500).json({ message: 'Failed to extract or save data.' });
    }
});

// RESTful GET route to retrieve all saved data (READ)
router.get('/licenses', async (req, res) => {
    try {
        const snapshot = await db.collection('drivers').get();
        const licenses = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d && d.dl) {
                licenses.push({
                    id: doc.id,
                    imagePath: d.dl.imagePath,
                    extractedData: d.dl.extractedData,
                    extractedAt: d.dl.extractedAt
                });
            }
        });
        res.status(200).json(licenses);
    } catch (error) {
        console.error('Retrieval Error:', error);
        res.status(500).json({ message: 'Failed to retrieve data.' });
    }
});

// RESTful PUT route to update a license (UPDATE)
router.put('/licenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { extractedData } = req.body;

        // Log the incoming update request
        console.log('Update request received:', { id, extractedData });

        // Validate input
        if (!extractedData || typeof extractedData !== 'object') {
            return res.status(400).json({
                message: 'Invalid update data. Expected extractedData object.'
            });
        }

        // Update nested DL in driver document
        const driverRef = db.collection('drivers').doc(id);
        const snap = await driverRef.get();
        if (!snap.exists || !snap.data().dl) {
            return res.status(404).json({ message: 'Driver or DL not found' });
        }
        await driverRef.update({ 'dl.extractedData': extractedData });

        const updatedDoc = await driverRef.get();
        const d = updatedDoc.data();
        const updatedDL = d ? d.dl : null;
        res.status(200).json({ id: updatedDoc.id, imagePath: updatedDL?.imagePath, extractedData: updatedDL?.extractedData });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({
            message: 'Failed to update license',
            error: error.message
        });
    }
});

// RESTful DELETE route to remove a license (DELETE)
router.delete('/licenses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get driver document to read DL imagePath
        const driverRef = db.collection('drivers').doc(id);
        const driverDoc = await driverRef.get();
        if (!driverDoc.exists || !driverDoc.data().dl) {
            return res.status(404).json({ message: 'Driver or DL not found' });
        }

        const dlData = driverDoc.data().dl;

        // Remove nested dl field
        await driverRef.update({ dl: admin.firestore.FieldValue.delete() });

        // Remove associated image file if it exists
        if (dlData.imagePath) {
            const filePath = path.join(__dirname, '..', 'uploads', dlData.imagePath);
            fs.unlink(filePath, (err) => {
                if (err) console.warn('Failed to delete image file:', filePath, err.message);
            });
        }

        return res.status(200).json({ message: 'DL deleted for driver' });
    } catch (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ message: 'Failed to delete DL', error: error.message });
    }
});

module.exports = router;
router.use((err, req, res, next) => {
    if (!err) return next();
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || 'Unexpected server error' });
});
