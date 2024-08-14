const express = require("express");
const router = express.Router();
const driversController = require('../controllers/driversController')

const { ensureAuthenticated } = require("../config/auth");
const { isDriver, alreadyDriver  } = require("../config/isDriver");
const { ensureAuthenticatedEmail, ensureBasicInformation  } = require("../config/userAccessCheck");




// Welcome Page
router.get("/", ensureAuthenticated,isDriver,ensureBasicInformation,ensureAuthenticatedEmail, driversController.getAdminWelcomePage);


// new rider form
router.get('/new-rider', ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail, alreadyDriver, driversController.newRider);
router.post("/register",ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail, alreadyDriver, driversController.createNewDrivers);


// all-deliveries
// router.get("/available-deliveries", ensureAuthenticated,isDriver,ensureBasicInformation,ensureAuthenticatedEmail, driversController.allPendingDelivery);
router.get("/my-deliveries", ensureAuthenticated,isDriver,ensureBasicInformation,ensureAuthenticatedEmail, driversController.myRides);
router.get("/deliveries/:id", ensureAuthenticated,isDriver,ensureBasicInformation,ensureAuthenticatedEmail, driversController.oneDelivery);

// finish delivery
router.post("/finish-order/:id", ensureAuthenticated,isDriver,ensureBasicInformation,ensureAuthenticatedEmail, driversController.finishDelivery);




module.exports = router;
