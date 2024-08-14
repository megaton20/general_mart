const express = require("express");
const router = express.Router();
const logisticsController = require('../controllers/logisticsController')

const { ensureAuthenticated } = require("../config/auth");
const { isLogistics  } = require("../config/isLogistics");

// Welcome Page
router.get("/", ensureAuthenticated,isLogistics, logisticsController.getAdminWelcomePage);

router.post("/register", logisticsController.createNewLogistics);

// counter for attendants


// all-deliveries
router.get("/all-deliveries", ensureAuthenticated,isLogistics, logisticsController.allPendingDelivery);
router.get("/all-deliveries/:id", ensureAuthenticated,isLogistics, logisticsController.oneDelivery);
// finish delivery
router.get("/finish-order/:id", ensureAuthenticated,isLogistics, logisticsController.finishDelivery);

//canceled delivery
// delivery history





module.exports = router;
