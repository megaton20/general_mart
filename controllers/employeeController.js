const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const stateData = require("../model/stateAndLGA");


const systemCalander = new Date().toLocaleDateString();
const yearModel = require("../model/getYear");
let presentYear = yearModel(systemCalander, "/");

const monthNameModel = require("../model/findCurrentMonth");
let monthName = monthNameModel(systemCalander, "/");

const dayModel = require("../model/dayOfWeek");
let dayName = dayModel(systemCalander, "/");

const monthModel = require("../model/getMonth");
let presentMonth = monthModel(systemCalander, "/");

const getDay = require("../model/getDay");
let presentDay = getDay(systemCalander, "/");

let sqlDate = presentYear + "-" + presentMonth + "-" + presentDay;

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


exports.getAdminWelcomePage = async (req, res) => {
  let userFirstName = req.user.First_name;
  let userLastName = req.user.Last_name;

  try {
    // Query to fetch all categories
    const { rows: allCategory } = await query(`SELECT * FROM "Category"`);

    // Render the employee dashboard
    return res.render("./employee/employeeDash", {
      pageTitle: "Employee Dashboard",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      allCategory,
    });
  } catch (error) {
    // Log and flash the error
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("/");
  }
};

//  at the counter page
exports.counterForm = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const userId = req.user.id;

  try {
    // Fetch categories from the database
    const { rows: allCategory } = await query(`SELECT * FROM "Category"`);

    // Render the counter form
    return res.render("./employee/employeeCounter", {
      pageTitle: "At the Counter",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      allCategory,
      userId,
    });

  } catch (error) {
    // Log the error and flash a message
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("/");
  }
};



exports.employeeSale = async (req, res) => {
  const userId = req.user.id;
  const storeId = req.user.store_id;
  const storeName = req.user.store_name;

  const metaItems = JSON.parse(req.body.meta);
  const cartItems = JSON.parse(req.body.cart);

  // Checking if the cart is empty
  if (cartItems.length <= 0) {
    req.flash("error_msg", "Cart cannot be empty");
    return res.redirect("/employee/create-sales");
  }

  // Unique sale identifier
  const uuidForEachSale = Date.now() + Math.floor(Math.random() * 1000);

  const insertData = [
    uuidForEachSale,
    storeId,
    storeName,
    "counter",
    sqlDate,  // Assuming sqlDate is handled elsewhere
    userId,
    metaItems.paymentType,
    metaItems.sumTotal,
    0,
  ];

  try {
    // Insert sale into Sales table
    await query(`INSERT INTO "Sales" ("sale_id", "store_id", "store_name", "sale_type", "created_date", "attendant_id", "Payment_type", "total_amount", "shipping_fee") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, insertData);

    // Process each cart item
    const promises = cartItems.map(cartItem => {
      const { id, name, price, uuid, quantity, image } = cartItem;
      const newPricePerItem = price * quantity;
      
      const productItem = [
        uuidForEachSale,
        id,
        price,
        newPricePerItem,
        storeId,
        uuid,
        name,
        quantity,
        image,
      ];

      // Insert each product into Order_Products table
      return query(`INSERT INTO "Order_Products" ("sale_id", "product_id", "price_per_item", "subTotal", "store_id", "cart_id", "name", "quantity", "image") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, productItem);
    });

    // Wait for all insert operations to complete
    await Promise.all(promises);

    // Success message and redirect to invoice page
    req.flash("success_msg", `Cart has been submitted. Your order reference number is: ${uuidForEachSale}`);
    return res.redirect(`/employee/invoice/${uuidForEachSale}`);

  } catch (error) {
    // Handle any errors during the sale process
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("/employee/create-sales");
  }
};


exports.invoice = async (req, res) => {
  const saleId = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {
    // Fetch all order products related to the sale
    const { rows: newOrderProducts } = await query(`SELECT * FROM "Order_Products" WHERE "sale_id" = $1`, [saleId]);

    // Fetch sale details
    const { rows: newSale } = await query(`SELECT * FROM "Sales" WHERE "sale_id" = $1`, [saleId]);

    if (!newSale.length) {
      req.flash("error_msg", "Sale not found.");
      return res.redirect("/");
    }

    // Render the invoice page with all the necessary data
    return res.render("./employee/saleInvoice", {
      pageTitle: "Invoice",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      newSale: newSale[0],  // Only one sale is expected, use the first item
      newOrderProducts,     // All the products associated with the sale
    });

  } catch (error) {
    // Handle any errors that may occur during the query execution
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("/");
  }
};



