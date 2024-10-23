const express = require("express");
const router = express.Router();
const driversController = require('../controllers/driversController')

const { ensureAuthenticated } = require("../config/auth");
const { isDriver, alreadyDriver  } = require("../config/isDriver");
const { ensureAuthenticatedEmail, ensureBasicInformation,ensureDriverKYC  } = require("../config/userAccessCheck");

const upload = require('../config/kycMulter'); 


// Welcome Page
router.get("/", ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail,isDriver,ensureDriverKYC, driversController.getAdminWelcomePage);


// new rider form
router.get('/new-rider', ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail, alreadyDriver, driversController.newRider);
router.post("/register",ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail, alreadyDriver, driversController.createNewDrivers);
router.get("/KYC", ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail,isDriver, driversController.kyc);
router.post("/kyc-submit",ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail ,upload, driversController.kycSubmit);

// edit company data

// all-deliveries
router.get("/available-deliveries", ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail,isDriver,ensureDriverKYC, driversController.allPendingDelivery);
router.get("/my-deliveries", ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail,isDriver,ensureDriverKYC, driversController.myRides);
router.get("/deliveries/:id", ensureAuthenticated,ensureBasicInformation,ensureAuthenticatedEmail,isDriver,ensureDriverKYC, driversController.oneDelivery);

// finish delivery
router.post("/finish-order/:id", ensureAuthenticated,isDriver,ensureBasicInformation,ensureAuthenticatedEmail,isDriver,ensureDriverKYC, driversController.finishDelivery);




module.exports = router;
