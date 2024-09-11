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

    db.query(`SELECT * FROM Category `, (err, results) => {
      if (err) {
        req.flash("error_msg", ` ${err.sqlMessage}`);
        return res.redirect("/");
      } else {
        let data = JSON.stringify(results);
        let allCategory = JSON.parse(data);

         return res.render("./employee/employeeDash", {
            pageTitle: "Employee dasdoard",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
            allCategory,
          }); // for admin only
          
      }
    });
};

//  at the counter page
exports.counterForm = (req, res) => {

    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;
  const userId = req.user.id
// return console.log(req.User

    return db.query(`SELECT * FROM Category `, (err, results) => {
      if (err) {
        req.flash("error_msg", ` ${err.sqlMessage}`);
        return res.redirect("/");
      } else {
        let data = JSON.stringify(results);
        let allCategory = JSON.parse(data);

          return res.render("./employee/employeeCounter", {
            pageTitle: "At the counter",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
            allCategory,
            userId,
          }); // for admin only
          
      }
    });
   

};


exports.employeeSale = (req, res) => {
  
  const userId  = req.user.id;
 const storeId =   req.user.store_id;
  const storeName = req.user.store_name
    
  var metaItems = JSON.parse(req.body.meta);
  var cartItems = JSON.parse(req.body.cart);
  
  // chhecking for empt cart
  if (cartItems.length <= 0) {
    // to make sure we got something in the cart

      req.flash("error_msg", "Cart cannot  be empty");
      res.redirect("/employee/create-sales");
      return;

  
  }


  var uuidForEachSale = Date.now() + Math.floor(Math.random() * 1000);

  let insertData = {
    sale_id: uuidForEachSale,
    store_id: storeId,
    store_name: storeName,
    sale_type:"counter",
    created_date: sqlDate,
    attendant_id: userId,
    Payment_type: metaItems.paymentType,
    total_amount: metaItems.sumTotal,
    shipping_fee:0,
  };

  db.query(
    "INSERT INTO Sales SET ? ",
    insertData,
    (error, result) => {
      if (error) {
        req.flash("errror_msg", `error from db ${error.sqlMessage}`);
        res.redirect("/employee/create-sales");
        return;
      }

      // Define an array to store promises
      const promises = [];

      cartItems.forEach((cartItem) => {
        const { id, name, price,  uuid, quantity,image } = cartItem;


        let newPricePerItem = price*quantity
        let productItem = {
          sale_id: uuidForEachSale,
          product_id: id,
          price_per_item: price,
          subTotal: newPricePerItem,
          store_id: storeId,
          cart_id:uuid,
          name: name,
          quantity:quantity,
          image:image,
        };

        // Push the promise into the array
        promises.push(
          new Promise((resolve, reject) => {
            // Step 3: Insert or retrieve product record from Products table
            db.query(
              "INSERT INTO Order_Products SET ?",
              productItem,
              async (error, result) => {
                if (error) {
                  req.flash('error_msg', `error occured: ${error}`)
                  return res.redirect('/employee/create-sales')
                }

                // Resolve the promise
                resolve(result);
              }
            );
          })
        );
      });

      // Wait for all promises to resolve
      Promise.all(promises)
        .then(() => {
          req.flash(
            "success_msg",
            `Cart has been submitted, Your order reference number is: ${uuidForEachSale}`
          );
          return res.redirect(`/employee/invoice/${uuidForEachSale}`)
        })
        .catch((error) => {
          req.flash('error_msg', `error occured: ${error}`)
          return res.redirect('/employee/create-sales')
        });
    }
  );
}

exports.invoice = (req, res) => {
  const saleId  = req.params.id
    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name




  db.query(`SELECT * FROM Order_Products WHERE sale_id = "${saleId}"`, (err, results) => {
    if (err) {
      req.flash("error_msg", ` ${err.sqlMessage}`);
      return res.redirect("/");
    } else {
      let data = JSON.stringify(results);
      let newOrderProducts = JSON.parse(data);

      db.query(`SELECT * FROM Sales WHERE sale_id =" ${saleId}"`, (err, results) => {
        if (err) {
          req.flash("error_msg", ` ${err.sqlMessage}`);
          return res.redirect("/");
        } else {
          let data = JSON.stringify(results);
          let newSale = JSON.parse(data);
  
          return res.render("./employee/saleInvoice", {
            pageTitle: "invoice",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
            newSale,
            newOrderProducts,
          }); // for admin only
          // not user
        }
      });
    }
  }) // products ordered

   
};

exports.saleHistory = (req, res) => {
    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name
  const userId = req.user.id


  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD
  
  const query = `
    SELECT * FROM Sales 
    WHERE attendant_id = ? 
    AND DATE(created_date) = ?
  `;
  
  db.query(query, [userId, formattedToday], (err, results) => {
    if (err) {
      req.flash("error_msg", `${err.sqlMessage}`);
      return res.redirect("/");
    } else {
      let salesResults = JSON.parse(JSON.stringify(results));
      salesResults.forEach((sales) => {
        sales.created_date = formatDate(sales.created_date); // Assuming 'date' is the date field in your sales table
      });
  
      return res.render("./employee/sales-history", {
        pageTitle: "My recent sales",
        name: `${userFirstName} ${userLastName}`,
        month: monthName,
        day: dayName,
        date: presentDay,
        year: presentYear,
        salesResults,
      });

    }
  })
};


exports.superStore =  async (req, res) => {
  const { id } = req.params;
  const { search } = req.query;

  let query = `SELECT * FROM Products WHERE activate = ? AND total_on_shelf > ? AND status = ?`;
  let queryParams = ['yes', 0, 'not-expired'];

  // Add category condition
  if (id !== 'all') {
    query += ` AND category = ?`;
    queryParams.push(id);
  }

  // Add search condition
  if (search) {
    query += ` AND ProductName LIKE ?`;
    queryParams.push(`%${search}%`);
  }

  // Order by ProductName
  query += ` ORDER BY ProductName ASC`;

  // Execute the query
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.log(err.sqlMessage);
      req.flash("error_msg", `${err.sqlMessage}`);
      return res.redirect('/user');
    } else {
      if (results.length <= 0) {
        return res.json([]);
      }

      return res.json(results);
    }
  });
}