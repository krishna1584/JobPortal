const express = require("express");
const multer = require('multer');

const {
  viewAllJobs, viewJobById, applyJobView, submitApplication,
  viewApplications, searchJob
} = require("../controllers/findJobController");

const { protectRoute } = require("../auth/protect");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Math.round(Math.random() * 1E9);
      //cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
      cb(null, file.originalname.split('.')[0] + '-' + uniqueSuffix + '.' +file.originalname.split('.')[1]);
    }
  });
  
const upload = multer({ storage: storage });
const router = express.Router();

//Dashboard
router.get("/view-jobs", protectRoute, viewAllJobs);
router.get("/view-job", protectRoute, viewJobById);
//router.post("/view-jobs", protectRoute, viewAllJobs);
router.get("/apply-job", protectRoute, applyJobView);
router.post('/apply-job', upload.single('resume'), submitApplication);
router.get('/view-applications', viewApplications);

router.post('/search-job', searchJob);
module.exports = router