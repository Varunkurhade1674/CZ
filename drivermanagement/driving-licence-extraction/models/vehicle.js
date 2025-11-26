// models/Vehicle.js
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    // Store the path to the temporary uploaded image
    imagePath: {
        type: String,
        required: true,
    },
    // Extracted Fields for Vehicle Registration Certificate
    extractedData: {
        type: {
            ownerName: String,
            registrationNo: String,
            model: String,
            fuelType: String,
            rcValidUpto: String,
            insuranceExpiry: String,
            chassisNo: String,
        },
        required: true
    },
    extractedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
