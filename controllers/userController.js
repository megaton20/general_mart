const crypto = require('crypto');
const bcrypt = require('bcrypt');
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
const calculateShippingFee = require('../model/shippingFee');


const calculateCashback = require('../model/cashback');


const appName = `General Mart`  










//profile for user
exports.profilePage = async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch ranks
    const ranksQuery = `
      SELECT name, threshold 
      FROM "ranks"
    `;
    const ranksResult = await query(ranksQuery);
    const ranks = ranksResult.rows.map(rank => ({
      name: rank.name,
      threshold: rank.threshold
    }));

    // Fetch user data
    const userDataQuery = `
      SELECT * 
      FROM "Users" 
      WHERE "id" = $1
    `;
    const userDataResult = await query(userDataQuery, [userId]);
    const userData = userDataResult.rows[0];

    // Extract spending and cashback
    const spending = userData.spending;
    const cashBack = userData.cashback;

    // Render the profile page
    return res.render('./user/userSingleView', {
      pageTitle: 'User Profile',
      appName: appName,
      userData,
      spending,
      ranks,
      cashBack
    });
    
  } catch (error) {
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/user');
  }
};

exports.changePasswordPage = async (req, res) => {
    // Render the profile page
    return res.render('./user/change-password', {
      pageTitle: 'Change Password',
      appName: appName,
    });
    

};

exports.newPassword = async(req, res) => {

  const userId =  req.user.id

  const { oldPassword, newPasswordA,newPasswordB } = req.body;

  if (!(oldPassword && newPasswordA && newPasswordB)) {
    req.flash('error_msg', 'Enter all Fields');
    return res.redirect(`back`);
  }

      if (newPasswordA !== newPasswordB) {
        req.flash('error_msg', 'Passwords do not match');
        return res.redirect(`back`);
    }

  try {
          // Fetch user data
          const userDataQuery = `SELECT * FROM "Users" WHERE "id" = $1`;
          const {rows: userDataResult} = await query(userDataQuery, [userId]);
          const userData = userDataResult[0];
      
          const isMatch = await bcrypt.compare(oldPassword, userData.Password);
      
      
          if (!isMatch) {
            req.flash('error_msg', 'Old Password is not correct');
            return res.redirect('back')
          }
  } catch (error) {
    console.log(error);
    req.flash('success_msg', `errorr form server`);
    return  res.redirect('/');
  }

  const hashedPassword = bcrypt.hashSync(newPasswordA, 10);



        try {

          await query('UPDATE "Users" SET "Password" = $1 WHERE email = $2', [hashedPassword, req.user.email])
              req.flash('success_msg', 'Password changed successfully');
            return  res.redirect('/user/profile');
          
        } catch (error) {
          console.log(error);
          req.flash('success_msg', `errorr form server: ${error.message}`);
          return  res.redirect('/login');
        }
};



exports.editProfilePage = async (req, res) => {
  const updateId = req.params.id;

  try {
    // Fetch user data
    const userQuery = `
      SELECT * 
      FROM "Users" 
      WHERE "id" = $1
    `;
    const userResult = await query(userQuery, [updateId]);
    const userData = userResult.rows[0];


    // Render the edit profile page
    return res.render('./user/userEditPage', {
      pageTitle: 'Edit Profile',
      appName: appName,
      userData,
      stateData
    });

  } catch (error) {
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/user');
  }
};

exports.updateImage = async (req, res) => {
  const uploadId = req.params.id;
  let filename;

  // Set the image name from the uploaded file or use a default image
  if (req.file) {
    filename = req.file.filename;
  } else {
    filename = 'default.jpg';
  }

  const postData = { image: filename };

  try {
    // Update the user profile with the new image
    const updateQuery = `UPDATE "Users" SET "image" = $1 WHERE "id" = $2`;
    await query(updateQuery, [postData.image, uploadId]);

    req.flash("success_msg", "Image uploaded successfully!");
    return res.redirect(`/user/profile/`);
  
  } catch (error) {
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
    }
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/user');
  }
};


