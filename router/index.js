const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const axios = require('axios');
const { promisify } = require('util');
const db = require("../model/databaseTable");
const query = promisify(db.query).bind(db);
const passport = require('../config/passport');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const stateData = require("../model/stateAndLGA");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const appName = "True Essentials Mart"




router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {

    try {
      // Parameterized query to prevent SQL injection
      const updateQuery = `
        UPDATE "Users"
        SET "previous_visit" = $1
        WHERE "id" = $2
      `;

      // Execute the query with parameters
      await query(updateQuery, [new Date(), req.user.id]);

      // Flash a success message and redirect
      req.flash("success_msg", `Welcome back ${req.user.First_name}!`);
      res.redirect('/handler');
    } catch (error) {
      console.error('Error during user update:', error);

      // Determine the type of error and respond accordingly
      let errorMessage = 'An unexpected error occurred. Please try again later.';
      
      // Customize the error message based on the error type
      if (error.name === 'QueryFailedError') {
        errorMessage = 'Database error. Please contact support if this continues.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      return res.render('login', {
        error_msg: errorMessage,
        pageTitle: `Login To continue Using ${appName}`,
        appName: appName,
      });
    }
  }
);


// Welcome Page
router.get('/', async (req, res) => {
  let userActive = false;
  if (req.user) {
    userActive = true;
  }

  const limit = 16;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const showcaseQuery = `SELECT * FROM "Products" WHERE "showcase" = $1 AND "total_on_shelf" > $2 AND "status" = $3 AND "activate"=$4 LIMIT $5 OFFSET $6`;
  const queryParams = ['yes', 0, 'not-expired', true, limit, offset];

  try {
    // Fetch showcase items
    const { rows: showcaseItem } = await query(showcaseQuery, queryParams);

    // Format prices for showcase items
    showcaseItem.forEach(product => {
      product.price = product.UnitPrice.toLocaleString("en-US");
    });

    // Fetch all categories
    const { rows: allCategory } = await query('SELECT * FROM "Category"');

    // Divide categories into two halves
    const half = Math.ceil(allCategory.length / 2);
    const firstHalfCategories = allCategory.slice(0, half);
    const secondHalfCategories = allCategory.slice(half);

    // Fetch products for the first half of categories
    let firstHalfCategoriesWithProducts = [];
    for (let category of firstHalfCategories) {
      const { rows: products } = await query(`
        SELECT * FROM "Products"
        WHERE "category_id" = $1 
          AND "total_on_shelf" > $2 
          AND "status" = $3 
          AND "activate" = $4
        LIMIT 6`,
        [category.CategoryID, 0, 'not-expired', true]);

  // Format prices for each product
products.forEach(product => {
  // Ensure the price is a number and then format it
  product.price = parseFloat(product.UnitPrice).toLocaleString("en-US");
});

      firstHalfCategoriesWithProducts.push({
        categoryName: category.Category_name,
        products: products
      });

    }

    // Fetch products for the second half of categories
    let secondHalfCategoriesWithProducts = [];
    for (let category of secondHalfCategories) {
      const { rows: products } = await query(`
        SELECT * FROM "Products"
        WHERE "category_id" = $1 
          AND "total_on_shelf" > $2 
          AND "status" = $3 
          AND "activate" = $4
        LIMIT 6`,
        [category.CategoryID, 0, 'not-expired', true]);

  // Format prices for each product
products.forEach(product => {
  // Ensure the price is a number and then format it
  product.price = parseFloat(product.UnitPrice).toLocaleString("en-US");
});

      secondHalfCategoriesWithProducts.push({
        categoryName: category.Category_name,
        products: products
      });

    }


    // Render the landing page
    res.render('landing', {
      pageTitle: `Welcome to ${appName}`,
      appName,
      userActive,
      allCategory,
      showcaseItem,
      firstHalf: firstHalfCategoriesWithProducts,
      secondHalf: secondHalfCategoriesWithProducts
    });

  } catch (error) {
    console.error(`Error fetching user shop data: ${error}`);
    req.flash('error_msg', 'An error occurred while loading the shop items');
    return res.redirect('/');
  }
});

// policy Page
router.get('/policy', async(req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('policy',{
    pageTitle:` ${appName} policy`,
    appName,
    userActive,
    allCategory
  });
}
)

