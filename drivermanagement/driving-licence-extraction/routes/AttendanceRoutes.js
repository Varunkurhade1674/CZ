const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get attendance for a driver for a specific month
router.get('/attendance/:driverId', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { year, month } = req.query;

        if (!driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }

        // If year and month are provided, filter by them
        let attendanceData = {};

        const driverRef = db.collection('drivers').doc(driverId);
        const doc = await driverRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const driver = doc.data();
        const attendance = driver.attendance || {};

        // If year and month specified, filter the data
        if (year && month) {
            const prefix = `${year}-${String(month).padStart(2, '0')}`;
            Object.keys(attendance).forEach(date => {
                if (date.startsWith(prefix)) {
                    attendanceData[date] = attendance[date];
                }
            });
        } else {
            attendanceData = attendance;
        }

        res.status(200).json(attendanceData);
    } catch (error) {
        console.error('Attendance fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch attendance' });
    }
});

// Update attendance for a driver
router.post('/attendance', async (req, res) => {
    try {
        const { driverId, date, status } = req.body;

        if (!driverId || !date) {
            return res.status(400).json({ message: 'Driver ID and date are required' });
        }

        const driverRef = db.collection('drivers').doc(driverId);
        const doc = await driverRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update attendance field
        const updateData = {};
        if (status === null) {
            // Remove the attendance entry
            const driver = doc.data();
            const attendance = driver.attendance || {};
            delete attendance[date];
            updateData.attendance = attendance;
        } else {
            updateData[`attendance.${date}`] = status;
        }

        await driverRef.update(updateData);

        res.status(200).json({
            message: 'Attendance updated successfully',
            date,
            status
        });
    } catch (error) {
        console.error('Attendance update error:', error);
        res.status(500).json({ message: 'Failed to update attendance' });
    }
});

// Get attendance summary for a driver
router.get('/attendance/:driverId/summary', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { year, month } = req.query;

        const driverRef = db.collection('drivers').doc(driverId);
        const doc = await driverRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const driver = doc.data();
        const attendance = driver.attendance || {};

        let presentCount = 0;
        let absentCount = 0;

        const prefix = year && month ? `${year}-${String(month).padStart(2, '0')}` : '';

        Object.keys(attendance).forEach(date => {
            if (!prefix || date.startsWith(prefix)) {
                if (attendance[date] === 'present') presentCount++;
                if (attendance[date] === 'absent') absentCount++;
            }
        });

        res.status(200).json({
            presentCount,
            absentCount,
            totalMarked: presentCount + absentCount
        });
    } catch (error) {
        console.error('Attendance summary error:', error);
        res.status(500).json({ message: 'Failed to fetch attendance summary' });
    }
});

module.exports = router;