exports.updateUserInfo = async (req, res) => {
  const userId = req.params.id;
  let errors = [];

  try {
    const { First_name, Last_name, gender, Address, land_mark, state, lga } = req.body;

    // Check for missing fields
    if (!(state && lga && land_mark && Address && gender && First_name && Last_name)) {
      errors.push({ msg: "Please enter all details" });
    }

    // Check if user exists
    const userResult = await query(
      `SELECT * FROM "Users" WHERE "id" = $1`,
      [userId]
    );

    if (userResult.length <= 0) {
      errors.push({ msg: "User does not exist" });
    }

    if (errors.length > 0) {
      return res.render('./user/userEditPage', {
        pageTitle: 'Edit Profile',
        appName: appName,
        userData: { ...req.body }, // Pass current user data for the form
        stateData, // Ensure `stateData` is defined or fetched properly
        errors,
      });
    }

    // Update user information
    const updateQuery = `
      UPDATE "Users"
      SET "First_name" = $1, "Last_name" = $2, "gender" = $3, "Address" = $4, "land_mark" = $5, "state" = $6, "lga" = $7
      WHERE "id" = $8
    `;

    await query(updateQuery, [
      First_name,
      Last_name,
      gender,
      Address,
      land_mark,
      state,
      lga,
      userId
    ]);

    req.flash("success_msg", "User updated successfully!");
    return res.redirect(`/user/profile/`);

  } catch (error) {
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/user');
  }
};


// shopping window
exports.userShop = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  const limit = 12;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const countSql = 'SELECT COUNT(*) as count FROM "Products"';
  const showcaseQuery = `
    SELECT * FROM "Products" 
    WHERE "showcase" = $1 AND "total_on_shelf" > $2 AND "status" = $3 
    LIMIT $4 OFFSET $5`;
  const queryParams = ['yes', 0, 'not-expired', limit, offset];

  try {
    const results = await query(showcaseQuery, queryParams);
    const showcaseItem = JSON.parse(JSON.stringify(results.rows));
    const moreItemsAvailable = results.rows.length === limit;

    const countResult = await query(countSql);
    const totalRows = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRows / limit);

    const cartResults = await query('SELECT * FROM "Cart" WHERE "user_id" = $1', [req.user.id]);
    const presentCart = JSON.parse(JSON.stringify(cartResults.rows));

    const categoryResults = await query('SELECT * FROM "Category"');
    const allCategory = JSON.parse(JSON.stringify(categoryResults.rows));

    return res.render('./user/userCounter', {
      pageTitle: 'At the counter',
      appName: process.env.APP_NAME,
      name: `${userFirstName} ${userLastName}`,
      allCategory,
      presentCart,
      showcaseItem,
      moreItemsAvailable,
      pagination: {
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error(`Error fetching user shop data: ${error.message}`);
    req.flash('error_msg', 'An error occurred while loading the shop. Please try again later.');
    return res.redirect('/');
  }
};


// shopping window
exports.userShopQuery = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  const limit = 12;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  // PostgreSQL SQL queries
  const sql = `
    SELECT * FROM "Products" 
    WHERE "showcase" = $1 AND "total_on_shelf" > $2 AND "status" = $3 
    LIMIT $4 OFFSET $5`;
  const countSql = `
    SELECT COUNT(*) as count FROM "Products" 
    WHERE "showcase" = $1 AND "total_on_shelf" > $2 AND "status" = $3`;
  const queryParams = ['yes', 0, 'not-expired', limit, offset];

  try {
    const results = await query(sql, queryParams.slice(0, 3).concat([limit, offset]));
    const products = JSON.parse(JSON.stringify(results.rows));

    const countResult = await query(countSql, queryParams.slice(0, 3));
    const totalRows = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRows / limit);

    const cartResults = await query('SELECT * FROM "Cart" WHERE "user_id" = $1', [req.user.id]);
    const presentCart = JSON.parse(JSON.stringify(cartResults.rows));

    const categoryResults = await query('SELECT * FROM "Category"');
    const allCategory = JSON.parse(JSON.stringify(categoryResults.rows));

    res.render('./user/userCounterQuery', {
      pageTitle: 'At the counter',
      appName: process.env.APP_NAME,
      name: `${userFirstName} ${userLastName}`,
      allCategory,
      presentCart,
      products,
      pagination: {
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    req.flash('error_msg', 'An error occurred while loading the shop. Please try again later.');
    return res.redirect('/user');
  }
};



// pagination by category
exports.userCategoryQuery = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const categoryId = req.params.category;
  const limit = 12;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  let productQuery = `SELECT * FROM "Products"  WHERE "activate" = $1 AND "total_on_shelf" > $2 AND "status" = $3`;
  let queryParams = ['yes', 0, 'not-expired'];

  // Add category condition if it's not 'all'
  if (categoryId !== 'all') {
    productQuery += ` AND "category" = $4`;
    queryParams.push(categoryId);
  }

  productQuery += ` LIMIT $5 OFFSET $6`;
  queryParams.push(limit, offset);

  try {
    const results = await query(productQuery, queryParams);
    const products = JSON.parse(JSON.stringify(results.rows));

    // Adjust count query and parameters
    let countQuery = `
      SELECT COUNT(*) as count FROM "Products" 
      WHERE "activate" = $1 AND "total_on_shelf" > $2 AND "status" = $3`;
    let countParams = queryParams.slice(0, 3);

    if (categoryId !== 'all') {
      countQuery += ` AND "category" = $4`;
      countParams.push(categoryId);
    }

    const countResult = await query(countQuery, countParams);
    const totalRows = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRows / limit);

    const cartResults = await query('SELECT * FROM "Cart" WHERE "user_id" = $1', [req.user.id]);
    const presentCart = JSON.parse(JSON.stringify(cartResults.rows));

    const categoryResults = await query('SELECT * FROM "Category"');
    const allCategory = JSON.parse(JSON.stringify(categoryResults.rows));

    res.render('./user/userCategoryQuery', {
      pageTitle: 'Products by Category',
      appName: process.env.APP_NAME,
      name: `${userFirstName} ${userLastName}`,
      allCategory,
      presentCart,
      products,
      pagination: {
        page,
        totalPages
      },
      activeCategory: categoryId
    });
  } catch (error) {
    console.error(`Server error: ${error}`);
    req.flash('error_msg', 'An error occurred while loading the products. Please try again later.');
    return res.redirect('/user');
  }
};