router.get('/faq', async(req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('faq',{
    pageTitle:` ${appName} faq`,
    appName,
    userActive,
    allCategory
  });
}
)
router.get('/featured-services', async(req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('featured-services',{
    pageTitle:` ${appName} featured-services`,
    appName,
    userActive,
    allCategory
  });
}
)
router.get('/contact', async (req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('contact',{
    pageTitle:` ${appName} contact`,
    appName,
    userActive,
    allCategory
  });
}
)

// driver Page
router.get('/new-rider', async(req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('./drivers/about-riders',{
    pageTitle:` ${appName} drivers`,
    appName,
    userActive,
    allCategory
  });
}
)

// vendor Page
router.get('/new-vendor',async (req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('./vendor/about-vendor',{
    pageTitle:` ${appName} vendor`,
    appName,
    userActive,
    allCategory
  });
}
)

router.post('/forms/newsletter', async (req, res) => {
  if (!req.body.email) {
    req.flash('warning_msg', 'Enter email address');
    return res.redirect('back');
  }

  try {
    // Check if email already exists
    const checkQuery = 'SELECT * FROM "newsletter" WHERE "email" = $1';
    const checkResult = await query(checkQuery, [req.body.email]);

    if (checkResult.rowCount > 0) {
      req.flash('warning_msg', `${req.body.email} already receives our letters`);
      return res.redirect('back');
    }

    // Insert new email
    const insertQuery = `
      INSERT INTO "newsletter" ("email", "created_at")
      VALUES ($1, $2)
    `;
    await query(insertQuery, [req.body.email, new Date()]);

    req.flash('success_msg', `${req.body.email} will receive our letters`);
    return res.redirect('back');
  } catch (error) {
    console.log(error);
    req.flash('error_msg', 'Error from database');
    return res.redirect('back');
  }
});


// terms Page
router.get('/terms', async(req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('terms',{
    pageTitle:` ${appName} terms`,
    appName,
    userActive,
    allCategory
  });
}
)

// terms Page
router.get('/abouts', async (req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('abouts',{
    pageTitle:` ${appName} | Abouts`,
    appName,
    userActive,
    allCategory
  });
}
)

router.get('/valid-location', async(req, res) => {
  let userActive= false
  if (req.user) {
    userActive = true
  }
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  const { rows: shippingRegions } = await query(`SELECT state, lga, fee FROM "shipping_regions"`);

  // Organizing data
  const shippingData = {};
  
  shippingRegions.forEach(region => {
      const { state, lga, fee } = region;
  
      if (!shippingData[state]) {
          shippingData[state] = [];
      }
      shippingData[state].push({ lga, fee }); // Store both LGA and fee
  });


  res.render('valid-location',{
    pageTitle:` ${appName} | valid-location`,
    appName,
    userActive,
    shippingData,
    allCategory
  });
}
)

router.get('/handler', (req, res)=>{
  
  if (req.isAuthenticated()) {
    const role = req.user.userRole
    const position = req.user.position
    const user = req.user.First_name
    
    
        if ((role == "super")) {
          req.flash("success_msg", `welcome back ${user}`);
         return res.redirect("/super");

        //  admin for main company
        } else if (role == "admin") {
          
          if (position == 'Logistics') {
            req.flash("success_msg", `welcome back ${user}`);
            return res.redirect("/logistics");
          }

          if(position == "Attendant") {
            return res.redirect("/employee");
          }

          // admins  ends here
        } else if(role == "user"){

         return res.redirect("/user");
        }else if(role == "driver"){

         return res.redirect("/drivers");
        }
        // not authenticated
        }else {
        req.flash("error_msg", `please log in to use our valuable resources`);
        res.redirect('/login')
      }
 
})


router.get('/login', forwardAuthenticated, (req, res) => res.render('login',{
  pageTitle:`Login To continue Using  ${appName} `,
  appName,
  }));

router.get('/register', forwardAuthenticated, (req, res) =>{

  const referrerCode = req.query.ref || null;

  if (referrerCode) {
    req.session.referrerCode = referrerCode
  }
  
  res.render('register',{
    pageTitle:`Create account with ${appName}`,
    appName,
    referralCode:referrerCode,
    stateData
  })
} 
);

router.get('/forget', forwardAuthenticated, (req, res) => res.render('forget-password',{
  pageTitle:`enter recovery email for  ${appName}`,
  appName,
  }));


  
  // Route to fetch LGAs for a selected state
