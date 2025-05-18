const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    userId: String,
    jobId: String,
    resume: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