exports.productDetails = async (req, res) => {
  const itemId = req.params.id;

  try {
    const cartResults = await query('SELECT * FROM "Cart" WHERE "user_id" = $1', [req.user.id]);
    const presentCart = JSON.parse(JSON.stringify(cartResults.rows));

    const itemResults = await query('SELECT * FROM "Products" WHERE "id" = $1', [itemId]);
    const itemData = JSON.parse(JSON.stringify(itemResults.rows));

    return res.render('./user/product-details', { 
      pageTitle: "Details",
      appName: process.env.APP_NAME,
      itemData,
      presentCart
    });
  } catch (error) {
    console.error(`Error fetching product details: ${error.message}`);
    req.flash('error_msg', 'An error occurred while loading the product details. Please try again later.');
    return res.redirect('/user');
  }
};


exports.searchPage = (req, res) => {

    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

        return res.render("./user/userSearchPage", {
          pageTitle: "Search your item",
          appName:appName,
          name: `${userFirstName} ${userLastName}`,
          month: monthName,
          day: dayName,
          date: presentDay,
          year: presentYear,
        }); // for admin only
        // not user
};

exports.searchPost = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const { search } = req.body;

  try {
    // Define the search pattern
    const searchPattern = `%${search}%`;

    // PostgreSQL search query
    const searchQuery = `
      SELECT * FROM "Products" 
      WHERE "status" = 'not-expired' 
      AND "total_on_shelf" > 0 
      AND ("ProductName" ILIKE $1 OR "details" ILIKE $2)`;

    // Execute the search query
    const searchResults = await query(searchQuery, [searchPattern, searchPattern]);

    // Get the user's cart
    const cartResults = await query('SELECT * FROM "Cart" WHERE "user_id" = $1', [req.user.id]);
    const presentCart = JSON.parse(JSON.stringify(cartResults.rows));

    // Render the search results page
    return res.render("./user/userSearchResults", {
      pageTitle: "Search Results",
      appName: process.env.APP_NAME,
      name: `${userFirstName} ${userLastName}`,
      products: searchResults.rows,
      presentCart,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
    });

  } catch (error) {
    console.error(`Error during search: ${error.message}`);
    req.flash('error_msg', 'An error occurred while searching. Please try again later.');
    return res.redirect('/user');
  }
};

  

