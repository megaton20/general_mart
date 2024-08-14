const { promisify } = require('util');
const db = require("../model/databaseTable");
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

const appName = `General Mart` 


exports.getAdminWelcomePage = async (req, res) => {

  const  userFirstName = req.user.First_name;
  const  userLastName = req.user.Last_name;


  try {

 const driverWithID = await query(`SELECT * FROM drivers WHERE user_id = ? `,[req.user.id])

      if (driverWithID.length <= 0) {
        req.flash("error_msg", `not recognized as a driver`)
        return res.redirect('/')
      }

 const selectedRider = JSON.parse(JSON.stringify(driverWithID[0].id));

  const activeRidesResults = await query(`SELECT * FROM Orders WHERE rider_id = "${selectedRider}" AND status = "shipped"`)
  const activeRides = activeRidesResults.length
  const waitinRidesResults  =await query(`SELECT * FROM Orders WHERE status = "waiting" AND pickup = "open" `)
  const availableDeliveries = waitinRidesResults.length
  const completeRideResults = await query(`SELECT * FROM Orders WHERE rider_id = "${selectedRider}" AND status = "complete"`)
  const completedRides = completeRideResults.length;
  const riderResults =   await query(`SELECT * FROM Orders WHERE rider_id = "${selectedRider}" AND status = "canceled"`)
  const canceledRides = riderResults.length;

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
             }); // for admin only
    
  } catch (error) {
    console.log(error);
    req.flash('error_msg', `error from server: ${error}`)
    return res.redirect('/')
  }



};

exports.newRider = (req, res) => {
    
  let userActive= false
  if (req.user) {
    userActive = true
  }

  res.render('./drivers/riderRegisterForm',{
  pageTitle:`Rregister your company to  ${appName} `,
  stateData,
  appName,
  userActive,
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
    return res.render('./drivers/riderRegisterForm', {
      pageTitle: 'Register again',
      appName: appName,
      errors,
      userActive,
      stateData, // Ensure this is defined somewhere in your controller
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
    const selectQuery = 'SELECT * FROM drivers WHERE bankAccount = ? AND accountName = ?';
    const results = await query(selectQuery, [bankAccount, accountName]);
    
    if (results.length > 0) {
      req.flash('error_msg', 'Account details are being repeated');
      return res.redirect('/drivers');
    }
    
    const insertData = {
      companyName: companyName,
      companyEmail: companyEmail,
      companyPhone: companyPhone,
      companyAddress: companyAddress,
      HQ_state: HQ_state,
      HQ_lga: HQ_lga,
      bankAccount: bankAccount,
      accountName: accountName,
      Bank_name: Bank_name,
      goodsHandled: Array.isArray(goodsHandled) ? goodsHandled.join(', ') : goodsHandled,
      hours: Array.isArray(hours) ? hours.join(', ') : hours,
      days: Array.isArray(days) ? days.join(', ') : days,
      service: Array.isArray(service) ? service.join(', ') : service,
      user_id: req.user.id
    };

    await query('INSERT INTO drivers SET ?', insertData);
    await query('UPDATE Users SET ? WHERE id = ?', [{ userRole: 'driver' }, req.user.id]);

    req.flash('success_msg', "You're now a driver with us");
    res.redirect('/drivers');
  
  } catch (error) {
    req.flash('error_msg', `Error occurred: ${error.message}`);
    return res.redirect('back');
  }
};



// delivery
exports.allPendingDelivery = async (req, res)=>{

    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {

    const results =  await query(`SELECT * FROM Orders WHERE status = "waiting" AND pickup = "open" `)

    const availableDeliveries = JSON.parse(JSON.stringify(results));

     return res.render("./drivers/driversAvailableDelivery", {
        pageTitle: "Open",
        name: `${userFirstName} ${userLastName}`,
        month: monthName,
        day: dayName,
        date: presentDay,
        year: presentYear,
        availableDeliveries,
      });
    
  } catch (error) {
    req.flash("error_msg", ` ${error}`);
    return res.redirect("/");
  }

}


exports.myRides = async (req, res)=>{

  const userFirstName = req.user.First_name;
const userLastName = req.user.Last_name;
const userId = req.user.id;

try {
  
  const results =  await query(`SELECT * FROM drivers WHERE user_id = ? `,[userId])
  const selectedRider = JSON.parse(JSON.stringify(results[0].id));
  const availableDeliveriesResults =   await query(`SELECT * FROM Orders WHERE rider_id = "${selectedRider}" AND status = "shipped"`)
  const  availableDeliveries = JSON.parse(JSON.stringify(availableDeliveriesResults));
  
         return res.render("./drivers/driversAsignedDelivery", {
            pageTitle: "delivery to maked",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
            availableDeliveries,
          }); // for logistics alone only
} catch (error) {
  req.flash("error_msg", ` ${error}`);
  return res.redirect("back");
}

          
}

exports.oneDelivery = async (req, res) => {
  let editId = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  try {
    // Fetch order details
    const results = await query(`SELECT * FROM Orders WHERE id = ?`, [editId]);
    if (results.length <= 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect("back");
    }

    const orderToComplete = results;
    const itemId = orderToComplete[0].sale_id;
    const itemShippingFee = orderToComplete[0].shipping_fee;
    const totalAmountToPayOnDelivery = itemShippingFee + orderToComplete[0].total_amount;

    // Fetch ordered products
    const orderedProductsResult = await query(`SELECT * FROM Order_Products WHERE sale_id = ?`, [itemId]);
    const orderedProducts = orderedProductsResult;

    // Fetch customer data
    const customerDataResult = await query(`SELECT * FROM Users WHERE id = ?`, [orderToComplete[0].customer_id]);
    if (customerDataResult.length <= 0) {
      req.flash("error_msg", "Customer not found");
      return res.redirect("back");
    }

    const customerData = customerDataResult;

 

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
      customerData
    });

  } catch (error) {
    req.flash("error_msg", `Error: ${error.message}`);
    return res.redirect("back");
  }
};


exports.finishDelivery = async (req, res) => {
  let orderProductID = req.params.id;
  const { pin } = req.body;

  if (!pin) {
    req.flash("error_msg", "Provide pin");
    return res.redirect("back");
  }

  try {
    const results = await query(`SELECT * FROM Order_Products WHERE id = ?`, [orderProductID]);

    if (results.length <= 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect('/driver/new-rider');
    }

    const orderedProducts = results[0];
    const itemId = orderedProducts.sale_id;

    const thatOrderResult = await query(`SELECT * FROM Orders WHERE sale_id = ?`, [itemId]);
    
    if (thatOrderResult.length <= 0) {
      req.flash("error_msg", "Order not found");
      return res.redirect('/driver/new-rider');
    }

    const thatOrder = thatOrderResult[0];
    const savedPin = thatOrder.delivery_pin;

    if (savedPin !== parseInt(pin, 10)) {
      req.flash("error_msg", "The pin you entered is incorrect or does not exist! Let the receiver provide the correct pin.");
      return res.redirect("back");
    }

    await query(`UPDATE Orders SET status = ? WHERE sale_id = ?`, ['complete', itemId]);
    await query(`UPDATE Order_Products SET status = ? WHERE sale_id = ?`, ['sold', itemId]);

    req.flash("success_msg", "Order has been marked as completed");
    return res.redirect('/drivers');

  } catch (error) {
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/');
  }
};
