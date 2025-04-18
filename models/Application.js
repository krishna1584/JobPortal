const mongoose = require("mongoose");

// Define a schema for job postings
const applicationSchema = new mongoose.Schema({
    jobId: { type: String, required: true },
    jobTitle: { type: String, required: true},
    jobCompany: { type: String, required: true},
    jobLocation: { type: String, required: true},
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    portfolio: { type: String, required: true },
    resumePath: { type: String, required: true },
    additionalInfo: { type: String, required: false },
    appliedOn: { type: Date, default: Date.now },
  });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
