const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = file.fieldname === 'resume' ? 'public/uploads/resumes' : 'public/uploads/avatars';
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// In-memory data store (replace with a database in production)
let users = [];
let jobs = [];
let applications = [];

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error', 'Please sign in to continue');
    res.redirect('/auth/login');
};

// Routes
app.get('/', (req, res) => {
    const userJobs = jobs.filter(job => !req.session.user || job.userId === req.session.user.id);
    res.render('index', { 
        jobs: userJobs,
        user: req.session.user
    });
});

// My Applications route
app.get('/my-applications', isAuthenticated, (req, res) => {
    const userApplications = applications
        .filter(app => app.userId === req.session.user.id)
        .map(app => ({
            ...app,
            job: jobs.find(job => job.id === app.jobId)
        }));

    res.render('my-applications', {
        applications: userApplications,
        user: req.session.user
    });
});

// About page
app.get('/about', (req, res) => {
    res.render('about', { user: req.session.user });
});

// Contact page
app.get('/contact', (req, res) => {
    res.render('contact', { user: req.session.user });
});

app.post('/contact', (req, res) => {
    req.flash('success', 'Message sent successfully!');
    res.redirect('/contact');
});

// Auth routes
app.get('/auth/login', (req, res) => {
    res.render('auth/login', { messages: req.flash() });
});

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = {
            id: user.id,
            email: user.email,
            avatar: user.avatar
        };
        res.redirect('/');
    } else {
        req.flash('error', 'Invalid email or password');
        res.redirect('/auth/login');
    }
});

app.get('/auth/register', (req, res) => {
    res.render('auth/register', { messages: req.flash() });
});

app.post('/auth/register', upload.single('avatar'), (req, res) => {
    const { name, email, password } = req.body;
    
    if (users.some(u => u.email === email)) {
        req.flash('error', 'Email already registered');
        return res.redirect('/auth/register');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword,
        avatar: req.file ? `/uploads/avatars/${req.file.filename}` : '/images/default-avatar.png'
    };

    users.push(user);
    req.session.user = {
        id: user.id,
        email: user.email,
        avatar: user.avatar
    };

    res.redirect('/');
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Employer routes
app.get('/employer/post-job', isAuthenticated, (req, res) => {
    res.render('post-job', { user: req.session.user });
});

app.post('/employer/post-job', isAuthenticated, (req, res) => {
    try {
        const job = {
            id: Date.now(),
            userId: req.session.user.id,
            title: req.body.title,
            company: req.body.company,
            description: req.body.description,
            requirements: req.body.requirements,
            location: req.body.location,
            createdAt: new Date()
        };
        jobs.push(job);
        res.redirect('/');
    } catch (error) {
        res.status(500).render('error', { error: 'Error posting job' });
    }
});

// Job seeker routes
app.get('/jobs', (req, res) => {
    const { search, location } = req.query;
    let filteredJobs = jobs;
    
    if (search) {
        filteredJobs = filteredJobs.filter(job => 
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (location) {
        filteredJobs = filteredJobs.filter(job => 
            job.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    res.render('jobs', { 
        jobs: filteredJobs,
        user: req.session.user
    });
});

app.get('/jobs/:id', (req, res) => {
    const job = jobs.find(j => j.id === parseInt(req.params.id));
    if (!job) {
        return res.status(404).render('error', { 
            error: 'Job not found',
            user: req.session.user
        });
    }
    res.render('job-details', { 
        job,
        user: req.session.user,
        isAuthenticated: !!req.session.user,
        applications: applications
    });
});

app.post('/jobs/:id/apply', isAuthenticated, upload.single('resume'), (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        
        // Check if user has already applied
        const hasApplied = applications.some(app => app.jobId === jobId && app.userId === req.session.user.id);
        
        if (hasApplied) {
            req.flash('error', 'You have already applied for this position');
            return res.redirect(`/jobs/${jobId}`);
        }

        const application = {
            id: Date.now(),
            jobId,
            userId: req.session.user.id,
            name: req.body.name,
            email: req.body.email,
            resumePath: req.file.filename,
            appliedAt: new Date()
        };
        applications.push(application);
        req.flash('success', 'Application submitted successfully!');
        res.redirect('/my-applications');
    } catch (error) {
        res.status(500).render('error', { 
            error: 'Error submitting application',
            user: req.session.user
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        error: 'Something went wrong!',
        user: req.session.user
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found',
        user: req.session.user
    });
});

// Create upload directories if they don't exist
const fs = require('fs');
const uploadDirs = ['public/uploads/resumes', 'public/uploads/avatars'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.listen(port, () => {
    console.log(`Job Portal running at http://localhost:${port}`);
});