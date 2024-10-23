const express = require("express");
const router = express.Router();
const employeeController = require('../controllers/employeeController')

const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");
const { isAttendant } = require("../config/isEmployee");

// Welcome Page
router.get("/", ensureAuthenticated,isAttendant, employeeController.getAdminWelcomePage);



// counter for attendants
router.get("/create-sales", ensureAuthenticated,isAttendant, employeeController.counterForm);
router.get("/getItems/:id", ensureAuthenticated,isAttendant,employeeController.getItems);


router.get("/invoice/:id", ensureAuthenticated,isAttendant, employeeController.invoice);

// counter for attendants
router.post("/submitCart", ensureAuthenticated,isAttendant, employeeController.employeeSale);

router.put("/resolve/:id", ensureAuthenticated,isAttendant, employeeController.resolveSale);



module.exports = router;
