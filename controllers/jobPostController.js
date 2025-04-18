const { v4: uuidv4 } = require('uuid');
const Job = require("../models/Job");
const Application = require("../models/Application");

const postJobView = (req, res) => {

    res.render("postJob", {
      user: req.user
    });
  };
  
  // Handle form submission

  const submitNewJob =  async (req, res) => {
    const { title, company, description, location, type, salary, requirements } = req.body;
  
    // if (!name || !email || !password || !confirm) {
    //   return res.render('register', {error: 'Please enter all fields.'});
    // }
    const job = new Job({
        id: uuidv4(),
        title: title,
        company: company,
        description: description,
        location: location,
        type: type,
        salary: salary,
        requirements: requirements,
        creatorName: req.user.name,
        creatorEmail: req.user.email
      });
    
      try {
        await job.save();
        console.log("job saved");
        res.redirect('/create-job-success');
      } catch (error) {
        res.status(500).send(error);
      }
  };

  const submitJobSuccess = (req, res) => {

    res.render("jobPostSuccess", {
        message: "Job is posted successfully",
        user: req.user
    });
  };

  const myPostingsView = async (req, res) => {
    try {
        const email = req.user.email;
        const jobPostings =  await Job.find({ creatorEmail: email });
        //console.log(jobPostings)
        res.render("viewMyPostings", {
            jobPostings: jobPostings,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  const editPosting =  async (req, res) => {
    try {
        const currentP = await Job.findOne({ id: req.query.id });
        console.log("this is get");
        console.log(currentP);
        res.render("editJob", {
            jobPosting: currentP,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };


  const editPostingSubmit = async (req, res) => {
    const { title, company, description, location, type, salary, requirements, id } = req.body;
    try {
        //console.log(id);
        const filter = { id: id }; // the filter to find the document to update
        const update = { $set: { title: title,
            company: company,
            description: description,
            location: location,
            type: type,
            salary: salary,
            requirements: requirements, } }; // the update operation
        const options = { upsert: false }; // optional options

        const result = await Job.updateOne(filter, update, options);
        console.log(`${result.modifiedCount} document(s) updated`);
        res.render("jobPostSuccess", {
            message: "Job edit successful",
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  const deletePosting = async (req, res) => {
    try {
        const result =  await Job.deleteOne({ id: req.query.id });
        console.log(result);
        res.render("jobPostSuccess", {
            message: "Job has been deleted!!",
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  const viewApplicantsForJob = async (req, res) => {
    try {
        const applications =  await Application.find({ jobId: req.query.id });
        //console.log(applications);
        res.render("viewApplicantsForJob", {
            applications: applications,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  
  module.exports = {
    postJobView,
    submitNewJob,
    submitJobSuccess,
    myPostingsView,
    editPosting,
    editPostingSubmit,
    deletePosting,
    viewApplicantsForJob
  };
  