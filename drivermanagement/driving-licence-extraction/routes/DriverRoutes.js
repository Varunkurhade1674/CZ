const express = require('express');
const db = require('../config/db');

const router = express.Router();

router.get('/drivers', async (req, res) => {
    try {
        const snapshot = await db.collection('drivers').get();
        const drivers = [];
        snapshot.forEach(doc => {
            const d = doc.data() || {};
            drivers.push({ id: doc.id, name: d.name || '', phone: d.phone || doc.id });
        });
        res.status(200).json(drivers);
    } catch (error) {
        console.error('Drivers list error:', error);
        res.status(500).json({ message: 'Failed to list drivers' });
    }
});

router.post('/drivers', async (req, res) => {
    try {
        const { driverId, driverName } = req.body || {};
        const id = (driverId || '').trim();
        const name = (driverName || '').trim();
        if (!id) {
            return res.status(400).json({ message: 'driverId (phone number) is required' });
        }

        const ref = db.collection('drivers').doc(id);
        await ref.set({ name, phone: id }, { merge: true });
        const doc = await ref.get();
        const d = doc.data() || {};
        res.status(201).json({ id: doc.id, name: d.name || '', phone: d.phone || doc.id });
    } catch (error) {
        console.error('Driver upsert error:', error);
        res.status(500).json({ message: 'Failed to save driver' });
    }
});

module.exports = router;
