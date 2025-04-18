const express = require("express");

const {
  postJobView, submitNewJob, submitJobSuccess, 
  myPostingsView, editPosting, editPostingSubmit, 
  deletePosting, viewApplicantsForJob
} = require("../controllers/jobPostController");

const { protectRoute } = require("../auth/protect");

const router = express.Router();

//Dashboard
router.get("/create-job", protectRoute, postJobView);
router.post("/create-job", protectRoute, submitNewJob);
router.get("/create-job-success", protectRoute, submitJobSuccess);
//router.post("/login", loginUser);

router.get("/view-my-postings", protectRoute, myPostingsView);
router.get("/editJob", protectRoute, editPosting);
router.post("/updateJob", protectRoute, editPostingSubmit);
router.get("/deleteJob", protectRoute, deletePosting);

router.get("/view-applicants-for-job", protectRoute, viewApplicantsForJob);


module.exports = router;