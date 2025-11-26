// routes/VehicleRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');
const admin = require('firebase-admin');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Configure Multer to store the uploaded image/PDF in the 'uploads' folder with proper filenames
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
        cb(null, `vehicle-${cleanName}-${timestamp}${ext}`);
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
router.post('/vehicles', upload.single('vehicleImage'), async (req, res) => {
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
        const newFilename = `vehicle-${timestamp}${ext}`;
        const newPath = path.join('uploads', newFilename);

        // Move file to uploads directory with proper extension
        fs.renameSync(originalPath, path.join(__dirname, '..', newPath));

        console.log('Saved file:', {
            originalName: req.file.originalname,
            savedAs: newFilename,
            mimeType: mimeType
        });

        const imagePart = fileToGenerativePart(path.join(__dirname, '..', newPath), mimeType);

        // **The Prompt and JSON Schema for Extraction**
        const prompt = `Extract ALL available information from this Indian vehicle registration certificate (RC book). Look carefully at every section of the document and extract the exact text as shown:

CRITICAL FIELDS TO FIND:
- registrationNo: The full vehicle registration number (usually starts with state code like MH-01-AB-1234, KA-01-HH-5678, etc.) - look for "REGN. NO." or "Registration No."
- rcValidUpto: The "Registration Certificate Valid Upto" date (DD/MM/YYYY format) - look for "REG. CERT. VALID UPTO" or similar

OTHER FIELDS:
- registrationDate: Registration date (DD/MM/YYYY format) - look for "REGN. DATE"
- chassisNo: Chassis number (full number) - look for "CHASSIS NO."
- engineNo: Engine number (full number) - look for "ENGINE NO."
- ownerName: Owner's full name - look for "NAME OF OWNER"
- swdOf: S/W/D of (Son/Wife/Daughter of) - extract if present after owner name
- address: Complete address of owner - look for "ADDRESS"
- model: Vehicle model name - look for "MODEL" or "MAKE"
- bodyType: Body type (Hatchback, Sedan, SUV, etc.) - look for "BODY TYPE"
- wheelBase: Wheel base measurement - look for "WHEEL BASE"
- mfgDate: Manufacturing date (DD/MM/YYYY format) - look for "MFG. DATE"
- fuelType: Fuel type (PETROL/DIESEL/CNG/ELECTRIC) - look for "FUEL"
- regUpto: Registration valid upto date (DD/MM/YYYY format) - look for "REGN. VALID UPTO"
- taxUpto: Tax valid upto date (DD/MM/YYYY format) - look for "TAX VALID UPTO"
- oslNo: O.S.L number - look for "O.S.L NO."
- manufacturer: Manufacturer name - look for "MANUFACTURER"
- vehicleClass: Vehicle class (LMV, HMV, etc.) - look for "CLASS"
- colour: Vehicle colour - look for "COLOUR"

INSTRUCTIONS:
1. Scan the entire document thoroughly
2. Look for the exact field labels mentioned above
3. Extract the text that follows each label
4. For dates, ensure DD/MM/YYYY format
5. If a field is not found, return empty string ""
6. Do NOT return "n/a" or "N/A" - use empty string instead
7. Be precise with registration numbers - they typically have format like "XX-00-XX-0000"`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [imagePart, prompt],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        registrationDate: { type: "string", description: "Registration date in DD/MM/YYYY format" },
                        registrationNo: { type: "string", description: "Full vehicle registration number" },
                        chassisNo: { type: "string", description: "Full chassis number" },
                        engineNo: { type: "string", description: "Full engine number" },
                        ownerName: { type: "string", description: "Owner's full name" },
                        swdOf: { type: "string", description: "Son/Wife/Daughter of - extract if present" },
                        address: { type: "string", description: "Complete owner address" },
                        model: { type: "string", description: "Vehicle model name" },
                        bodyType: { type: "string", description: "Body type like Hatchback, Sedan, SUV" },
                        wheelBase: { type: "string", description: "Wheel base measurement" },
                        mfgDate: { type: "string", description: "Manufacturing date in DD/MM/YYYY format" },
                        fuelType: { type: "string", description: "Fuel type: PETROL, DIESEL, CNG, ELECTRIC" },
                        rcValidUpto: { type: "string", description: "RC valid upto date in DD/MM/YYYY format" },
                        regUpto: { type: "string", description: "Registration valid upto date in DD/MM/YYYY format" },
                        taxUpto: { type: "string", description: "Tax valid upto date in DD/MM/YYYY format" },
                        oslNo: { type: "string", description: "O.S.L number" },
                        manufacturer: { type: "string", description: "Manufacturer name" },
                        vehicleClass: { type: "string", description: "Vehicle class like LMV, HMV" },
                        colour: { type: "string", description: "Vehicle colour" },
                    },
                    required: ["ownerName", "chassisNo"],
                }
            }
        });

        const extractedJson = JSON.parse(response.text);

        // Save/update under drivers/{driverId} nested rc field
        const driverRef = db.collection('drivers').doc(driverId);
        await driverRef.set({
            name: driverName || extractedJson.ownerName || '',
            phone: driverId,
            rc: {
                imagePath: newFilename,
                extractedData: extractedJson,
                extractedAt: new Date()
            }
        }, { merge: true });

        const doc = await driverRef.get();
        const driver = doc.data() || {};
        const savedRC = driver.rc || {};

        res.status(201).json({
            message: 'Vehicle RC extracted and saved to driver successfully!',
            data: savedRC.extractedData,
            imagePath: savedRC.imagePath,
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
router.get('/vehicles', async (req, res) => {
    try {
        const snapshot = await db.collection('drivers').get();
        const vehicles = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d && d.rc) {
                vehicles.push({
                    id: doc.id,
                    imagePath: d.rc.imagePath,
                    extractedData: d.rc.extractedData,
                    extractedAt: d.rc.extractedAt
                });
            }
        });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Retrieval Error:', error);
        res.status(500).json({ message: 'Failed to retrieve data.' });
    }
});

