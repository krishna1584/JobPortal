const mongoose = require("mongoose");

// Define a schema for job postings
const jobSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    salary: { type: String, required: false },
    requirements: { type: String, required: false },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
