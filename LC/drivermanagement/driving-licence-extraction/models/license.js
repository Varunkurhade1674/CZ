// /models/License.js
const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    // Store the path to the temporary uploaded image
    imagePath: {
        type: String,
        required: true,
    },
    // Extracted Fields
    extractedData: {
        type: {
            name: String,
            phone: String,
            licenseNumber: String,
            dob: String,
            address: String,
            validity: String,
            doi: String, // Date of Issue
            bg: String, // Blood Group
            cov: String, // Class of Vehicle
            lmvValidity: String, // LMV Validity Date
            mcwgValidity: String // MCWG Validity Date
        },
        required: true
    },
    extractedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('License', licenseSchema);