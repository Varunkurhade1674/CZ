// routes/AadharRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');
const admin = require('firebase-admin');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure Multer to store the uploaded image in the 'uploads' folder with proper filenames
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
        cb(null, `aadhar-${cleanName}-${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image files and PDFs are allowed!'));
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
router.post('/upload', upload.single('aadharImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
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
        const newFilename = `aadhar-${timestamp}${ext}`;
        const newPath = path.join('uploads', newFilename);

        // Move file to uploads directory with proper extension
        fs.renameSync(originalPath, path.join(__dirname, '..', newPath));

        console.log('Saved image file:', {
            originalName: req.file.originalname,
            savedAs: newFilename,
            mimeType: mimeType
        });

        const imagePart = fileToGenerativePart(path.join(__dirname, '..', newPath), mimeType);

        // The Prompt and JSON Schema for Extraction
        const prompt = `Extract the following information from this Indian Aadhaar card image:

- name: The full name of the person
- aadhaar_no: The complete 12-digit Aadhaar number (do not mask or abbreviate it)
- dob: Date of birth in DD/MM/YYYY format
- gender: Gender (MALE, FEMALE, or OTHER)
- address: The complete address
- pincode: The 6-digit PIN code

Return the result as a valid JSON object with these exact keys: name, aadhaar_no, dob, gender, address, pincode.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [imagePart, prompt],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Full Name as shown on Aadhaar card" },
                        aadhaar_no: { type: "string", description: "12-digit Aadhaar number" },
                        dob: { type: "string", description: "Date of Birth in DD/MM/YYYY format" },
                        gender: { type: "string", description: "Gender (MALE/FEMALE/OTHER)" },
                        address: { type: "string", description: "Complete address" },
                        pincode: { type: "string", description: "6-digit PIN code" },
                    },
                    required: ["name", "aadhaar_no"],
                }
            }
        });

        let extractedJson;
        try {
            extractedJson = JSON.parse(response.text);
            console.log('Extracted JSON for Aadhaar:', extractedJson); // Add this line for debugging
        } catch (parseError) {
            console.error('JSON parse error for Aadhaar extraction:', parseError, 'Response text:', response.text);
            return res.status(500).json({ message: 'Failed to parse extracted data from image.' });
        }

        // Save/update under drivers/{driverId} nested aadhaar field
        const driverRef = db.collection('drivers').doc(driverId);
        await driverRef.set({
            name: driverName || extractedJson.name || '',
            phone: driverId,
            aadhaar: {
                imagePath: newFilename,
                extractedData: extractedJson,
                extractedAt: new Date()
            }
        }, { merge: true });

        const doc = await driverRef.get();
        const driver = doc.data() || {};
        const savedAadhaar = driver.aadhaar || {};

        res.status(201).json({
            message: 'Aadhaar extracted and saved to driver successfully!',
            data: savedAadhaar.extractedData,
            imagePath: savedAadhaar.imagePath,
            id: doc.id
        });

    } catch (error) {
        console.error('Extraction/Saving Error:', error);
        res.status(500).json({ message: 'Failed to extract or save Aadhaar data.' });
    }
});

// RESTful GET route to retrieve all saved data (READ)
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('drivers').get();
        const aadhars = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d && d.aadhaar) {
                aadhars.push({
                    id: doc.id,
                    imagePath: d.aadhaar.imagePath,
                    extractedData: d.aadhaar.extractedData,
                    extractedAt: d.aadhaar.extractedAt
                });
            }
        });
        res.status(200).json(aadhars);
    } catch (error) {
        console.error('Retrieval Error:', error);
        res.status(500).json({ message: 'Failed to retrieve Aadhaar data.' });
    }
});

// RESTful PUT route to update an Aadhaar record (UPDATE)
router.put('/:id', async (req, res) => {
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

        // Update nested Aadhaar in driver document
        const driverRef = db.collection('drivers').doc(id);
        const snap = await driverRef.get();
        if (!snap.exists || !snap.data().aadhaar) {
            return res.status(404).json({ message: 'Driver or Aadhaar not found' });
        }
        await driverRef.update({ 'aadhaar.extractedData': extractedData });

        const updatedDoc = await driverRef.get();
        const d = updatedDoc.data();
        const updatedAadhaar = d ? d.aadhaar : null;
        res.status(200).json({ id: updatedDoc.id, imagePath: updatedAadhaar?.imagePath, extractedData: updatedAadhaar?.extractedData });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({
            message: 'Failed to update Aadhaar record',
            error: error.message
        });
    }
});

// RESTful DELETE route to remove an Aadhaar record (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get driver document to read Aadhaar imagePath
        const driverRef = db.collection('drivers').doc(id);
        const driverDoc = await driverRef.get();
        if (!driverDoc.exists || !driverDoc.data().aadhaar) {
            return res.status(404).json({ message: 'Driver or Aadhaar not found' });
        }

        const aadhaarData = driverDoc.data().aadhaar;

        // Remove nested aadhaar field
        await driverRef.update({ aadhaar: admin.firestore.FieldValue.delete() });

        // Remove associated image file if it exists
        if (aadhaarData.imagePath) {
            const filePath = path.join(__dirname, '..', 'uploads', aadhaarData.imagePath);
            fs.unlink(filePath, (err) => {
                if (err) console.warn('Failed to delete image file:', filePath, err.message);
            });
        }

        return res.status(200).json({ message: 'Aadhaar deleted for driver' });
    } catch (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ message: 'Failed to delete Aadhaar', error: error.message });
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
