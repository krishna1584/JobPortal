const express = require("express");
const app = express();
var fs = require("fs");
var path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require('express-session');
dotenv.config();
const passport = require("passport");
const { loginCheck } = require("./auth/passport");
loginCheck(passport);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
      res.setHeader('X-Content-Type-Options', 'nosniff'); // Stops IDM from sniffing file type
      res.setHeader('Content-Disposition', 'inline'); // Forces view mode
  }
}));


app.get('/view-resume/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);

    res.setHeader('Content-Type', 'application/pdf'); // Ensure it's treated as a PDF
    res.setHeader('Content-Disposition', 'inline'); // Force viewing instead of downloading
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent forced download behavior
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Allow caching for faster viewing

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(404).send("Resume not found");
        }
    });
});

// Mongo DB connection
mongoose.connect("mongodb://127.0.0.1:27017/project", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error"));
db.once("open", function () {
  console.log("Connected to mongodb");
});

app.set("view engine", "ejs");

//BodyParsing
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret:'oneboy',
    saveUninitialized: true,
    resave: true
  }));
  

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  return res.render('home', {error: ''});
});

//Routes
app.use("/", require("./routes/login"));
app.use("/", require("./routes/jobpost"));
app.use("/", require("./routes/jobfind"));

const PORT = process.env.PORT || 4111;

app.listen(PORT, console.log("Server has started at port http://localhost:" + PORT));