// RESTful PUT route to update a vehicle (UPDATE)
router.put('/vehicles/:id', async (req, res) => {
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

        // Update nested RC in driver document
        const driverRef = db.collection('drivers').doc(id);
        const snap = await driverRef.get();
        if (!snap.exists || !snap.data().rc) {
            return res.status(404).json({ message: 'Driver or RC not found' });
        }
        await driverRef.update({ 'rc.extractedData': extractedData });

        const updatedDoc = await driverRef.get();
        const d = updatedDoc.data();
        const updatedRC = d ? d.rc : null;
        res.status(200).json({ id: updatedDoc.id, imagePath: updatedRC?.imagePath, extractedData: updatedRC?.extractedData });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({
            message: 'Failed to update vehicle',
            error: error.message
        });
    }
});

// RESTful DELETE route to remove a vehicle (DELETE)
router.delete('/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get driver document to read RC imagePath
        const driverRef = db.collection('drivers').doc(id);
        const driverDoc = await driverRef.get();
        if (!driverDoc.exists || !driverDoc.data().rc) {
            return res.status(404).json({ message: 'Driver or RC not found' });
        }

        const rcData = driverDoc.data().rc;

        // Remove nested rc field
        await driverRef.update({ rc: admin.firestore.FieldValue.delete() });

        // Remove associated image file if it exists
        if (rcData.imagePath) {
            const filePath = path.join(__dirname, '..', 'uploads', rcData.imagePath);
            fs.unlink(filePath, (err) => {
                if (err) console.warn('Failed to delete image file:', filePath, err.message);
            });
        }

        return res.status(200).json({ message: 'RC deleted for driver' });
    } catch (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ message: 'Failed to delete RC', error: error.message });
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
