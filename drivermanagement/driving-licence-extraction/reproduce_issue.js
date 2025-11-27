const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'key.env') });
const admin = require('firebase-admin');

console.log('Testing DB connection...');

try {
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "default",
        private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || "default",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    if (!serviceAccount.private_key) {
        throw new Error('FIREBASE_PRIVATE_KEY is missing in env');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase initialized.');
    const db = admin.firestore();

    async function testWrite() {
        try {
            const id = '9999999999';
            const name = 'Test Driver';
            console.log(`Attempting to write driver: ${id}, ${name}`);

            const ref = db.collection('drivers').doc(id);
            await ref.set({ name, phone: id }, { merge: true });
            console.log('Write successful!');

            const doc = await ref.get();
            console.log('Read back:', doc.data());
        } catch (error) {
            console.error('Operation failed:', error);
        }
    }

    testWrite();

} catch (error) {
    console.error('Initialization failed:', error);
}