exports.fetchCart = async (req, res) => {
  const userId = req.user.id; 
  const userEmail = req.user.email;

  try {
    // Fetch user data
    const userResults = await query('SELECT * FROM "Users" WHERE "id" = $1', [userId]);
    const userData = userResults.rows[0];

    // Fetch cart items
    const fetchCartQuery = 'SELECT * FROM "Cart" WHERE "user_id" = $1 AND "user_email" = $2';
    const fetchResult = await query(fetchCartQuery, [userId, userEmail]);

    // Check if the cart is empty
    if (fetchResult.rows.length <= 0) {
      req.flash('warning_msg', 'No items in the cart. Please select items to buy.');
      return res.redirect('/user');
    }
    
    
    // Calculate the total subtotal
    const totalSubtotal = fetchResult.rows.reduce((accumulator, item) => {
      return accumulator + parseFloat(item.subtotal);

    }, 0);

    // Format the total amount to be paid
    const formattedCustomerToPay = totalSubtotal.toLocaleString("en-US");

    // Render the cart page
    res.render('./user/cart', { 
      pageTitle: "Cart items",
      appName: process.env.APP_NAME,
      cartItems: fetchResult.rows,
      totalSubtotal,
      totalSum: formattedCustomerToPay,
      userData,
    });

  } catch (error) {
    console.error(`Error fetching cart: ${error}`);
    req.flash('error_msg', 'An error occurred while fetching your cart. Please try again later.');
    return res.redirect('/user');
  }
};


// checkoutScreen of an order
exports.checkoutScreen = async (req, res) => {
  const userId = req.params.id;
  const userEmail = req.user.email;

  try {
    // Fetch user data
    const userResults = await query('SELECT * FROM "Users" WHERE "id" = $1', [userId]);
    const userData = userResults.rows[0];

    // Fetch cart items
    const fetchCartQuery = 'SELECT * FROM "Cart" WHERE "user_id" = $1 AND "user_email" = $2';
    const cartResults = await query(fetchCartQuery, [userId, userEmail]);

    // Check if the cart is empty
    if (cartResults.rows.length <= 0) {
      req.flash('warning_msg', 'No items in the cart. Please select items to buy.');
      return res.redirect('/user');
    }

    // Calculate the total subtotal
    const totalSubtotal = cartResults.rows.reduce((accumulator, item) => {
      return accumulator + parseFloat(item.subtotal);
    }, 0);

    // Calculate the shipping fee based on user's LGA (Local Government Area)
    const shippingFee = calculateShippingFee(userData.lga); 

    // Calculate total amount to be paid
    const customerToPay = shippingFee + totalSubtotal;

    const formattedCustomerToPay = customerToPay.toLocaleString("en-US");

    // Render the checkout page
    res.render('./user/userCheckout', {
      pageTitle: "Payment Section",
      appName: process.env.APP_NAME,
      cartItems: cartResults.rows,
      totalSubtotal,
      shippingFee,
      totalSum: formattedCustomerToPay,
      customerToPay,
      userData,
    });

  } catch (error) {
    console.error(`Error during checkout: ${error}`);
    req.flash('error_msg', 'An error occurred during checkout. Please try again later.');
    return res.redirect('/user');
  }
};


