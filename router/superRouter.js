const express = require("express");
const router = express.Router();
const superController = require('../controllers/superController')
const upload = require('../config/multerConfig'); // Import the Multer config
const { isSuper } = require("../config/isSuper");
const { ensureAuthenticated } = require("../config/auth");

// udating image of inventory
router.post('/add-image/:id',ensureAuthenticated,isSuper,upload.single('image'),superController.updateImage)

// Welcome Page
router.get("/", ensureAuthenticated,isSuper, superController.getAdminWelcomePage);

// all table Page
router.get("/all-customers", ensureAuthenticated,isSuper, superController.getAllCustomers);
router.get("/all-brands", ensureAuthenticated,isSuper, superController.getAllBrand);
router.get("/sales", ensureAuthenticated,isSuper, superController.getAllUnresolvedSales);
router.get("/all-sales", ensureAuthenticated,isSuper, superController.getAllSales);
router.get("/all-damaged", ensureAuthenticated,isSuper, superController.getAllDamaged);
router.get("/all-employees", ensureAuthenticated,isSuper, superController.getAllEmployees);
router.get("/all-supplier", ensureAuthenticated,isSuper, superController.getAllSuppliers);
router.get("/all-stores", ensureAuthenticated,isSuper, superController.getAllStores);
router.get("/all-categories", ensureAuthenticated,isSuper, superController.getAllCategory);
router.get("/all-discounts", ensureAuthenticated,isSuper, superController.getAllDiscounts);
router.get("/all-products", ensureAuthenticated,isSuper, superController.getAllShelfItems);
router.get("/all-transactions", ensureAuthenticated,isSuper, superController.getAllTransactions);
router.get("/all-inventory", ensureAuthenticated,isSuper, superController.getAllInventory);
router.get("/all-positions", ensureAuthenticated,isSuper, superController.getAllPositions);
router.get("/new-orders", ensureAuthenticated,isSuper, superController.getAllOrders);
router.get("/all-canceled-order", ensureAuthenticated,isSuper, superController.getAllCanceledOrders);
router.get("/view-canceled/:id", ensureAuthenticated,isSuper, superController.getOneCanceledOrder);


router.get("/all-logistic-company", ensureAuthenticated,isSuper, superController.getAllLogisticCompany);
router.get("/edit-logistic-company/:id", ensureAuthenticated,isSuper, superController.getOneLogisticCompany);
router.get("/all-logistics-drivers/", ensureAuthenticated,isSuper, superController.allLogisticDrivers);
router.get("/asign-driver-to-company/:id", ensureAuthenticated,isSuper, superController.asigneToCompany);
router.put("/add-driver-to-company/:id", ensureAuthenticated,isSuper, superController.addDriverToCompany); //



router.get("/upgrade-users/:id", ensureAuthenticated,isSuper, superController.usersToUpgrade);
router.get("/upgrade-users", ensureAuthenticated,isSuper, superController.getAllUsersToUpgrade);
router.put("/upgrade-users/:id", ensureAuthenticated,isSuper, superController.postUsersToUpgrade);
// get single
router.get("/inventory/:id", ensureAuthenticated,isSuper, superController.getInventoryById);

// shelf manipulation
// add price for new store item to add to market
router.get("/add-price/:id", ensureAuthenticated,isSuper, superController.getAddpricePage);
router.get("/update-price/:id", ensureAuthenticated,isSuper, superController.getAddpriceUpdatePage);
router.post("/create-sales/:id", ensureAuthenticated,isSuper, superController.addToShelfForSale);
router.put("/update-price/:id", ensureAuthenticated,isSuper, superController.updatePrice);

// counter for super
router.get("/create-sales", ensureAuthenticated,isSuper, superController.adminCounter);
router.post("/submitCart", ensureAuthenticated,isSuper, superController.superSale);
router.get("/invoice/:id", ensureAuthenticated,isSuper, superController.invoice);



router.get("/view-order/:id", ensureAuthenticated,isSuper, superController.getSingleOrder);
router.get("/confirm-order/:id", ensureAuthenticated,isSuper, superController.confirmOrder); //
router.post("/ship-order/:id", ensureAuthenticated,isSuper, superController.shipWithCompanyDriver); //
router.post("/ship-order-with-rider/:id", ensureAuthenticated,isSuper, superController.shipWithRider); //

// form area

