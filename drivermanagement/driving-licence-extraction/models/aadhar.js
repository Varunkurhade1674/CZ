// models/aadhar.js
const mongoose = require('mongoose');

const aadharSchema = new mongoose.Schema({
    owner_email: {
        type: String,
        required: true,
        default: "cabowner@gmail.com" // As per the prompt example
    },
    imagePath: {
        type: String,
        required: true,
    },
    extractedData: {
        type: {
            name: String,
            aadhaar_no: String,
            dob: String,
            gender: String,
            address: String,
            pincode: String,
        },
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Aadhar', aadharSchema);