// cart sending for order
exports.submitCart = async (req, res) => {
  const transactionPaymentReference = req.params.reference;
  const email = req.user.email;
  const userId = req.user.id;
  const storeId = req.user.store_id;
  const storeName = req.user.store_name;



  const generateNumericUUID = (length) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

// Example usage:
const uuidForEachSale = generateNumericUUID(10);

  const generateSecurePin = (length) => {
      return crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
  };

  const privatePin = generateSecurePin(6); // Generates a 6-digit PIN

  try {
      // Check if the transaction exists
      const transactionResults = await query(`SELECT * FROM "Transactions" WHERE "reference" = $1`, [transactionPaymentReference]);
      const transactionData = transactionResults.rows[0];

      if (!transactionData || email !== transactionData.email) {
          req.flash('error_msg', 'Transaction not found or email conflict.');
          return res.redirect('/user');
      }

      // Fetch user data
      const userResults = await query(`SELECT * FROM "Users" WHERE "id" = $1`, [userId]);
      const userData = userResults.rows[0];

      // Fetch cart items
      const cartItemsResults = await query(`SELECT * FROM "Cart" WHERE "user_id" = $1`, [userId]);
      const cartItems = cartItemsResults.rows;

      // Calculate the total subtotal
      const totalSubtotal = cartItems.reduce((accumulator, item) => accumulator + parseFloat(item.subtotal), 0);

      const shippingFee = calculateShippingFee(userData.lga); // Assuming calculateShippingFee is defined
      const cashbackEarned = calculateCashback(totalSubtotal); // Assuming calculateCashback is defined

      // Insert data into Orders table
      const insertOrderQuery = `
          INSERT INTO "Orders" (
              "customer_email", "customer_id", "customer_phone", "customer_address",
              "customer_state", "customer_lga", "delivery_pin", "pick_up_store_id",
              "pick_up_store_name", "sale_id", "transaction_id", "Delivery",
              "status", "Payment_type", "created_date", "total_amount", "shipping_fee"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;
      const orderValues = [
          email, userId, userData.Phone, userData.Address,
          userData.state, userData.lga, privatePin, storeId,
          storeName, uuidForEachSale, transactionData.id, 'Delivery',
          'incomplete', 'cash', new Date(), totalSubtotal, shippingFee
      ];
      await query(insertOrderQuery, orderValues);

      // Insert data into Order_Products table
      const insertOrderProductsQuery = `
          INSERT INTO "Order_Products" (
              "sale_id", "product_id", "price_per_item", "subTotal",
              "store_id", "cart_id", "status", "name", "quantity", "image"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      const orderProductPromises = cartItems.map(cartItem => {
          const { product_id, price_per_item, quantity, product_name, subtotal, uuid, image } = cartItem;
          return query(insertOrderProductsQuery, [
              uuidForEachSale, product_id, price_per_item, subtotal,
              storeId, uuid, 'pending', product_name, quantity, image
          ]);
      });
      await Promise.all(orderProductPromises);

      // Clear the cart after the order is placed
      await query(`DELETE FROM "Cart" WHERE "user_id" = $1`, [userId]);

      req.flash('success_msg', `NGN ${cashbackEarned} earned!... Your order PIN number is: ${privatePin}`);

    return res.render('./user/order-success', {
      pageTitle: 'successful',
      appName: appName,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      saleId:uuidForEachSale,
      cashback:cashbackEarned,
      PIN:privatePin
    });



  } catch (error) {
      console.error(`Error during submitCart: ${error}`);
      req.flash('error_msg', 'NOTE: You were not charged from your account.');
      // res.redirect('/');
      return res.render('./user/order-failed', {
        pageTitle: 'successful',
        appName: appName,
        month: monthName,
        day: dayName,
        date: presentDay,
        year: presentYear,
      });
  }
};




// invoice of an order
exports.invoice = async (req, res) => {
  const saleId = req.params.id;
  const userId = req.user.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {
    // Fetch user data
    const userResults = await query('SELECT * FROM "Users" WHERE "id" = $1', [userId]);
    const userData = userResults.rows[0];
    
    // Fetch order data
    const orderResults = await query('SELECT * FROM "Orders" WHERE "sale_id" = $1', [saleId]);
    const newOrder = orderResults.rows[0];
    
    if (!newOrder) {
      req.flash('error_msg', 'Order not found in records');
      return res.redirect('/');
    }
    
    // Fetch ordered products
    const orderProductsResults = await query('SELECT * FROM "Order_Products" WHERE "sale_id" = $1', [saleId]);
    const newOrderProducts = orderProductsResults.rows;
    
    // Fetch sale data
    const saleResults = await query('SELECT * FROM "Sales" WHERE "sale_id" = $1', [saleId]);
    const newSale = saleResults.rows[0];
    
    // Calculate total sum (order total + shipping fee)
    const unformattedAmount = parseFloat( newOrder.total_amount) +parseFloat( newOrder.shipping_fee);
    const  totalSum = unformattedAmount.toLocaleString("en-US");
    // Render the invoice page
    return res.render('./user/userInvoice', {
      pageTitle: 'Invoice',
      appName: appName,
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      userData,
      newSale,
      newOrderProducts,
      newOrder,
      totalSum,
    });

  } catch (error) {
    console.error(`Error during invoice generation: ${error.message}`);
    req.flash('error_msg', `Error: ${error.message}`);
    return res.redirect('/');
  }
};



// all orders made my a user
exports.allUserOrder = async (req, res) => {
  const sessionEmail = req.user.email;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  if (!sessionEmail) {
    req.flash('error_msg', 'No session, you are required to log in');
    return res.redirect('/');
  }

  try {
    // Fetch the last 5 orders for the logged-in user
    const ordersQuery = `SELECT * FROM "Orders" WHERE "customer_email" = $1 ORDER BY "id" DESC LIMIT 5`;
    const ordersResult = await query(ordersQuery, [sessionEmail]);
    const newOrder = ordersResult.rows;

    // Render the orders page with fetched data
    return res.render('./user/userOrders', {
      pageTitle: 'Orders',
      appName: appName,
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      newOrder,
    });

  } catch (err) {
    console.error(`Error fetching orders: ${err.message}`);
    req.flash('error_msg', `Error: ${err.message}`);
    return res.redirect('/');
  }
};



exports.cancelOrder = async (req, res) => {
  const saleId = req.params.id;

  const updateData = {
    status: 'canceled'
  };

  try {
    // Fetch the order details
    const orderQuery = `
      SELECT * FROM "Orders" 
      WHERE "sale_id" = $1
    `;
    const orderResults = await query(orderQuery, [saleId]);
    
    // Check if the order exists
    if (orderResults.rows.length <= 0) {
      req.flash('error_msg', 'Order does not exist');
      return res.redirect('/user');
    }

    const orderStatus = orderResults.rows[0];
    const transactionId = orderStatus.transaction_id;

    // Check if the order is already canceled
    if (orderStatus.status === 'canceled') {
      req.flash('error_msg', `Order ${saleId} has already been canceled`);
      return res.redirect('/user');
    }

    // Check if the order is in a state that allows cancellation
    if (orderStatus.status !== 'incomplete') {
      req.flash('error_msg', `Order ${saleId} cannot be canceled at this stage`);
      return res.redirect('/user');
    }

    // Update the transaction to mark it as canceled
    const updateTransactionQuery = `
      UPDATE "Transactions" 
      SET "cancel" = 'yes' 
      WHERE "id" = $1
    `;
    await query(updateTransactionQuery, [transactionId]);

    // Update the order status to "canceled"
    const updateOrderQuery = `
      UPDATE "Orders" 
      SET "status" = $1 
      WHERE "sale_id" = $2 
      AND "status" = 'incomplete'
    `;
    await query(updateOrderQuery, [updateData.status, saleId]);

    // Update the status of all products associated with the order
    const updateOrderProductsQuery = `
      UPDATE "Order_Products" 
      SET "status" = $1 
      WHERE "sale_id" = $2
    `;
    await query(updateOrderProductsQuery, [updateData.status, saleId]);

    // Success message
    req.flash('warning_msg', 'Order canceled successfully');
    res.redirect('/user');

  } catch (err) {
    req.flash('error_msg', `Error: ${err.message}`);
    return res.redirect('/user');
  }
};


exports.contactForm = async (req, res) => {

  const { senderEmail, message,title } = req.body;

  if (!(senderEmail && message && title)) {
      req.flash('error_msg', `Error: Enter all fields `);
      return res.redirect('back');
  }
  try {
    // Insert new email
    const insertQuery = `INSERT INTO "contact_messages" ("email", "created_at", "message", "title") VALUES ($1, $2, $3, $4)`;
    await query(insertQuery, [senderEmail, new Date(), message, title]);

    req.flash('success_msg', `message sent`);
    return res.redirect('back');
  } catch (error) {
    console.log(error);
    req.flash('error_msg', 'Error from database');
    return res.redirect('back');
  }
};

