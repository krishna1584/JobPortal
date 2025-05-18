const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const fs = require('fs');
const fsp = require('fs').promises;
const connectDB = require('./db');
connectDB();

const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');



// Create Express application
const app = express();
const port = 3000;

// Data file paths
// const DATA_PATHS = {
//     users: path.join(__dirname, 'data', 'users.json'),
//     jobs: path.join(__dirname, 'data', 'jobs.json'),
//     applications: path.join(__dirname, 'data', 'applications.json')
// };

// Data management functions
// async function readData(type) {
//     try {
//         const data = await fsp.readFile(DATA_PATHS[type], 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         if (error.code === 'ENOENT') {
//             await fsp.writeFile(DATA_PATHS[type], '[]');
//             return [];
//         }
//         throw error;
//     }
// }

// async function writeData(type, data) {
//     await fsp.writeFile(DATA_PATHS[type], JSON.stringify(data, null, 2));
// }



// Custom logging middleware
// app.use((req, res, next) => {
//     const start = Date.now();
//     res.on('finish', () => {
//         const duration = Date.now() - start;
//         console.log(`${req.method} ${req.url} - ${duration}ms`);
//     });
//     next();
// });

// Global Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Template Engine Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.errors = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = file.fieldname === 'resume' ? 'public/uploads/resumes' : 'public/uploads/avatars';
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error', 'Please sign in to continue');
    res.redirect('/auth/login');
};

const validateJob = (req, res, next) => {
    const { title, company, description } = req.body;
    const errors = [];

    if (!title || title.length < 3) errors.push('Title must be at least 3 characters');
    if (!company) errors.push('Company name is required');
    if (!description || description.length < 10) errors.push('Description must be at least 10 characters');

    if (errors.length > 0) {
        req.flash('error', errors);
        return res.redirect('/employer/post-job');
    }
    next();
};

app.get('/', async (req, res, next) => {
    try {
        const allJobs = await Job.find();
        const userJobs = allJobs.filter(job => !req.session.user || job.userId === req.session.user.id);


        res.render('index', { 
            jobs: userJobs,
            pageTitle: 'Welcome to Job Portal',
            features: [
                { icon: 'search', title: 'Easy Job Search', description: 'Find relevant jobs instantly' },
                { icon: 'file-upload', title: 'Quick Apply', description: 'One-click application process' },
                { icon: 'bell', title: 'Job Alerts', description: 'Get notified about new opportunities' }
            ]
        });
    } catch (error) {
        next(error);
    }
});

app.get('/about', async (req, res, next) => {
    try {
        const [users, jobs, applications] = await Promise.all([
        User.find(),
        Job.find(),
        Application.find()
        ]);


        res.render('about', {
            pageTitle: 'About Us',
            stats: {
                users: users.length,
                jobs: jobs.length,
                applications: applications.length
            }
        });
    } catch (error) {
        next(error);
    }
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        pageTitle: 'Contact Us',
        contactInfo: {
            email: 'support@jobportal.com',
            phone: '+91 9999999999',
            address: '123 demo address'
        }
    });
});

app.post('/contact', async (req, res, next) => {
    try {
        console.log('Message Received:');
        console.log(`Name: ${req.body.name}`);
        console.log(`Email: ${req.body.email}`);
        console.log(`Message: ${req.body.message}`);

        // await new Promise((resolve, reject) => {
        //     setTimeout(() => {
        //         if (Math.random() > 0.1) {
        //             resolve();
        //         } else {
        //             reject(new Error('Failed to send message'));
        //         }
        //     }, 1000);
        // });

        req.flash('success', 'Message sent successfully!');
        res.redirect('/contact');
    } catch (error) {
        next(error);
    }
});

app.get('/auth/login', (req, res) => {
    res.render('auth/login', { pageTitle: 'Sign In' });
});

app.post('/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body; 

        const user = await User.findOne({ email }); 

        if (!user || !await bcrypt.compare(password, user.password)) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
        };
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});


app.get('/auth/register', (req, res) => {
    res.render('auth/register', { pageTitle: 'Create Account' });
});

app.post('/auth/register', upload.single('avatar'), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            avatar: req.file ? `/uploads/avatars/${req.file.filename}` : '/images/default-avatar.png'
        });

        await newUser.save();

        req.session.user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar
        };

        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/employer/post-job', isAuthenticated, (req, res) => {
    const errorMessages = req.flash('error');
    const successMessages = req.flash('success');
    res.render('post-job', {
        pageTitle: 'Post a Job',
        error: errorMessages,
        success: successMessages
    });
});


app.post('/employer/post-job', [isAuthenticated, validateJob], async (req, res, next) => {
    try {
        const newJob = new Job({
            userId: req.session.user.id,
            title: req.body.title,
            company: req.body.company,
            description: req.body.description,
            requirements: req.body.requirements,
            location: req.body.location,
            createdAt: new Date()
        });
    await newJob.save();

        
        req.flash('success', 'Job posted successfully!');
        res.redirect('/jobs');
    } catch (error) {
        req.flash('error', 'Failed to post the job. Please try again.');
        res.redirect('/employer/post-job');
    }
});

app.get('/jobs', async (req, res, next) => {
    try {
        const { search, location, page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
            ];
        }
        if (location) {
            query.location = new RegExp(location, 'i');
        }

        const totalJobs = await Job.countDocuments(query);
        const totalPages = Math.ceil(totalJobs / limit);
        const jobs = await Job.find(query).skip(skip).limit(limit);

        // Fetching flash messages
        const successMessages = req.flash('success');
        const errorMessages = req.flash('error');

        res.render('jobs', { 
            jobs,
            pageTitle: 'Browse Jobs',
            pagination: {
            current: parseInt(page),
            total: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
            },
            success: successMessages,
            error: errorMessages
        });
    } catch (error) {
        next(error);
    }
});


app.get('/jobs/:id', async (req, res, next) => {
    const jobId = req.params.id;

    try {
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).send('Job not found');
        }

        // Convert createdAt to a Date object
        job.createdAt = new Date(job.createdAt);

        res.render('job-details', { job });
    } catch (err) {
        next(err);
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof multer.MulterError) {
        req.flash('error', 'File upload error: ' + err.message);
        return res.redirect('back');
    }

    console.error(new Date().toISOString(), err);

    res.status(err.status || 500).render('error', { 
        error: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found',
        pageTitle: '404 Not Found'
    });
});

// Create required directories
const dirs = ['data', 'public/uploads/resumes', 'public/uploads/avatars'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.listen(port, () => {
    console.log(`Job Portal running at http://localhost:${port}`);
});