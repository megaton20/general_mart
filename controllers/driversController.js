const { promisify } = require('util');
const db = require("../model/databaseTable");
const query = promisify(db.query).bind(db);
const fs = require('fs');
const stateData = require("../model/stateAndLGA");
const bankData = require("../model/bank");



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

const appName = "True Essentials Mart"




exports.getAdminWelcomePage = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;


  try {
    // Fetch the driver with the given user ID
    const {rows:driverWithIDResult} = await query(`SELECT * FROM "drivers" WHERE "user_id" = $1`, [req.user.id]);

    if (driverWithIDResult.length <= 0) {
      req.flash("error_msg", "Not recognized as a driver");
      return res.redirect('/');
    }

    const selectedRider = driverWithIDResult[0].id;

    // Fetch active rides
    const {rows:activeRidesResults} = await query(`SELECT * FROM "Orders" WHERE "rider_id" = $1 AND "status" = 'shipped'`, [selectedRider]);
    const activeRides = activeRidesResults.length;

    // Fetch available deliveries
    const {rows:waitingRidesResults} = await query(`SELECT * FROM "Orders" WHERE "status" = 'waiting' AND "pickup" = 'open'`);
    const availableDeliveries = waitingRidesResults.length;

    // Fetch completed rides
    const {rows:completeRideResults} = await query(`SELECT * FROM "Orders" WHERE "rider_id" = $1 AND "status" = 'complete'`, [selectedRider]);
    const completedRides = completeRideResults.length;

    // Fetch canceled rides
    const {rows:riderResults} = await query(`SELECT * FROM "Orders" WHERE "rider_id" = $1 AND "status" = 'canceled'`, [selectedRider]);
    const canceledRides = riderResults.length;

    // Render the driver's dashboard
    return res.render("./drivers/driversDash", {
      pageTitle: "driver",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      availableDeliveries,
      activeRides,
      completedRides,
      canceledRides
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', `Server error: ${error.message}`);
    return res.redirect('/');
  }
};

exports.newRider = async (req, res) => {
    
  let userActive= false
  if (req.user) {
    userActive = true
  }

  const { rows: [result] } = await query('SELECT COUNT(*) AS totalunread FROM "notifications" WHERE "user_id" = $1 AND "is_read" = $2',[req.user.id, false]);
    
  let totalUnreadNotification = parseInt(result.totalunread, 10);
  const { rows: allCategory } = await query('SELECT * FROM "Category"');
  res.render('./drivers/riderRegisterForm',{
  pageTitle:`Rregister your company to  ${appName} `,
  stateData,
  bank:bankData,
  appName,
  userActive,
  totalUnreadNotification,allCategory
  })
}

exports.createNewDrivers = async (req, res) => {
  let userActive = false;
  if (req.user) {
    userActive = true;
  }

  let errors = [];
  let { companyName, companyEmail, companyPhone, companyAddress, HQ_state, HQ_lga, bankAccount, accountName, Bank_name, goodsHandled, hours, days, service } = req.body;

  // Ensure all necessary fields are filled
  if (!(companyName && companyEmail && companyPhone && companyAddress && HQ_state && HQ_lga && bankAccount && accountName && Bank_name && goodsHandled && hours && days && service)) {
    errors.push({ msg: 'Enter all details' });
  }
  if (errors.length > 0) {
    const { rows: allCategory } = await query('SELECT * FROM "Category"');
    return res.render('./drivers/riderRegisterForm', {
      pageTitle: 'Register again',
      appName: appName,
      errors,
      userActive,
      stateData, 
      bank:bankData,
      allCategory,
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      HQ_state,
      HQ_lga,
      bankAccount,
      accountName,
      Bank_name,
      goodsHandled: Array.isArray(goodsHandled) ? goodsHandled : [goodsHandled],
      hours: Array.isArray(hours) ? hours : [hours],
      days: Array.isArray(days) ? days : [days],
      service: Array.isArray(service) ? service : [service]
    });
  }

  try {
    const selectQuery = `SELECT * FROM "drivers" WHERE "bankAccount" = $1 AND "accountName" = $2`;
    const results = await query(selectQuery, [bankAccount, accountName]);
    
    if (results.rows.length > 0) {
      req.flash('error_msg', 'Account details are being repeated');
      return res.redirect('/drivers');
    }
    
    const insertQuery = `
    INSERT INTO "drivers" 
    ("companyName", "companyEmail", "companyPhone", "companyAddress", "HQ_state", "HQ_lga", "bankAccount", "accountName", "Bank_name", "goodsHandled", "hours", "days", "service", "user_id") 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `;
  
  const insertValues = [
    companyName,
    companyEmail,
    companyPhone,
    companyAddress,
    HQ_state,
    HQ_lga,
    bankAccount,
    accountName,
    Bank_name,
    Array.isArray(goodsHandled) ? goodsHandled.join(', ') : goodsHandled,
    Array.isArray(hours) ? hours.join(', ') : hours,
    Array.isArray(days) ? days.join(', ') : days,
    Array.isArray(service) ? service.join(', ') : service,
    req.user.id
  ];
  
  
  await query(insertQuery, insertValues);

    const updateQuery = `UPDATE "Users" SET "userRole" = $1 WHERE "id" = $2`;
    await query(updateQuery, ['driver', req.user.id]);

    req.flash('success_msg', "You're now a driver with us");
    res.redirect('/drivers');
  
  } catch (error) {
    req.flash('error_msg', `Error occurred: ${error.message}`);
    return res.redirect('back');
  }
};


exports.kycSubmit = async (req, res) => {
  let userActive = false;
  if (req.user) {
    userActive = true;
  }

  try {
    const { businessNumber, ninNumber, passportNumber, voterNumber, idType } = req.body;
    const userId = req.user.id;

    // Ensure required fields are present based on idType
    if (!businessNumber || 
        (idType === 'nin' && !ninNumber) || 
        (idType === 'passport' && !passportNumber) || 
        (idType === 'voter' && !voterNumber)) {

      // If validation fails, unlink any uploaded files
      const files = req.files || {};
      const uploadedFiles = [
        files['cacDocument'] ? files['cacDocument'][0].path : null,
        files['ninDocument'] ? files['ninDocument'][0].path : null,
        files['passportDocument'] ? files['passportDocument'][0].path : null,
        files['voterDocument'] ? files['voterDocument'][0].path : null,
      ];

      for (const file of uploadedFiles) {
        if (file) {
          fs.unlink(file, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error(`Failed to delete file: ${file}`, err);
            } else if (!err) {
              console.log(`Successfully deleted file: ${file}`);
            }
          });
        }
      }

      req.flash('error_msg', 'Form incomplete. Please provide all necessary details.');
      return res.redirect('/drivers');  // Redirect back to form page with error
    }

    // Default update fields (CAC is always required and not conditional)
    let updateFields = {
      business_number: businessNumber,  // CAC business number
      status: 'pending'  // Always set status to pending
    };

    // Add identification type data based on what was provided
    if (idType === 'nin' && ninNumber) {
      updateFields.nin_number = ninNumber;
    }
    if (idType === 'passport' && passportNumber) {
      updateFields.passport_number = passportNumber;
    }
    if (idType === 'voter' && voterNumber) {
      updateFields.voter_number = voterNumber;
    }

    // Check if `req.files` exists and contains the uploaded files
    if (req.files) {
      if (req.files['cacDocument']) {
        updateFields.cac_document = req.files['cacDocument'][0].filename;
      }
      if (req.files['ninDocument']) {
        updateFields.nin_document = req.files['ninDocument'][0].filename;
      }
      if (req.files['passportDocument']) {
        updateFields.passport_document = req.files['passportDocument'][0].filename;
      }
      if (req.files['voterDocument']) {
        updateFields.voter_document = req.files['voterDocument'][0].filename;
      }
    }

    // Construct SQL query to update driver info where user_id matches
    const query = `
      UPDATE "drivers"
      SET "CAC_number" = $1, "nation_id_number" = $2, "passport_number" = $3, 
          "voter_number" = $4, "CAC_image" = $5, "NIN_image" = $6,
          "passport_image" = $7, "voter_image" = $8, "status" = $9
      WHERE "user_id" = $10
    `;

    const values = [
      updateFields.business_number || null,
      updateFields.nin_number || null,
      updateFields.passport_number || null,
      updateFields.voter_number || null,
      updateFields.cac_document || null,
      updateFields.nin_document || null,
      updateFields.passport_document || null,
      updateFields.voter_document || null,
      updateFields.status,
      userId
    ];

    // Execute the query with PostgreSQL
    await db.query(query, values);

    req.flash('success_msg', 'Submitted, under review');
    return res.redirect('/drivers');

  } catch (error) {
    console.error('Error updating driver info:', error);

    // Unlink uploaded files on error
    const files = req.files || {};
    const uploadedFiles = [
      files['cacDocument'] ? files['cacDocument'][0].path : null,
      files['ninDocument'] ? files['ninDocument'][0].path : null,
      files['passportDocument'] ? files['passportDocument'][0].path : null,
      files['voterDocument'] ? files['voterDocument'][0].path : null,
    ];

    for (const file of uploadedFiles) {
      if (file) {
        fs.unlink(file, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Failed to delete file: ${file}`, err);
          } else if (!err) {
            console.log(`Successfully deleted file: ${file}`);
          }
        });
      }
    }

    req.flash('error_msg', 'Server error, please try again later.');
    return res.redirect('/');
  }
};





exports.kyc = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  let userActive = false;
  if (req.user) {
    userActive = true;
  }

  try {
    // Fetch the driver with the given user ID
    const {rows:driverWithIDResult} = await query(`SELECT * FROM "drivers" WHERE "user_id" = $1`, [req.user.id]);

    if (driverWithIDResult.length <= 0) {
      req.flash("error_msg", "Not recognized as a driver");
      return res.redirect('/');
    }

    const { rows: allCategory } = await query('SELECT * FROM "Category"');
    // Render the driver's dashboard
    return res.render("./drivers/kyc", {
      pageTitle: "driver kyc",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      driverWithIDResult,
      allCategory,
      userActive
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', `Server error: ${error.message}`);
    return res.redirect('/');
  }
};


// delivery
exports.allPendingDelivery = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {
    // Fetch available deliveries where the status is 'waiting' and pickup is 'open'
    const { rows: availableDeliveries } = await query(
      `SELECT * FROM "Orders" WHERE "status" = 'waiting' AND "pickup" = 'open'`
    );

    // Render the available deliveries page
    return res.render("./drivers/driversAvailableDelivery", {
      pageTitle: "Open Deliveries",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      availableDeliveries,
    });
    
  } catch (error) {
    req.flash("error_msg", `${error.message}`);
    return res.redirect("/");
  }
};



exports.myRides = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const userId = req.user.id;

  try {
    // Fetch the driver's information based on user ID
    const { rows: results } = await query(`SELECT * FROM "drivers" WHERE "user_id" = $1`, [userId]);

    if (results.length === 0) {
      req.flash("error_msg", "Driver not found.");
      return res.redirect("back");
    }

    if (results.user_id === req.user.id) {
      req.flash("error_msg", "Can not access your own order here.");
      return res.redirect("back");
    }

    const selectedRider = results[0].id;

    // Fetch available deliveries for the selected rider where the status is 'shipped'
    const { rows: availableDeliveriesResults } = await query(`SELECT * FROM "Orders" WHERE "rider_id" = $1 AND "status" = 'shipped'`,[selectedRider]);

    // Render the assigned delivery page
    return res.render("./drivers/driversAsignedDelivery", {
      pageTitle: "Assigned Deliveries",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      availableDeliveries: availableDeliveriesResults, // Directly use the query result
    });
  } catch (error) {
    req.flash("error_msg", `${error.message}`);
    return res.redirect("back");
  }
};


exports.oneDelivery = async (req, res) => {
  const editId = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {
    // Fetch order details
    const { rows: orderResults } = await query(`SELECT * FROM "Orders" WHERE "id" = $1`, [editId]);
    if (orderResults.length <= 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect("back");
    }

    const orderToComplete = orderResults[0];
    const itemId = orderToComplete.sale_id;
    const itemShippingFee = orderToComplete.shipping_fee;
    const totalAmountToPayOnDelivery = itemShippingFee + orderToComplete.total_amount;

    // Fetch ordered products
    const { rows: orderedProductsResults } = await query(`SELECT * FROM "Order_Products" WHERE "sale_id" = $1`, [itemId]);
    const orderedProducts = orderedProductsResults;

    // Fetch customer data
    const { rows: customerDataResults } = await query(`SELECT * FROM "Users" WHERE "id" = $1`, [orderToComplete.customer_id]);
    if (customerDataResults.length <= 0) {
      req.flash("error_msg", "Customer not found");
      return res.redirect("back");
    }
    
    const customerData = customerDataResults[0];
    const { rows: gpsData } = await query(`SELECT * FROM "user_locations" WHERE "user_id" = $1`, [orderToComplete.customer_id]);

    if (gpsData.length === 0) {
      req.flash("error_msg", "Customer location not found");
    return res.render("./drivers/driversDeliveryDetails", {
      pageTitle: "Delivery to Make",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      orderedProducts,
      orderToComplete,
      totalAmountToPayOnDelivery,
      customerData,
      userLocation:[]
    });
    }
  
    const userLocation = gpsData[0];

    // Render the delivery details page
    return res.render("./drivers/driversDeliveryDetails", {
      pageTitle: "Delivery to Make",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      orderedProducts,
      orderToComplete,
      totalAmountToPayOnDelivery,
      customerData,
      userLocation
    });

  } catch (error) {
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("back");
  }



};


exports.finishDelivery = async (req, res) => {
  const orderProductID = req.params.id;
  const { pin } = req.body;

  if (!pin) {
    req.flash("error_msg", "Provide pin");
    return res.redirect("back");
  }

  try {
    // Fetch the ordered product
    const { rows: results } = await query(`SELECT * FROM "Order_Products" WHERE "id" = $1`, [orderProductID]);

    if (results.length <= 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect('/driver/new-rider');
    }

    const orderedProduct = results[0];
    const itemId = orderedProduct.sale_id;

    // Fetch the corresponding order
    const { rows: orderResult } = await query(`SELECT * FROM "Orders" WHERE "sale_id" = $1`, [itemId]);

    if (orderResult.length <= 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect('/driver/new-rider');
    }

    const order = orderResult[0];
    const savedPin = +order.delivery_pin;


    // Verify the pin
    if (savedPin !== parseInt(pin, 10)) {
      req.flash("error_msg", "The pin you entered is incorrect or does not exist! Let the receiver provide the correct pin.");
      return res.redirect("back");
    }

    // Update the order status to complete
    await query(`UPDATE "Orders" SET "status" = $1 WHERE "sale_id" = $2`, ['complete', itemId]);

    // Update the order products status to sold
    await query(`UPDATE "Order_Products" SET "status" = $1 WHERE "sale_id" = $2`, ['sold', itemId]);

    req.flash("success_msg", "Order has been marked as completed");
    return res.redirect('/drivers');

  } catch (error) {
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/');
  }
};
