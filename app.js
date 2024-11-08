const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('./config/passport');
const methodOverride = require('method-override');
const ejsLayouts = require('express-ejs-layouts');
const updateWatch = require('./config/updateAction');
const cors = require('cors');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

// Create and connect Redis client only in production
let redisClient = null;
if (process.env.NODE_ENV === 'production') {
  redisClient = createClient();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  // Connect Redis client asynchronously
  (async () => {
    await redisClient.connect();
    console.log('Connected to Redis');
  })();
}

const appName = "True Essentials Mart";
require('dotenv').config();

const openRoutes = require('./router/index');
const authRouter = require('./router/auth');
const superRouter = require('./router/superRouter');
const vendorRouter = require('./router/vendorRouter');
const userRouter = require('./router/userRouter');
const employeeRouter = require('./router/employeeRouter');
const logisticsRouter = require('./router/logisticRouter');
const driversRouter = require('./router/driversRouter');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Set up EJS view engine and public folder
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.use(express.static(path.join(__dirname, './', 'public')));

// Configure session middleware with Redis store (only in production)
if (redisClient) {
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }));
} else {
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }));
}

// Initialize passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages setup
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});


app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      let method = req.body._method;
      delete req.body._method;
      return method;
  }
}));

// Routes
app.use('/', openRoutes); // open less secure routes
app.use('/auth', authRouter); // authentication
app.use('/super', superRouter); // general overseers
app.use('/vendor', vendorRouter); // external sellers
app.use('/employee', employeeRouter); // shop attendants
app.use('/logistics', logisticsRouter); // logistic shifts
app.use('/drivers', driversRouter); // external riders
app.use('/user', userRouter); // customer order platform

// 404 Error handler for undefined routes
app.use((req, res) => {
  let userActive = req.user ? true : false;
  res.render('404', {
    pageTitle: `${appName} 404`,
    appName,
    userActive
  });
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  let userActive = req.user ? true : false;
  res.render('blank', {
    pageTitle: `${appName} unexpected error`,
    appName,
    userActive
  });
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
