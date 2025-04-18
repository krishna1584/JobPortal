const express = require("express");
const {
  registerView,
  loginView,
  registerUser,
  loginUser,
  logoutView
} = require("../controllers/loginController");
const { dashboardView } = require("../controllers/dashboardController");
const { profileView } = require("../controllers/ProfileController");
const { protectRoute } = require("../auth/protect");

const router = express.Router();

router.get("/register", registerView);
router.get("/login", loginView);
router.get("/logout", logoutView);
router.get("/dashboard", protectRoute, dashboardView);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protectRoute, profileView);

module.exports = router;