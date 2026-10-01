const mongoose = require('mongoose');

async function connectDB() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<cluster-url>')) {
		throw new Error('Set a valid MONGO_URI in backend/.env before starting the API.');
	}

	mongoose.set('strictQuery', true);
	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 10000,
	});
	console.log('Connected to MongoDB');
}

module.exports = connectDB;
