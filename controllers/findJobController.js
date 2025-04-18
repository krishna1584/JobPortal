const Application = require("../models/Application");
const Job = require("../models/Job");

const applyJobView = async (req, res) => {
    res.render("applyJob", {
      newId: req.query.id,
      user: req.user
    });
  };
  
  // Handle form submission

  const submitApplication = async (req, res) => {
    const { name, email, phone, portfolio, additionalInfo, jobId} = req.body;
    // if (!name || !email || !password || !confirm) {
    //   return res.render('register', {error: 'Please enter all fields.'});
    // }
    const entry =  await Application.findOne({ jobId: jobId, email: email });
    if(entry)
    {
        console.log("Application is already submitted");
        res.render("jobApplySuccess", {
            message: "Application for this job is already submitted on "+entry.appliedOn.toDateString(),
            user: req.user
        });
        return;
    }
    //console.log(req.body.jobId);
    const job_ =  await Job.findOne({ id: jobId });

    const application = new Application({
        jobId: jobId,
        jobTitle: job_.title,
        jobCompany: job_.company,
        jobLocation: job_.location,
        name: name,
        email: email,
        phone: phone,
        portfolio: portfolio,
        resumePath: req.file.path,
        additionalInfo: additionalInfo,
      });
    
      try {
        await application.save();
        console.log("Applied Successfully");
        res.render("jobApplySuccess", {
            message: "Applied Successfully",
            user: req.user
        });
      } catch (error) {
        res.status(500).send(error);
      }
  };



  const viewAllJobs = async (req, res) => {
    try {
        const jobs =  await Job.find();
        res.render("viewJobs", {
            jobs: jobs,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  const viewJobById = async (req, res) => {
    try {
        const job_ =  await Job.findOne({ id: req.query.id });
        //console.log(job_)
        res.render("viewJob", {
            job: job_,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  const viewApplications = async (req, res) => {
    try {
        const applications =  await Application.find({ email: req.user.email });
        //console.log(applications);
        res.render("viewApplications", {
            applications: applications,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };

  const searchJob = async (req, res) => {
    try {
        var regex = new RegExp(".*" + req.body.title + ".*", "i");
        var locRegex = new RegExp(".*" + req.body.location + ".*", "i");
        var jobs = [];
        if(req.body.type)
        {
            jobs = await Job.find({ title: regex, location: locRegex, type: req.body.type });
        }
        else {
            jobs = await Job.find({ title: regex, location: locRegex });
        }
        //console.log(jobs);
        res.render("viewJobs", {
            jobs: jobs,
            user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    
  };
  
  module.exports = {
    viewAllJobs,
    viewJobById,
    applyJobView,
    submitApplication,
    viewApplications,
    searchJob
  };
  