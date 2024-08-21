// routes/userRoute.js
const express = require('express');
const router = express.Router();
const { isUser } = require('../config/isUser');
const { ensureAuthenticated } = require('../config/auth');
const { ensureAuthenticatedEmail, ensureAuthenticatedPhone,ensureBasicInformation } = require('../config/userAccessCheck');
const userController = require('../controllers/userController');
const upload = require('../config/multerConfig'); 

// the journey
router.post('/send-message', userController.contactForm);

// Users cart
router.get('/', ensureAuthenticated,isUser, userController.userShop);
router.get('/pagination', ensureAuthenticated,isUser, userController.userShopQuery);
router.get('/category/:category', ensureAuthenticated,isUser, userController.userCategoryQuery);
router.get('/search', ensureAuthenticated,isUser, userController.searchPage);
router.post('/search', ensureAuthenticated,isUser, userController.searchPost);

router.get('/profile', ensureAuthenticated,isUser, userController.profilePage);
router.get('/reset', ensureAuthenticated,isUser, userController.changePasswordPage);
router.post('/reset-password', ensureAuthenticated,isUser, userController.newPassword);
router.get('/edit-user/:id', ensureAuthenticated,isUser, userController.editProfilePage);
router.post('/add-profile-image/:id', ensureAuthenticated,isUser, upload.single('image'), userController.updateImage);
router.put('/update-user-info/:id', ensureAuthenticated,isUser, userController.updateUserInfo);

router.get('/fetchCart', ensureAuthenticated,isUser,ensureBasicInformation, userController.fetchCart);

// this is where payment button will be
router.get('/checkout/:id', ensureAuthenticated,isUser,ensureAuthenticatedEmail, userController.checkoutScreen);
// Submit-cart //reference is after payment for payment provider
router.get('/order/:reference', ensureAuthenticated,isUser, userController.submitCart);
router.get('/product-details/:id', ensureAuthenticated,isUser, userController.productDetails);

router.get('/orders', ensureAuthenticated,isUser, userController.allUserOrder);
router.get('/invoice/:id', ensureAuthenticated,isUser, userController.invoice);
router.put('/cancel-order/:id', ensureAuthenticated,isUser, userController.cancelOrder);





module.exports = router;