exports.saleHistory = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const userId = req.user.id;

  // Format today's date as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  try {
    // Query for sales made by the logged-in user on the current date
    const { rows: salesResults } = await query(
      `SELECT * FROM "Sales" WHERE "attendant_id" = $1 AND DATE("created_date") = $2`,
      [userId, today]
    );

    // Format the sales date before rendering (if applicable)
    salesResults.forEach(sale => {
      sale.created_date = formatDate(sale.created_date); // Assuming formatDate is a utility function
    });

    // Render the sales history page
    return res.render("./employee/sales-history", {
      pageTitle: "My Recent Sales",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      salesResults,
    });

  } catch (error) {
    // Log the error and redirect the user
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("/");
  }
};


exports.getItems = async (req, res) => {
  const { id } = req.params;
  const { search } = req.query;


  // Base query to select active products with stock and not expired
  let sqlQuery = `SELECT * FROM "Products" WHERE "activate" = $1 AND "total_on_shelf" > $2 AND "status" = $3`;
  let queryParams = [true, 0, 'not-expired'];

  // Check if a category is selected and append the condition
  if (id !== 'all') {
    sqlQuery += ` AND "category" = $4`;
    queryParams.push(id);
  }

  // Check if there's a search query and append the condition
  if (search) {
    sqlQuery += ` AND "ProductName" LIKE $5`;
    queryParams.push(`%${search}%`);
  }

  // Order results by ProductName
  sqlQuery += ` ORDER BY "ProductName" ASC`;

  try {
    // Execute the query
    const { rows: products } = await query(sqlQuery, queryParams);

    // If no products are found, return an empty array
    if (products.length <= 0) {
      return res.json([]);
    }

    // Return the list of products
    return res.json(products);

  } catch (error) {
    // Log and handle any errors during the query
    console.error(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect('/user');
  }
};


exports.resolveSale = async (req, res) => {
  const editID = req.params.id;

  try {
    // Fetch the sale details
    const salesResults = await query(`SELECT * FROM "Sales" WHERE id = $1`, [editID]);
    if (salesResults.rows.length === 0) {
      req.flash("error_msg", "Sale not found");
      return res.redirect("back");
    }
    
    const salesData = salesResults.rows[0];
    
    // Fetch products related to this sale
    const {rows:orderResults} = await query(`SELECT * FROM "Order_Products" WHERE "sale_id" = $1`, [salesData.sale_id]);
    
    // Aggregate product quantities
    const productQuantities = {};
    orderResults.forEach(({ product_id, quantity }) => {
      productQuantities[product_id] = (productQuantities[product_id] || 0) + quantity;
    });

    // Update stock quantities and handle errors
    const promises = Object.entries(productQuantities).map(async ([product_id, quantity]) => {
      const {rows:shelfResults} = await query(`SELECT "total_on_shelf" FROM "Products" WHERE id = $1`, [product_id]);
      if (shelfResults.length === 0) {
        req.flash("error_msg", `Product with id ${product_id} not found`);
        throw new Error(`Product with id ${product_id} not found`);
      }

      const currentShelfQuantity = shelfResults[0].total_on_shelf;
      const newQty = currentShelfQuantity - quantity;

      if (newQty < 0) {
        req.flash("error_msg", `Not enough stock for product id ${product_id}`);
        throw new Error(`Not enough stock for product id ${product_id}`);
      }

      await query(`UPDATE "Products" SET "total_on_shelf" = $1 WHERE id = $2`, [newQty, product_id]);
    });

    await Promise.all(promises);

    // Update sale status
    await query(`UPDATE "Sales" SET "status" = $1 WHERE id = $2`, ['resolved', editID]);

    req.flash("success_msg", "Sale has been resolved");
    return res.redirect("/employee/create-sales");

  } catch (error) {
    req.flash("error_msg", `Error from server: ${error.message}`);
    return res.redirect("back");
  }
};