const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const { isUser } = require("../config/isUser");
const { ensureAuthenticated,forwardAuthenticated } = require("../config/auth");






// Routes

router.post('/verify-request',ensureAuthenticated,isUser,authController.verifyEmailRequest);
router.get('/verify-email',ensureAuthenticated,isUser,authController.verifyEmailCallBack);

router.get('/google',authController.authRequest);

// Route to request verification code
router.post('/send-code',ensureAuthenticated, isUser,authController.requestVerificationCode);

// Route to verify the code
router.post('/verify-code',ensureAuthenticated, isUser,authController.verifyCode);



router.post('/register',forwardAuthenticated, authController.registerHandler)
router.post('/login',forwardAuthenticated, authController.loginHandler)



router.post('/forget',forwardAuthenticated, authController.resetRequest)
router.get('/reset-password/:token',forwardAuthenticated,authController.resetHandler)

router.post('/reset-password/:token',forwardAuthenticated,authController.newPassword);



router.post('/delete-account',ensureAuthenticated, authController.deleteAccount)
module.exports = router;