router.get("/create-store", ensureAuthenticated,isSuper, superController.createStorePage);
router.get("/create-discount", ensureAuthenticated,isSuper, superController.createDiscountPage);
router.get("/create-category", ensureAuthenticated,isSuper, superController.createCategoryPage);
router.get("/create-supplier", ensureAuthenticated,isSuper, superController.createSupplierPage);
router.get("/create-position", ensureAuthenticated,isSuper, superController.createPositionPage);
router.get("/create-logistics", ensureAuthenticated,isSuper, superController.createLogisticCompanyPage);
router.get("/create-inventory", ensureAuthenticated,isSuper, superController.createInventoryPage);
router.get("/create-brand", ensureAuthenticated,isSuper, superController.createBrandPage);
router.get("/edit-brand/:id", ensureAuthenticated,isSuper, superController.editBrandPage);


// post request
router.post("/create-store", ensureAuthenticated,isSuper, superController.createNewStore);
router.post("/create-discount", ensureAuthenticated,isSuper, superController.createNewDiscount);
router.post("/create-inventory", ensureAuthenticated,isSuper,upload.single('image'), superController.createNewInventory);
router.post("/create-category", ensureAuthenticated,isSuper, superController.createNewCategory);
router.post("/create-supplier", ensureAuthenticated,isSuper, superController.createNewSupplier);
router.post("/create-customer", ensureAuthenticated,isSuper, superController.createNewCustomer);
router.post("/create-position", ensureAuthenticated,isSuper, superController.createNewPosition);
router.post("/create-logistics", ensureAuthenticated,isSuper, superController.createNewLogistics);
router.post("/create-brand", ensureAuthenticated,isSuper, superController.createNewBrand);



// // add to store
router.put('/product-status/unverified/:id',ensureAuthenticated,isSuper,superController.remove)
router.put("/resolve/:id", ensureAuthenticated,isSuper, superController.resolveSale);
router.put("/flag-product/:id", ensureAuthenticated,isSuper, superController.flagProduct);
router.put("/unflag-product/:id", ensureAuthenticated,isSuper, superController.unflagProduct);
// showcase
router.put("/showcase-on/:id", ensureAuthenticated,isSuper, superController.addToShowcase);
router.put("/showcase-off/:id", ensureAuthenticated,isSuper, superController.removeFromShowcase);




router.get("/edit-stores/:id", ensureAuthenticated,isSuper, superController.storeEdit);
router.get("/edit-discount/:id", ensureAuthenticated,isSuper,superController.editDiscount);
router.get("/edit-supplier/:id", ensureAuthenticated,isSuper, superController.editSupplier)
router.get("/edit-category/:id", ensureAuthenticated,isSuper, superController.editCategory)
router.get("/edit-Inventory/:id", ensureAuthenticated,isSuper, superController.editInventory)
router.get("/edit-position/:id", ensureAuthenticated,isSuper, superController.editPosition);
router.get("/edit-employee/:id", ensureAuthenticated,isSuper, superController.editEmployee);






router.put("/edit-logistics-company/:id", ensureAuthenticated,isSuper, superController.editLogisticsComp);

router.put("/edit-employee/:id", ensureAuthenticated,isSuper, superController.updateEmployee);
router.put("/edit-store/:id", ensureAuthenticated,isSuper, superController.editNewStore);
router.put("/edit-discount/:id", ensureAuthenticated,isSuper, superController.editNewDiscount);
router.put("/edit-supplier/:id", ensureAuthenticated,isSuper, superController.editNewSupplier);
router.put("/edit-category/:id", ensureAuthenticated,isSuper, superController.editNewCategory);
router.put("/edit-inventory/:id", ensureAuthenticated,isSuper, superController.editNewInventory);
router.put("/edit-position/:id", ensureAuthenticated,isSuper, superController.editNewPosition);
router.put("/update-brand/:id", ensureAuthenticated,isSuper, superController.updateBrand);




// delete

router.delete("/delete-store/:id", ensureAuthenticated,isSuper, superController.deleteStore);
router.delete("/delete-employee/:id", ensureAuthenticated,isSuper, superController.deleteEmployee);
router.delete("/delete-discount/:id", ensureAuthenticated,isSuper, superController.deleteDiscount);
router.delete("/delete-supplier/:id", ensureAuthenticated,isSuper, superController.deleteSupplier);
router.delete("/delete-category/:id", ensureAuthenticated,isSuper, superController.deleteCategory);
router.delete("/delete-inventory/:id", ensureAuthenticated,isSuper, superController.deleteInventory);
router.delete("/delete-position/:id", ensureAuthenticated,isSuper, superController.deletePosition);
router.delete("/delete-brand/:id", ensureAuthenticated,isSuper, superController.deleteBrand);




// search and  category filter
router.get("/getItems/:id", ensureAuthenticated,isSuper,superController.superStore);



module.exports = router;
