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


require('dotenv').config();



const openRoutes = require('./router/index');
const authRouter = require('./router/auth');
const superRouter = require('./router/superRouter');
const vendorRouter = require('./router/vendorRouter');
const userRouter = require('./router/userRouter');
const employeeRouter = require('./router/employeeRouter');
const logisticsRouter = require('./router/logisticRouter');
const driversRouter = require('./router/driversRouter');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(cors());

app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.use(express.static(path.join(__dirname, './', 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET, 
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: true
}));

app.use(methodOverride((req, res) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        let method = req.body._method;
        delete req.body._method;
        return method;
    }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', openRoutes);
app.use('/auth', authRouter);
app.use('/super', superRouter);
app.use('/vendor', vendorRouter);
app.use('/employee', employeeRouter);
app.use('/logistics', logisticsRouter);
app.use('/drivers', driversRouter);
app.use('/user', userRouter);


  // 404 Error handler for undefined routes
  app.use((req, res) => {
    let userActive= false
    if (req.user) {
      userActive = true
    }

    res.render('404',{
      pageTitle:` ${appName} 404`,
      appName,
      userActive
    });
  });
  
  // General error handling middleware
  app.use((err, req, res, next) => {
        let userActive= false
    if (req.user) {
      userActive = true
    }
    
    res.render('404',{
      pageTitle:` ${appName} unexected error`,
      appName,
      userActive
    });
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