router.get("/getlgas/:state", (req, res) => {

  const { state } = req.params;
  const selectedState = stateData.find((s) => s.state === state);


  if (selectedState) {
    res.json(selectedState.lgas);
  } else {
    res.status(404).json({ error: "State not found" });
  }
});

// cart update actions
router.post('/addCartItems', ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    // Clear existing cart items for the user
    const clearCartQuery = 'DELETE FROM "Cart" WHERE "user_id" = $1';
    await query(clearCartQuery, [userId]);

    // Prepare new cart items for insertion
    const cartItems = req.body.cart || [];
    if (cartItems.length === 0) {
      req.flash('success_msg', 'Cart updated successfully');
      return res.redirect('back');
    }

    const insertCartQuery = `
      INSERT INTO "Cart" ("user_id", "user_email", "product_id", "quantity", "product_name", "max", "price_per_item", "subtotal", "uuid", "image")
      VALUES ${cartItems.map((_, index) => `($${index * 10 + 1}, $${index * 10 + 2}, $${index * 10 + 3}, $${index * 10 + 4}, $${index * 10 + 5}, $${index * 10 + 6}, $${index * 10 + 7}, $${index * 10 + 8}, $${index * 10 + 9}, $${index * 10 + 10})`).join(', ')}
    `;

    const cartValues = cartItems.flatMap(item => [
      userId,
      userEmail,
      item.id,
      item.quantity,
      item.name,
      item.max,
      item.price,
      (item.price * item.quantity),
      item.uuid,
      item.image
    ]);

    // Insert new cart items
    await query(insertCartQuery, cartValues);

    req.flash('success_msg', 'Cart updated successfully');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to update cart');
    res.redirect('back');
  }
});


// check out cart item update
router.post('/updateCartItem', ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  const { productId, change } = req.body;

  try {
    // Fetch the current cart item
    const getItemQuery = `SELECT * FROM "Cart" WHERE "user_id" = $1 AND "user_email" = $2 AND "product_id" = $3`;
    const { rows: results } = await query(getItemQuery, [userId, userEmail, productId]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const item = results[0];
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
      // Delete the cart item
      const deleteItemQuery = `DELETE FROM "Cart" WHERE "id" = $1`;
      await query(deleteItemQuery, [item.id]);
      return res.json({ success: true });
    } else {
      // Update the cart item
      const updateItemQuery = `
      UPDATE "Cart" 
      SET "quantity" = $1::INTEGER, "subtotal" = "price_per_item" * $1::NUMERIC 
      WHERE "id" = $2
    `;
    await query(updateItemQuery, [newQuantity, item.id]);
    
      await query(updateItemQuery, [newQuantity, item.id]);  // Removed console.log
      return res.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update cart item' });
  }
});



// paystack
router.post('/pay', async (req, res) => {
  const { email, amount, applyCashback, oAmnt } = req.body;

  // Store cashback details in the session
  req.session.applyCashback = applyCashback;
  req.session.oAmnt = oAmnt;

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack expects the amount in kobo
      callback_url: `${process.env.LIVE_DIRR || process.env.NGROK_URL || `http://localhost:${process.env.PORT}`}/verify`,
      metadata: {
        userId: req.user.id, // Include user ID from session
        applyCashback: applyCashback,
        oAmnt: oAmnt,        // Original amount (stored in metadata)
      }
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});




router.get('/verify', async (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    req.flash('error_msg', 'No reference provided');
    return res.redirect('/user');
  }

  try {
    // Verify transaction with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    if (response.data.status && response.data.data.status === 'success') {
      req.flash('success_msg', 'Payment successful');
      return res.redirect(`/user/order/${reference}`);
      
    } else {
      // Handle failed verification
      console.log('Payment verification failed:', response.data.data);
      req.flash('error_msg', 'Payment unsuccessful');
      return res.redirect('/user');
    }
  } catch (error) {

    console.log(error);
    // try {
      
    //   const getItemQuery = `SELECT * FROM "Transactions" WHERE "reference" = $1 AND "email" = $2 `;
    //   const { rows: results } = await query(getItemQuery, [reference, req.user.email]);
  
    //   if(results.length > 0) {

    //     const updateCashbackQuery = `UPDATE "Transactions" SET "status" = $1 WHERE "reference" = $2`;
    //     await db.query(updateCashbackQuery, ["failed", results.reference]);
        
    //     console.error('system Error verifying flaging payment succesful:', error);
    //     req.flash('error_msg', 'Server error, flaging payment succesful');
    //     return res.redirect('/user');
    //   }

    // } catch (error) {

    //   console.error('system Error verifying and flaging payment unsuccesful:', error);
    //   req.flash('error_msg', 'Server error, flaging payment unsuccesful');
    //   return res.redirect('/user');

    // }
  }
});



