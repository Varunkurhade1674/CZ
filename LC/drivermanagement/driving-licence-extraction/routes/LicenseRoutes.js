// /routes/licenseRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const License = require('../models/license');

const router = express.Router();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

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

        // 2. Save the extracted data to MongoDB
        const newLicense = new License({
            imagePath: newFilename, // Store the new filename
            extractedData: extractedJson,
        });

        await newLicense.save();

        res.status(201).json({ 
            message: 'Data extracted and saved successfully!',
            data: newLicense.extractedData,
            imagePath: newLicense.imagePath
        });

    } catch (error) {
        console.error('Extraction/Saving Error:', error);
        res.status(500).json({ message: 'Failed to extract or save data.' });
    }
});

// RESTful GET route to retrieve all saved data (READ)
router.get('/licenses', async (req, res) => {
    try {
        const licenses = await License.find().select('extractedData extractedAt imagePath');
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

        // Find and update the license
        const updatedLicense = await License.findByIdAndUpdate(
            id,
            { $set: { extractedData } },
            { 
                new: true,
                runValidators: true,
                lean: true // Return a plain JavaScript object
            }
        );

        if (!updatedLicense) {
            console.log('License not found:', id);
            return res.status(404).json({ message: 'License not found' });
        }

        console.log('License updated successfully:', updatedLicense);
        res.status(200).json(updatedLicense);

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

        // Find and delete the license record
        const license = await License.findByIdAndDelete(id).lean();
        if (!license) {
            return res.status(404).json({ message: 'License not found' });
        }

        // Remove associated image file if it exists
        if (license.imagePath) {
            const filePath = path.join(__dirname, '..', 'uploads', license.imagePath);
            fs.unlink(filePath, (err) => {
                if (err) console.warn('Failed to delete image file:', filePath, err.message);
            });
        }

        return res.status(200).json({ message: 'License deleted' });
    } catch (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ message: 'Failed to delete license', error: error.message });
    }
});

module.exports = router;