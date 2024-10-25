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

const appName = "True Essentials Mart"

exports.getAdminWelcomePage = (req, res) => {

  let userFirstName = req.user.First_name;
  let userLastName = req.user.Last_name;

         return res.render("./logistics/logisticsDash", {
            pageTitle: "logistics driver",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
          }); // for admin only

};

exports.createNewLogistics = (req, res) => {

  console.log(req.body);

  // add to db
  // update user role to Logistics
  req.flash('warning_msg', "under constructions")
  res.redirect('/logistics')
  return
  let userFirstName = req.user.First_name;
  let userLastName = req.user.Last_name;

         return res.render("./logistics/logisticsDash", {
            pageTitle: "logistics driver",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
          }); // for admin only

};
// delivery
exports.allPendingDelivery = async (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const userId = req.user.id;

  try {
    // Use parameterized query to prevent SQL injection
    const { rows: user } = await query(
      `SELECT * FROM "Users" WHERE "id" = $1 `,
      [userId]
    );

    const { rows: results } = await query(
      `SELECT * FROM "Orders" WHERE "driver_id" = $1 AND "status" = $2`,
      [user[0].logistic_id, "shipped"]
    );

    // Check if there are any pending deliveries
    let pendingDelivery = results; // Pass the entire result array


    // Render the logistics delivery table
    return res.render("./logistics/logistcsDeliveryTable", {
      pageTitle: "Delivery to be made",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      pendingDelivery, // Pass the entire array of pending deliveries
    });

  } catch (error) {
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("back");
  }
};

exports.oneDelivery = async (req, res) => {
  let editId = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {
    // Query for the specific order
    const { rows: orderToComplete } = await query(
      `SELECT * FROM "Orders" WHERE id = $1`,
      [editId]
    );

    if (orderToComplete.length === 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect("back");
    }

    let itemId = orderToComplete[0].sale_id;
    let itemShippingFee = orderToComplete[0].shipping_fee;

    // Calculate the total amount to pay on delivery
    const totalAmountToPayOnDelivery =
      itemShippingFee + orderToComplete[0].total_amount;

    // Query for ordered products
    const { rows: orderedProducts } = await query(
      `SELECT * FROM "Order_Products" WHERE sale_id = $1`,
      [itemId]
    );

    // Query for customer data
    const { rows: customerData } = await query(
      `SELECT * FROM "Users" WHERE id = $1`,
      [orderToComplete[0].customer_id]
    );

    if (customerData.length === 0) {
      req.flash("error_msg", "Customer not found");
      return res.redirect("back");
    }


    // Render the delivery details page
    return res.render("./logistics/logisticsDeliveryDetails", {
      pageTitle: "Delivery to Make",
      name: `${userFirstName} ${userLastName}`,
      month: monthName,
      day: dayName,
      date: presentDay,
      year: presentYear,
      orderedProducts,
      orderToComplete: orderToComplete[0],
      totalAmountToPayOnDelivery,
      customerData: customerData[0], // Ensure you send only one customer's data
    });
  } catch (error) {
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("back");
  }
};


exports.finishDelivery = async (req, res) => {
  let editId = req.params.id;
  const { pin } = req.body;

  if (!pin) {
    req.flash("error_msg", "Provide pin");
    return res.redirect("back");
  }

  try {
    // Fetch the Order_Products based on the id
    const { rows: orderToComplete } = await query(
      `SELECT * FROM "Order_Products" WHERE id = $1`,
      [editId]
    );

    if (orderToComplete.length === 0) {
      req.flash("error_msg", "Ordered product not found");
      return res.redirect("/logistics");
    }

    const itemId = orderToComplete[0].sale_id;

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

    
    // Update the Orders table to mark as complete
    await query(
      `UPDATE "Orders" SET status = $1 WHERE sale_id = $2`,
      ["complete", itemId]
    );

    // Update the Order_Products table to mark as sold
    await query(
      `UPDATE "Order_Products" SET status = $1 WHERE sale_id = $2`,
      ["sold", itemId]
    );

    // If successful, send success message
    req.flash("success_msg", "Order has been marked as completed");
    return res.redirect("/logistics/all-deliveries");

  } catch (error) {
    console.log(error);
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("/logistics");
  }
};
