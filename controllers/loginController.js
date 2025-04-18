const passport = require("passport");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// For Register Page
const registerView = (req, res) => {
  return res.render('register', {error: ''});
};

// Post Request for Register
const registerUser = (req, res) => {
  const { name, email, phone, password, location, degree, branch, confirm, userType } = req.body;

  // Check if all fields are filled
  if (!name || !email || !phone || !password || !location || !degree || !branch || !confirm || !userType) {
    return res.render('register', { error: 'Please fill all the fields' });
  }

  // Check password length
  if (password.length < 6) {
    return res.render('register', { error: 'Password should contain at least 6 characters' });
  }

  // Confirm passwords match
  if (password !== confirm) {
    return res.render('register', { error: 'Passwords must match' });
  }

  // Check if the email already exists
  User.findOne({ email: email }).then((user) => {
    if (user) {
      return res.render('register', { error: 'Email exists! Use a different one' });
    } else {
      // Create new user (no profile image)
      const newUser = new User({
        name,
        email,
        phone,
        location,
        degree,
        branch,
        password,
        userType,
      });

      // Hash password
      bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.render('register', { error: 'Error generating salt' });

        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) return res.render('register', { error: 'Error hashing password' });

          newUser.password = hash;

          // Save user to the database
          newUser
            .save()
            .then(() => res.redirect("/login"))
            .catch((err) => res.render('register', { error: 'Error saving user' }));
        });
      });
    }
  });
};

// For View
const loginView = (req, res) => {
  if(req.query.error)
  {
    return res.render('login', {error: 'Username or password is invalid'});
  }
  return res.render('login', {error: ''});
};

const logoutView = (req, res) => {
  if (req.isAuthenticated()) {
    req.logout();
  }
  res.redirect('/');
};

// Logging in Function
const loginUser = (req, res) => {
  const { email, password } = req.body;

  // Required
  if (!email || !password) {
    return res.render('login', {error: 'Please fill in all the fields'});    
  } else {
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/login?error=Invalid+username+or+password",
      failureFlash: true,
    })(req, res);
  }
};

module.exports = {
  registerView,
  loginView,
  registerUser,
  loginUser,
  logoutView
};
