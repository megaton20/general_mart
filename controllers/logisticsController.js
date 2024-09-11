const db = require("../model/databaseTable");
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

const appName = `G.Mart` 

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
exports.allPendingDelivery = (req, res)=>{

    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const userId = req.user.id;

  db.query(`SELECT * FROM Users WHERE id = ? `,[userId], (err, results) => {
    if (err) {
      req.flash("error_msg", ` ${err.sqlMessage}`);
      return res.redirect("/");
    } 

      const logisticId = JSON.parse(JSON.stringify(results[0].logistic_id));

      db.query(`SELECT * FROM Orders WHERE driver_id = "${logisticId}" AND status = "shipped" `, (err, results) => {
        if (err) {
          req.flash("error_msg", ` ${err.sqlMessage}`);
          return res.redirect("/");
        } else {
          let pendingDelivery = JSON.parse(JSON.stringify(results));
    
           return res.render("./logistics/logistcsDeliveryTable", {
              pageTitle: "delivery to maked",
              name: `${userFirstName} ${userLastName}`,
              month: monthName,
              day: dayName,
              date: presentDay,
              year: presentYear,
              pendingDelivery,
            }); // for logistics alone only
            
          }
        });
    
    })



}

exports.oneDelivery = (req, res)=>{
  let editId = req.params.id
    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  

  db.query(`SELECT * FROM Orders WHERE  id = "${editId}" `, (err, results) => {
    if (err) {
      req.flash("error_msg", ` ${err.sqlMessage}`);
      return res.redirect("/logistics");
    } else {
      let orderToComplete = JSON.parse(JSON.stringify(results));

      let itemId = orderToComplete[0].sale_id
      let itemShippingFee = orderToComplete[0].shipping_fee

      const totalAmountToPayOnDelivery = itemShippingFee + orderToComplete[0].total_amount


      db.query(`SELECT * FROM Order_Products WHERE  sale_id = "${itemId}" `, (err, results) => {
        if (err) {
          console.log(err);
          req.flash("error_msg", `error from db ${err}`)
          return res.redirect("/logistics")
        }
        let orderedProducts = JSON.parse(JSON.stringify(results));


        db.query(`SELECT * FROM Users WHERE  id = "${orderToComplete[0].customer_id}" `, (err, results) => {
          if (err) {
            req.flash("error_msg", ` ${err.sqlMessage}`);
            return res.redirect("/logistics");
          } else {
            let customerData = JSON.parse(JSON.stringify(results));
            
            return res.render("./logistics/logisticsDeliveryDetails", {
              pageTitle: "delivery to make",
              name: `${userFirstName} ${userLastName}`,
              month: monthName,
              day: dayName,
              date: presentDay,
              year: presentYear,
              orderedProducts,
              orderToComplete,
              totalAmountToPayOnDelivery,
              customerData
            }); // for admin only
  
          }
        })


     
      })// to get the products ordered
    
      }
    }); // to get the pending item

}
exports.finishDelivery = (req, res)=>{
  let editId = req.params.id
  const sessionRole = req.user.userRole;



      db.query(`SELECT * FROM Order_Products WHERE  id = "${editId}" `, (err, results) => {
        if (err) {
          req.flash("error_msg", ` ${err.sqlMessage}`);
          return res.redirect("/");
        } else {
          let data = JSON.stringify(results);
          let orderToComplete = JSON.parse(data);
          
          let itemId = orderToComplete[0].sale_id
          
          
          db.query(`UPDATE Orders SET ? WHERE  sale_id = "${itemId}" `, {
            status: 'complete'
          },(err, results) => {
            
            if(err){
              console.log(err);
              req.flash('error_msg', `error whhile updating ${err}`)
              return res.redirect("/logistics")
            }
  
            db.query(`UPDATE  Order_Products SET ? WHERE  sale_id = "${itemId}" `, {
              status: 'sold'
            },(err, results) => {
              if (err) {
                req.flash("error_msg", `error from db ${err}`)
                return res.redirect("/logistics")
              }  
              req.flash("success_msg", `order has been marked as completed`)
              return res.redirect('/logistics/all-deliveries')
            })// to complete the products ordered
          }) // update  order to conplete
  
  
        
          }
        }); // to get the pending item

}
