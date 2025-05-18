const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    userId: String, // You can replace with ObjectId and ref if needed
    title: String,
    company: String,
    description: String,
    requirements: String,
    location: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
