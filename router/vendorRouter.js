const express = require("express");
const router = express.Router();
const vendorController = require('../controllers/vendorController')
const upload = require('../config/multerConfig'); // Import the Multer config
const { isVendor } = require("../config/isVendor");
const { ensureAuthenticated } = require("../config/auth");

// udating image of inventory
router.post('/add-image/:id',ensureAuthenticated,isVendor,upload.single('image'),vendorController.updateImage)

// Welcome Page
router.get("/", ensureAuthenticated,isVendor, vendorController.getAdminWelcomePage);

// all table Page
router.get("/all-sales", ensureAuthenticated,isVendor, vendorController.getAllSales);
router.get("/all-products", ensureAuthenticated,isVendor, vendorController.getAllShelfItems);
router.get("/all-inventory", ensureAuthenticated,isVendor, vendorController.getAllInventory);

// get single
router.get("/inventory/:id", ensureAuthenticated,isVendor, vendorController.getInventoryById);

// shelf manipulation
// add price for new store item to add to market
router.get("/add-price/:id", ensureAuthenticated,isVendor, vendorController.getAddpricePage);
router.get("/update-price/:id", ensureAuthenticated,isVendor, vendorController.getAddpriceUpdatePage);
router.post("/create-sales/:id", ensureAuthenticated,isVendor, vendorController.addToShelfForSale);
router.put("/update-price/:id", ensureAuthenticated,isVendor, vendorController.updatePrice);

// counter for super
router.get("/view-order/:id", ensureAuthenticated,isVendor, vendorController.getSingleOrder);
router.get("/invoice/:id", ensureAuthenticated,isVendor, vendorController.invoice);

// form area

// post request
router.get("/create-inventory", ensureAuthenticated,isVendor, vendorController.createInventoryPage);
router.post("/create-inventory", ensureAuthenticated,isVendor,upload.single('image'), vendorController.createNewInventory);
router.get("/edit-Inventory/:id", ensureAuthenticated,isVendor, vendorController.editInventory)
router.put("/edit-inventory/:id", ensureAuthenticated,isVendor, vendorController.editNewInventory);
router.delete("/delete-inventory/:id", ensureAuthenticated,isVendor, vendorController.deleteInventory);



// // add to store
router.put("/flag-product/:id", ensureAuthenticated,isVendor, vendorController.flagProduct);
router.put("/unflag-product/:id", ensureAuthenticated,isVendor, vendorController.unflagProduct);
// showcase
router.put("/showcase-on/:id", ensureAuthenticated,isVendor, vendorController.addToShowcse);
router.put("/showcase-off/:id", ensureAuthenticated,isVendor, vendorController.removeFromShowcse);











module.exports = router;