router.post('/webhook', async (req, res) => {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
                     .update(JSON.stringify(req.body))
                     .digest('hex');

  // Check Paystack webhook signature
  if (hash === req.headers['x-paystack-signature']) {
    const event = req.body;

    try {
      // Handle successful payments
      if (event.event === 'charge.success') {
        const { id, reference, amount, currency, status, customer: { email }, paid_at, metadata } = event.data;
        const { applyCashback, userId, oAmnt } = metadata;

        // Save transaction details to the database
        const query = `
          INSERT INTO "Transactions" ("transaction_id", "reference", "amount", "currency", "status", "email", "paid_at", "user_id") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await db.query(query, [id, reference, amount / 100, currency, status, email, paid_at, userId]);

        // Fetch the user's current cashback using userId
        const userQuery = `SELECT "cashback" FROM "Users" WHERE "id" = $1`;
        const userResults = await db.query(userQuery, [userId]);
        const currentCashback = userResults.rows[0].cashback;

        // Apply cashback if applicable
        if (applyCashback) {
          const cashbackDeduction = Math.min(currentCashback, oAmnt * 0.6); // Deduct up to 60% of the total cashback
          const newCashback = Math.max(0, currentCashback - cashbackDeduction); // Ensure cashback doesn't go below 0

          // Update user's cashback in the database
          const updateCashbackQuery = `UPDATE "Users" SET "cashback" = $1 WHERE "id" = $2`;
          await db.query(updateCashbackQuery, [newCashback, userId]);
        }

        // Transaction successfully handled, respond with 200 OK
        console.log('Payment successful and transaction recorded:', reference);
        return res.sendStatus(200);
      } else {
        console.log(`Unhandled event type: ${event.event}`);
        return res.sendStatus(200); // Acknowledge other unhandled events
      }
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      return res.sendStatus(500); // Internal server error
    }
  } else {
    console.log('Invalid webhook signature');
    return res.sendStatus(400); // Bad request due to invalid signature
  }
});



// Logout route
router.get('/logout',ensureAuthenticated, (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You have logged out successfully.');
    res.redirect('/login');
  });
});



router.post('/calculate-profit', ensureAuthenticated, async (req, res) => {
  const amount = parseFloat(req.body.amount);
  const inventoryId = req.body.inventoryId;

  if (isNaN(amount) || !inventoryId) {
    return res.status(400).json({ success: false, error: 'Invalid input' });
  }

  try {
    // Prepare and execute the query
    const query = `
      SELECT "Purchase_price", "Total_damaged", "Cost_of_delivery", "QTY_recieved", "total_in_pack" 
      FROM "inventory" 
      WHERE "id" = $1
    `;
    const { rows } = await db.query(query, [inventoryId]);

    if (rows.length > 0) {
      const { Purchase_price, Total_damaged, Cost_of_delivery, QTY_recieved, total_in_pack } = rows[0];
      
      // Compute the required values
      const total_cost_per_pack = Purchase_price + Cost_of_delivery + Total_damaged;
      const total_revenue_per_pack = amount * total_in_pack;
      const profit_per_pack = total_revenue_per_pack - total_cost_per_pack;
      const profit_margin_per_pack = (profit_per_pack / total_revenue_per_pack) * 100;
      
      const total_revenue_all_packs = total_revenue_per_pack * QTY_recieved;
      const total_cost_all_packs = total_cost_per_pack * QTY_recieved;
      const total_profit_all_packs = profit_per_pack * QTY_recieved;
      const total_profit_margin = (total_profit_all_packs / total_revenue_all_packs) * 100;

      res.json({
        success: true,
        profit_per_pack,
        profit_margin_per_pack,
        total_profit_all_packs,
        total_profit_margin
      });
    } else {
      res.status(404).json({ success: false, error: 'No data found for the given ID.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});





  module.exports = router;