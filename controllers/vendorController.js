const db = require("../model/databaseTable");
const stateData = require("../model/stateAndLGA");
const fs = require('fs'); // Use fs.promises for file operations
const path = require('path');



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
const appName = `G.Mart` 

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

exports.getAdminWelcomePage = (req, res) => {


  let nameA = req.user.First_name;
  let nameB = req.user.Last_name;

  db.query(`SELECT * FROM Orders WHERE status = "canceled" `,(err, results) => {
      if (err) {
        req.flash("error_msg", `${err.sqlMessage}`);
        return res.redirect("/super");
      }
      let totalCanceledOrder = JSON.parse(JSON.stringify(results));

      db.query(`SELECT shipping_fee FROM Sales WHERE status = "resolved" `,(err, results) => {
          if (err) {
            req.flash("error_msg", `${err.sqlMessage}`);
            return res.redirect("/super");
          }

          let shippingFee = JSON.parse(JSON.stringify(results));
    
          const shippingProfitMade = shippingFee.reduce(
            (acc, sale) => acc + sale.shipping_fee,
            0
          );
          let formatedProfitForShipping = shippingProfitMade.toLocaleString("en-US");

    
          db.query(`SELECT subTotal FROM Order_Products WHERE status = "returned" `,(err, results) => {
              if (err) {
                console.log(err);
                req.flash("error_msg", `${err.sqlMessage}`);
                return res.redirect("/super");
              }
              let returnedAmount = JSON.parse(JSON.stringify(results));
      
              const returnedSum = returnedAmount.reduce(
                (acc, item) => acc + item.price_per_item,
                0
              );
      
              // to get total sales made
              db.query(`SELECT total_amount FROM Sales WHERE status = "resolved" `,(err, results) => {
                  if (err) {
                    req.flash("error_msg", `${err.sqlMessage}`);
                    return res.redirect("/super");
                  }
                  let allSalesAmount = JSON.parse(JSON.stringify(results));
      
                  const salesMade = allSalesAmount.reduce(
                    (acc, item) => acc + item.total_amount,
                    0
                  );
      
                  let totalAmount = salesMade - returnedSum;
      
                  let formatedProfit = totalAmount.toLocaleString("en-US");

                  db.query(`SELECT * FROM Sales WHERE sale_type = 'counter'  `,(err, results) => {
                      if (err) {
                        req.flash("error_msg", `${err.sqlMessage}`);
                        return res.redirect("/super");
                      }

                      let counterSaleData = JSON.parse(JSON.stringify(results));
                      db.query(`SELECT * FROM Orders WHERE status = 'shipped'  `,(err, results) => {
                          if (err) {
                            req.flash("error_msg", `${err.sqlMessage}`);
                            return res.redirect("/super");
                          }
    
                          let shippedData = JSON.parse(JSON.stringify(results));
    
    
    db.query(`SELECT * FROM Orders WHERE status = 'complete'  `,(err, results) => {
                              if (err) {
                                req.flash("error_msg", `${err.sqlMessage}`);
                                return res.redirect("/super");
                              }
        
                              let orderData = JSON.parse(JSON.stringify(results));
              
                              let completedOrders = orderData.length;
              db.query(`SELECT * FROM Orders WHERE status = 'incomplete' OR status = "waiting"`,(err, results) => {
                                  if (err) {
                                    req.flash("error_msg", `${err.sqlMessage}`);
                                    return res.redirect("/super");
                                  }
        
                                  let pendingOrderData = JSON.parse(JSON.stringify(results));
              
                                  let pendingOrders = pendingOrderData.length;
              
                                  db.query(`SELECT * FROM Order_Products WHERE status = 'returned' `,(err, results) => {
                                      if (err) {
                                        req.flash("error_msg", `${err.sqlMessage}`);
                                        return res.redirect("/super");
                                      }
                                      let allReturnsOrders = JSON.parse(JSON.stringify(results));
              
                                      db.query(`SELECT * FROM Sales WHERE status = 'resolved' `,(err, results) => {
                                          if (err) {
                                            req.flash("error_msg", `${err.sqlMessage}`);
                                            return res.redirect("/super");
                                          } else {
        
                                            let allSales = JSON.parse(JSON.stringify(results));
                                            let totalNumberOfSales = allSales.length;
              
                                            allSales.forEach((sales) => {
                                              sales.created_date = formatDate(
                                                sales.created_date
                                              ); // Assuming 'date' is the date field in your supplier table
                                            });  
                                               // total reg customers
                                               db.query(`SELECT * FROM Users WHERE userRole = ?`, ["user"],(err, results) => {
                                                  if (err) {
                                                    req.flash("error_msg",` ${err.sqlMessage}`);
                                                    return res.redirect("/");
                                                  } else {
                                                    let totalVerifiedUsers =results.length;

                                                    res.render("./super/superHome",{
                                                        pageTitle:
                                                          "Welcome",
                                                        name: `${nameA} ${nameB}`,
                                                        month:monthName,
                                                        day: dayName,
                                                        date: presentDay,
                                                        year: presentYear,
                                                        userActive:true,
                                                        // recorrds to display
                                                        totalVerifiedUsers,
                                                        allSales,
                                                        totalNumberOfSales,
                                                        allReturnsOrders,
                                                        formatedProfit,
                                                        formatedProfitForShipping,
                                                        counterSaleData,
                                                        shippedData,
                                                        pendingOrders,
                                                        completedOrders,
                                                        totalCanceledOrder,
                                                      }
                                                    );
                                                  }
                                                }
                                              );      
                                          }
                                        }
                                      ); // all sales
                                    }
                                  ); // returned products
                                }
                              ); // pending orders query
                            }
                          ); // total completed orders
                        
                        }) // shipped data
                    }) // total number for counter sales
                
      
                 
                }
              );
            }
          ); // to get total amount  of returned items
        }
      ); // shippingProfitMade

    }) // total number of canceled order



};


// All unresolved  sales table
exports.getAllSales = (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;


      db.query(`SELECT * FROM Sales WHERE status  = 'unresolved' `,(err, results) => {
          if (err) {
            req.flash("error_msg", ` ${err.sqlMessage}`);
            return res.redirect("/super");
          } else {

            let allSales = JSON.parse(JSON.stringify(results));

            allSales.forEach((date) => {
              date.created_date = formatDate(date.created_date); // Assuming 'date' is the date field in your supplier table
            });

            res.render("./super/salesTable", {
              pageTitle: "Welcome",
              name: `${userFirstName} ${userLastName}`,
              month: monthName,
              day: dayName,
              date: presentDay,
              year: presentYear,
              allSales,
            });
          }
        }
      );

};


// all Products
exports.getAllShelfItems = (req, res) => {

  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  db.query(`SELECT * FROM Products ORDER BY id DESC `, (err, results) => {
    if (err) {
      req.flash("error_msg", ` ${err.sqlMessage}`);
      return res.redirect("/");
    } else {
      let allProducts = JSON.parse(JSON.stringify(results));
      res.render("./super/productsTable", {
        pageTitle: "All products",
        name: `${userFirstName} ${userLastName}`,
        month: monthName,
        day: dayName,
        date: presentDay,
        year: presentYear,
        allProducts,

      });
    }
  });
};

// all Inventory
exports.getAllInventory = (req, res) => {
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

     // to get invent table
     db.query(`SELECT * FROM inventory ORDER BY id DESC`, (err, results) => {
      if (err) {
        req.flash("error_msg", ` ${err.sqlMessage}`);
        return res.redirect("/super");
      } else {

        let inventoryData = JSON.parse(JSON.stringify(results));

        // to reformat the date
        inventoryData.forEach((inventory) => {
          inventory.created_date = formatDate(
            inventory.created_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Manufacture_date = formatDate(
            inventory.Manufacture_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Expire_date = formatDate(
            inventory.Expire_date
          ); // Assuming 'date' is the date field in your supplier table
        });

        // getting inventory data
        const itemsWithDaysLeft = results.map((item) => {
          const today = new Date();
          let correctedExpireDate = formatDate(
            item.Expire_date
          );
          let correctedManufactureDate = formatDate(
            item.Manufacture_date
          );
          const expiryDate = new Date(correctedExpireDate);

          // Calculate the difference in milliseconds between expiry date and today's date
          const timeDifference =
            expiryDate.getTime() - today.getTime();

          // Convert the difference from milliseconds to days
          const daysLeft = Math.ceil(
            timeDifference / (1000 * 3600 * 24)
          );

          return {
            id: item.id,
            manufacture_date: correctedManufactureDate,
            expiry_date: correctedExpireDate,
            days_left: daysLeft,
          };
        });

        // Map through the original data and add watch data to each item
        const allInventory = inventoryData.map((item) => {
          const correspondingWatchData = itemsWithDaysLeft.find(
            (watchItem) => watchItem.id === item.id
          );
          return {
            ...item,
            watchData: correspondingWatchData,
          };
        });

        return res.render("./super/inventoryTable", {
          pageTitle: "All Inventory",
          name: `${userFirstName} ${userLastName}`,
          month: monthName,
          day: dayName,
          date: presentDay,
          year: presentYear,
          allInventory,
        });
      }
    });
};
exports.createInventoryPage = (req, res) => {

  let nameA = req.user.First_name;
  let nameB = req.user.Last_name;

  db.query(`SELECT * FROM Suppliers `,(err, results) => {
      if (err) {
        req.flash("error_msg", `${err.sqlMessage}`);
        return res.redirect("/super");
      }
      // check if item exist
      let supplierData = JSON.parse(JSON.stringify(results));
      // render form

            db.query(`SELECT * FROM Stores `,(err, results) => {
                if (err) {
                  req.flash("error_msg",`${err.sqlMessage}`);
                  return res.redirect("/super");
                } else {
                  let allStores = JSON.parse(JSON.stringify(results));
                  // to get list of all employees
                  db.query(`SELECT * FROM Users WHERE userRole ="super" ORDER BY id DESC`,(err, results) => {
                      if (err) {
                        req.flash("error_msg",`${err.sqlMessage}`);
                        return res.redirect("/super");
                      }
                      let superAdmin = JSON.parse(JSON.stringify(results));
                      // get list of all categories
                      db.query(`SELECT * FROM Category `, (err, results) => {
                          if (err) {
                            req.flash("error_msg",`${err.sqlMessage}`);
                            res.redirect("/super");
                            return;
                          }
                          let categoryData =  JSON.parse(JSON.stringify(results));
                          res.render("./super/inventoryCreateForm",{
                            pageTitle:"Welcome",
                            name: `${nameA} ${nameB}`,
                            month:monthName,
                            day: dayName,
                            date: presentDay,
                            year: presentYear,
                            stateData,
                            categoryData,
                            supplierData,
                            superAdmin,
                            allStores,
                  });
              });
          })
        }
    })
  })
};
// single item
exports.getInventoryById = (req, res) => {
  let singleId = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  db.query(`SELECT * FROM inventory WHERE id = "${singleId}" `,(err, results) => {
      if (err) {
        req.flash("error_msg", ` ${err.sqlMessage}`);
        return res.redirect("/super");
      } else {

        if (results.length <= 0) {
          req.flash('warning_msg', 'item does not exist on our inventory')
          return res.redirect('/super')
        }

        let allInventory = JSON.parse(JSON.stringify(results));

        // to reformat the date
        allInventory.forEach((inventory) => {
          inventory.created_date = formatDate(
            inventory.created_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Manufacture_date = formatDate(
            inventory.Manufacture_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Expire_date = formatDate(
            inventory.Expire_date
          ); // Assuming 'date' is the date field in your supplier table
        });

        return res.render("./super/inventorySingle", {
          pageTitle: `${allInventory[0].Product_name} | ${allInventory[0].Brand_name}`,
          name: `${userFirstName} ${userLastName}`,
          month: monthName,
          day: dayName,
          date: presentDay,
          year: presentYear,
          allInventory,
        });
      }
    }
  );
};

// add price page
exports.getAddpricePage = (req, res) => {

  let singleId = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  db.query(`SELECT * FROM inventory WHERE id = "${singleId}" `,(err, results) => {
      if (err) {
        req.flash("error_msg", ` ${err.sqlMessage}`);
        return res.redirect("/super");
      } else {

        let allInventory = JSON.parse(JSON.stringify(results));

        // to reformat the date
        allInventory.forEach((inventory) => {
          inventory.created_date = formatDate(
            inventory.created_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Manufacture_date = formatDate(
            inventory.Manufacture_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Expire_date = formatDate(
            inventory.Expire_date
          ); // Assuming 'date' is the date field in your supplier table
        });

        return res.render("./super/addPricePage", {
          pageTitle: `${allInventory[0].Product_name} | ${allInventory[0].Brand_name}`,
          name: `${userFirstName} ${userLastName}`,
          month: monthName,
          day: dayName,
          date: presentDay,
          year: presentYear,
          allInventory,
        });
      }
    }
  );
};

exports.getAddpriceUpdatePage = (req, res) => {

  let singleId = req.params.id;

  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  db.query(`SELECT * FROM inventory WHERE id = "${singleId}" `,(err, results) => {
      if (err) {
        req.flash("error_msg", ` ${err.sqlMessage}`);
        return res.redirect("/super");
      } else {

        let allInventory = JSON.parse(JSON.stringify(results));

        // to reformat the date
        allInventory.forEach((inventory) => {
          inventory.created_date = formatDate(
            inventory.created_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Manufacture_date = formatDate(
            inventory.Manufacture_date
          ); // Assuming 'date' is the date field in your supplier table
          inventory.Expire_date = formatDate(
            inventory.Expire_date
          ); // Assuming 'date' is the date field in your supplier table
        });

        return res.render("./super/addPriceUpdatePage", {
          pageTitle: `${allInventory[0].Product_name} | ${allInventory[0].Brand_name}`,
          name: `${userFirstName} ${userLastName}`,
          month: monthName,
          day: dayName,
          date: presentDay,
          year: presentYear,
          allInventory,
        });
      }
    }
  );
};

// invoice of an order
exports.invoice = (req, res) => {
  const saleId  = req.params.id
    const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  db.query(`SELECT * FROM Order_Products WHERE sale_id = "${saleId}"`, (err, results) => {
    if (err) {
      req.flash("error_msg", ` ${err.sqlMessage}`);
      return res.redirect("/");
    } else {

      let newOrderProducts = JSON.parse(JSON.stringify(results));

      db.query(`SELECT * FROM Sales WHERE sale_id =" ${saleId}"`, (err, results) => {
        if (err) {
          req.flash("error_msg", ` ${err.sqlMessage}`);
          return res.redirect("/");
        } else {

          let newSale = JSON.parse(JSON.stringify(results));
          const cartItems = newSale
// Calculate the total subtotal
  
          return res.render("./super/saleInvoice", {
            pageTitle: "invoice",
            name: `${userFirstName} ${userLastName}`,
            month: monthName,
            day: dayName,
            date: presentDay,
            year: presentYear,
            newSale,
            newOrderProducts,
            totalSubtotal: newSale[0].total_amount
          }); // for admin only
          // not user
        }
      });
    }
  }) // products ordered

   
};
exports.createNewInventory = (req, res) => {
  // req body

  let supplierId 
  let filename;

  // Setting the image name from the uploaded file
  if (req.file) {
    filename = req.file.filename;
  } else {
    filename = "default.jpg";
  }



  const {Category_name,Brand_name,Product_name,Purchase_price,Supplier_name,Payment_method,Reciever_name,Delivery_method,
    QTY_recieved,total_in_pack,Manufacture_date,Expire_date,Cost_of_delivery,Total_damaged,} = req.body;

  // Ensure all fields are filled
  if (
    !(
      Category_name &&
      Brand_name &&
      Product_name &&
      Purchase_price &&
      Supplier_name &&
      Payment_method &&
      Reciever_name &&
      Delivery_method &&
      QTY_recieved &&
      total_in_pack &&
      Manufacture_date &&
      Expire_date &&
      Cost_of_delivery &&
      Total_damaged
    )
  ) {
    req.flash("error_msg", `Enter all fields before submitting`);
    return res.redirect("/super");
  }


  
  // Get the ID of the Supplier

  db.query(`SELECT * FROM Suppliers WHERE Business_name = ?`, [Supplier_name], (err, results) => {
    if (err) {
      req.flash('error_msg', `Error getting category: ${err.sqlMessage}`);
      return res.redirect('/super');
    }

    if (results.length != 0) {
      supplierData = JSON.parse(JSON.stringify(results));
      supplierId = supplierData[0].id;
    }else {
      supplierId = 0

    }



    db.query(`SELECT * FROM Category WHERE Category_name = ?`, [Category_name], (err, results) => {
      if (err) {
        req.flash('error_msg', `Error getting category: ${err.sqlMessage}`);
        return res.redirect('/super');
      }
  
      if (results.length === 0) {
        req.flash('error_msg', `Category not found`);
        return res.redirect('/super');
      }
  
      let categoryData = JSON.parse(JSON.stringify(results));
      let categoryId = categoryData[0].CategoryID;
  
      db.query(
        "INSERT INTO inventory SET ?",
        {
          Category_name: Category_name,
          Brand_name: Brand_name,
          Product_name: Product_name,
          Purchase_price: Purchase_price,
          category_id: categoryId,
          supplier_id:supplierId,
          Supplier_name: Supplier_name,
          Payment_method: Payment_method,
          Reciever_name: Reciever_name,

          Delivery_method: Delivery_method,
          QTY_recieved: QTY_recieved,
          total_in_pack: total_in_pack,
          Manufacture_date: Manufacture_date,
          Expire_date: Expire_date,
          Cost_of_delivery: Cost_of_delivery,
          Total_damaged: Total_damaged,
          created_date: sqlDate,
          activate: "no",
          image:filename,
        },
        (err, results) => {
          if (err) {
            req.flash("error_msg", `Error from server Database: ${err.sqlMessage}`);
            return res.redirect("/super");
          } else {
            req.flash("success_msg", `"${Product_name}" added successfully!`);
            return res.redirect("/super");
          }
        }
      );
    });
  })
 


  // Get the ID of the category

};
exports.editInventory = (req, res) => {
  let editID = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;



  db.query(`SELECT * FROM Suppliers `, (err, results) => {
    if (err) {
      req.flash("error_msg", `${err.sqlMessage}`);
      return res.redirect("/super/all-inventory");
    }


    let supplierData = JSON.parse(JSON.stringify(results));

    db.query(`SELECT * FROM Users WHERE userRole = "super" `,(err, results) => {
        if (err) {
          req.flash("error_msg", `${err.sqlMessage}`);
          return res.redirect("/super/all-inventory");
        }


        let allUsers = JSON.parse(JSON.stringify(results));
        // cats
        db.query(`SELECT * FROM Category `, (err, results) => {
          if (err) {
            req.flash("error_msg", `${err.sqlMessage}`);
            return res.redirect("/super/all-inventory");
          }


          let categoryData = JSON.parse(JSON.stringify(results));

          db.query(`SELECT * FROM inventory WHERE id = "${editID}"`,(err, results) => {
              if (err) {
                req.flash("error_msg", `${err.sqlMessage}`);
                return res.redirect("/super/all-inventory");
              }


              let inventoryData = JSON.parse(JSON.stringify(results));

              res.render("./super/inventoryEditForm", {
                pageTitle: "edit inventory",
                name: `${userFirstName} ${userLastName}`,
                month: monthName,
                day: dayName,
                date: presentDay,
                year: presentYear,
                inventoryData,
                categoryData,
                allUsers,
                supplierData,
                stateData,
              });
            }
          ); // inventory
        }); // category
      }
    ); // employee
  }); // supplier
};
exports.editNewInventory = (req, res) => {

  let editID = req.params.id;
  // req body
  const {Category_name,Brand_name,Product_name,Purchase_price,Supplier_name,Payment_method,Reciever_name,
    Delivery_method,QTY_recieved,total_in_pack,Manufacture_date,Expire_date,Cost_of_delivery,Total_damaged,} = req.body;
  // ensure all fields
  if (
    !(
      Category_name &&
      Brand_name &&
      Product_name &&
      Purchase_price &&
      Supplier_name &&
      Payment_method &&
      Reciever_name &&
      Delivery_method &&
      QTY_recieved &&
      total_in_pack &&
      Manufacture_date &&
      Expire_date &&
      Cost_of_delivery &&
      Total_damaged
    )
  ) {
    req.flash("error_msg",`Enter all field before submiting, check if you entered date again`);
    return res.redirect(`/super/edit-inventory/${editID}`);
  }

let updateData =       {
  Category_name: Category_name,
  Brand_name: Brand_name,
  Product_name: Product_name,
  Purchase_price: Purchase_price,
  Supplier_name: Supplier_name,
  Payment_method: Payment_method,
  Reciever_name: Reciever_name,
  Delivery_method: Delivery_method,
  QTY_recieved: QTY_recieved,
  total_in_pack: total_in_pack,
  Manufacture_date: Manufacture_date,
  Expire_date: Expire_date,
  Cost_of_delivery: Cost_of_delivery,
  Total_damaged: Total_damaged,
}

  db.query("SELECT * FROM Products WHERE inventory_id = ?",[editID],
    (error, results) => {
      if (error) {
        req.flash("error_msg", `Error from server Database `);
        return res.redirect(`/`);
      }

      // item not in shelf yet
      if (results.length <= 0) {
        // create the inventory
      return  db.query( `UPDATE inventory SET ? WHERE id = "${editID}" `,
          [updateData],
          (err, results) => {
            if (err) {
              req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
              return res.redirect(`/super/edit-inventory/${editID}`);
            } else {
              req.flash("success_msg", `"${Product_name}" Updated successfully!`);
              return res.redirect("/super/all-inventory");
            }
          }
        );
      }



      db.query(`UPDATE Products SET ? WHERE inventory_id = "${editID}" `,
        {
          category: Category_name,
          Brand_name: Brand_name,
          inventory_id:editID,
          ProductName: Product_name,
          StockQuantity: QTY_recieved,
          total_in_pack: total_in_pack,
        },
        (err, results) => {
          if (err) {
            req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
            return res.redirect(`/super/edit-inventory/${editID}`);
          }


          db.query(`UPDATE inventory SET ? WHERE id = "${editID}" `,[updateData],(err, results) => {
              if (err) {
                req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
                return res.redirect(`/super/edit-inventory/${editID}`);
              } else {
                req.flash("success_msg", `"${Product_name}" Updated successfully!`);
                return res.redirect("/super/all-inventory");
              }
            }
          );

        }
      );
  
    // create the inventory
  
    })



};

exports.deleteInventory = (req, res) => {
  let editID = req.params.id;
  
  // Example: Using environment variables for image directory
  const imageDirectory = process.env.IMAGE_DIRECTORY || path.join(__dirname, '../public/uploads/');
  
  db.query(`SELECT * FROM inventory WHERE id = ?`, [editID], (err, results) => {
    if (err) {
      req.flash("error_msg", `could not delete: ${err.sqlMessage}`);
      return res.redirect("/");
    }
  
    const inventoryData = JSON.parse(JSON.stringify(results[0]));
  
    const unlinkPath = path.join(imageDirectory, inventoryData.image);
  
    try {
      fs.unlinkSync(unlinkPath);
    } catch (error) {
      req.flash("error_msg", `could not delete: ${error}`);
        return res.redirect("/");
    }
  
    db.query(`DELETE FROM inventory WHERE id = ?`, [editID], (err, results) => {
      if (err) {
        req.flash("error_msg", `could not delete: ${err.sqlMessage}`);
        return res.redirect("/");
      }
  
      db.query(`SELECT * FROM Products WHERE inventory_id = ?`, [editID], (error, results) => {
        if (error) {
          req.flash("error_msg", `could not delete: ${error.sqlMessage}`);
          return res.redirect("/");
        }
  
        if (results.length <= 0) {
          req.flash("success_msg", `${editID} has been removed only from inventory`);
          return res.redirect("/super/all-inventory");
        }
  
        db.query(`DELETE FROM Products WHERE inventory_id = ?`, [editID], (err, results) => {
          if (err) {
            req.flash("error_msg", `could not delete: ${err.sqlMessage}`);
            return res.redirect("/");
          }
          req.flash("success_msg", `${editID} has been removed from inventory and store`);
          return res.redirect("/super/all-inventory");
        });
      });
    });
  });
};
// price form to add to shelf
exports.addToShelfForSale = (req, res) => {

  const updateID = req.params.id;
  const { price , profit_per_pack, total_profit_all_packs, total_profit_margin} = req.body;

  // if user is admin
  if (!price) {
    req.flash("error_msg", `Enter Price before submiting to add to shelf`);
    return res.redirect("/super");
  }
  // retreive the data from inventroy table
  db.query(`SELECT * FROM inventory WHERE id = "${updateID}" `,(err, results) => {
      if (err) {
        req.flash("error_msg", `${err.sqlMessage}`);
        res.redirect("/super");
      } else {

        let inventoryDataFromDb = JSON.parse(JSON.stringify(results));

        // check if its in pro db
        db.query(`SELECT * FROM Products WHERE inventory_id = "${updateID}" `,(err, results) => {
            if (err) {
              req.flash("error_msg", `${err.sqlMessage}`);
              res.redirect("/super");
            }

            if (results.length <= 0) {
              // no record found with such id in products

              let totalInStock =
                inventoryDataFromDb[0].QTY_recieved *
                inventoryDataFromDb[0].total_in_pack;
              let totalOnShelf =
                totalInStock - inventoryDataFromDb[0].Total_damaged;

              // object to be inserted
              let prodcutDataToAdd = {
                Brand_name: inventoryDataFromDb[0].Brand_name,
                ProductName: inventoryDataFromDb[0].Product_name,
                category: inventoryDataFromDb[0].Category_name,
                inventory_id: inventoryDataFromDb[0].id,
                UnitPrice: null,
                StockQuantity: inventoryDataFromDb[0].QTY_recieved,
                total_in_pack: inventoryDataFromDb[0].total_in_pack,
                total_on_shelf: totalOnShelf,
                created_date: sqlDate,
                activate: inventoryDataFromDb[0].activate,
                image: inventoryDataFromDb[0].image,
                category_id: inventoryDataFromDb[0].category_id,
                profit_per_pack:profit_per_pack,
                total_profit_all_packs:total_profit_all_packs,
                total_profit_margin:total_profit_margin,


              };

              // adding to products table
              db.query("INSERT INTO Products SET ?",prodcutDataToAdd,(err, results) => {
                  if (err) {
                    req.flash("error_msg", `${err.sqlMessage}`);
                    return res.redirect("/");
                  }

                  // item does has no price
                  db.query(`UPDATE Products SET ? WHERE inventory_id = "${updateID}"`,{ UnitPrice: price, activate: "yes" },(err, results) => {
                      if (err) {
                        req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
                        return res.redirect("/");
                      }
                      // further proceed to inventory
                      db.query(`UPDATE inventory SET ? WHERE id = "${updateID}"`,{ activate: "yes" },(err, results) => {
                          if (err) {
                            console.log(err);
                            req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
                            return res.redirect("/super");
                          }

                          req.flash("success_msg",`price added, now available to be sold in shelf`);
                          return res.redirect("/super");
                        }
                      );
                    }
                  );
                }
              );
            } else {
              // record found, no need to add just render price form

              // updated inventory table
              db.query(`UPDATE inventory SET ? WHERE id =  "${updateID}"`,{activate: "yes",},(err, results) => {
                  if (err) {
                    req.flash("error_msg", `error for db: ${err.sqlMessage}`);
                    return res.redirect("/super");
                  }

                  // update  shelf table
                  db.query(`UPDATE Products SET ? WHERE inventory_id =  "${updateID}"`,{activate: "yes",},(err, results) => {
                      if (err) {
                        req.flash("error_msg",`error for db: ${err.sqlMessage}`);
                        return res.redirect("/super");
                      }
                      req.flash("success_msg",`new price added as ${price} and status is actived`);
                      res.redirect("/super");
                    }
                  );
                }
              );
            }
          }
        );
      }
    }
  );
};

exports.updatePrice = (req, res) => {
  let editID = req.params.id;

  const { price , profit_per_pack, total_profit_all_packs, total_profit_margin} = req.body;

  if (!(price)) {
    req.flash("error_msg", `Enter new price`);
    return res.redirect(`/super/all-products/`);
  }

  // update
  let updateData = {
    UnitPrice: price,
    profit_per_pack:profit_per_pack,
    total_profit_all_packs:total_profit_all_packs,
    total_profit_margin:total_profit_margin,
  };

  db.query(`UPDATE Products SET ? WHERE inventory_id ="${editID}"`,updateData,(err, results) => {
      if (err) {
        req.flash("error_msg", `"${err.sqlMessage}" `);
        return res.redirect("/super/all-products");
      }
      req.flash("success_msg", ` updated successfully!`);
      return res.redirect("/super/all-products");
    }
  );
};


// activate on inventory
exports.remove = (req, res) => {

  let pageId = req.params.id;

  db.query(`SELECT * FROM inventory WHERE id = "${pageId}"`,(err, results) => {
      if (err) {
        req.flash("error_msg", `sorry ${err.sqlMessage}`);
        return res.redirect("/");
      }

      db.query(`UPDATE inventory SET ? WHERE id = "${pageId}"`,{ status: "verified" },(err, results) => {
          if (err) {
            req.flash("error_msg",`an error occurred from database, ${err.sqlMessage}`);
          }
          req.flash("success_msg", `Status is verified`);
          res.redirect("/super/all-inventory");
          return;
        }
      );
    }
  );
};

exports.flagProduct = (req, res) => {
  let editID = req.params.id;
  let deactivate = {
    activate: "no",
  };
  db.query(`UPDATE inventory SET ? WHERE id = "${editID}" `,deactivate,(err, results) => {
      if (err) {
        req.flash(
          "error_msg",
          `Error from server Database: ${err.sqlMessage}`
        );
        return res.redirect(`/super/edit-inventory/${editID}`);
      }

      db.query(`UPDATE Products SET ? WHERE inventory_id = "${editID}" `,deactivate,(err, results) => {
          if (err) {
            req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
            return res.redirect(`/`);
          } else {
            req.flash("warning_msg", ` Deactivated successfully!`);
            return res.redirect("/super/all-products");
          }
        }
      );
    }
  );
};

exports.unflagProduct = (req, res) => {
  let editID = req.params.id;
  // create the inventory
  let deactivate = {
    activate: "yes",
  };
  db.query(`UPDATE inventory SET ? WHERE id = "${editID}" `,deactivate,(err, results) => {
      if (err) {
        req.flash(
          "error_msg",
          `Error from server Database: ${err.sqlMessage}`
        );
        return res.redirect(`/super/edit-inventory/${editID}`);
      }

      db.query(`UPDATE Products SET ? WHERE inventory_id = "${editID}" `,deactivate, (err, results) => {
          if (err) {
            req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
            return res.redirect(`/`);
          } else {
            req.flash("success_msg", ` Activated successfully!`);
            return res.redirect("/super/all-products");
          }
        }
      );
    }
  );
};

// orders
// view order
exports.getSingleOrder = (req, res) => {
  let editID = req.params.id;
  const userFirstName = req.user.First_name;
  const userLastName = req.user.Last_name;

  db.query(`SELECT * FROM Orders WHERE  id = '${editID}' `,(err, results) => {
      if (err) {
        req.flash("error_msg", `could not delete:`);
        return res.redirect("/employee");
      }
      if (results.length <= 0) {
        req.flash("error_msg", `no item  found with  id`);
        return res.redirect("/super");
      }

      let orderData = JSON.parse(JSON.stringify(results));


      orderData.forEach((order) => {
        order.created_date = formatDate(
          order.created_date
        ); // Assuming 'date' is the date field in your customers table
      });

      const saleID = orderData[0].sale_id;

      db.query(`SELECT * FROM Order_Products  WHERE sale_id = "${saleID}"`,(err, results) => {
          if (err) {
            req.flash("error_msg", `error from db: ${err.sqlMessage}`);
            return res.redirect("/super");
          }

          let productBought = JSON.parse(JSON.stringify(results));

          // to get list of all employees
          db.query(`SELECT * FROM Logistics`,(err, results) => {
              if (err) {
                req.flash("error_msg", `${err.sqlMessage}`);
                return res.redirect("/super");
              }

              // check if item exist
              if (results.length <= 0) {
                req.flash("error_msg",`Cannot SHIP when LOGISTICS WOKERS is empty`);
                res.redirect(`/super`);
                return;
              }

              let logisticsDrivers = JSON.parse(JSON.stringify(results));



              return res.render("./super/orderSingle", {
                pageTitle: "Edit Roles",
                name: `${userFirstName} ${userLastName}`,
                month: monthName,
                day: dayName,
                date: presentDay,
                year: presentYear,
                logisticsDrivers,
                orderData,
                productBought,
              });
            }
          ); //position
        }
      );
    }
  );
};

exports.updateImage = (req, res) => {
  const uploadId = req.params.id;

  let filename;

  // Setting the image name from the uploaded file
  if (req.file) {
    filename = req.file.filename;
  } else {
    filename = "default.jpg";
  }

    const postData = {
      image: filename,
    };

    // update inventory

    db.query(`SELECT * FROM Products WHERE inventory_id = "${uploadId}"`, (err, results)=>{
      if (err) {
        req.flash('error_msg', `error from db : ${err.sqlMessage}`)
        return res.redirect('/super')
      }

      // check store presence 
        if (results.length > 0) {
        return  db.query(`UPDATE Products SET ? WHERE inventory_id = ?`,[postData, uploadId],(err, results) => {
              if (err) {
                if (req.file) {
                  fs.unlinkSync(req.file.path);
                }
                req.flash("error_msg", `An error occurred from the database, try again!`);
                return res.redirect("/");
              }
              db.query(`UPDATE inventory SET ? WHERE id = ?`,[postData, uploadId],(err, results) => {
                  if (err) {
                    if (req.file) {
                      fs.unlinkSync(req.file.path);
                    }
                    req.flash("error_msg", `An error occurred from the database, try again!`);
                    return res.redirect("/");
                  }
          
                  req.flash("success_msg", `Image uploaded successfully!`);
                  return res.redirect(`/super/inventory/${uploadId}`); // Replace with the correct path
                }
              );
          

            }
          );
        }

        db.query(`UPDATE inventory SET ? WHERE id = ?`,[postData, uploadId],(err, results) => {
            if (err) {
              if (req.file) {
                fs.unlinkSync(req.file.path);
              }
              req.flash("error_msg", `An error occurred from the database, try again!`);
              return res.redirect("/");
            }
    
            req.flash("success_msg", `Image uploaded successfully!`);
            return res.redirect(`/super/inventory/${uploadId}`); // Replace with the correct path
          }
        );
    

    })

};


// showcase functions
exports.addToShowcse = (req, res) => {
  let editID = req.params.id;



  db.query(`SELECT * FROM Products WHERE id =?`, [editID], (err, results)=>{
    if (err) {
      req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
      return res.redirect(`/super`);
    }

    if (results[0].total_on_shelf <=0 && results[0].status == "expired" ) {
      req.flash("warning_msg", ` Products is not enoughh or is expired!`);
      return res.redirect("/super/all-products");
    }

    if (results[0].showcase == "yes") {
      req.flash("warning_msg", ` Products is on showcase already!`);
      return res.redirect("back");
    }

    if (results[0].activate == "yes") {
      let data = {
        showcase: "yes",
      };
      return  db.query(`UPDATE Products SET ? WHERE id = "${editID}" `,data,(err, results) => {
          if (err) {
            req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
            return res.redirect(`/super`);
          } else {
            req.flash("success_msg", ` added to showcase successfully!`);
            return res.redirect("/super/all-products");
          }
        }
      );
    }else {
      req.flash("warning_msg", ` Activate before adding to showcase!`);
      return res.redirect("/super/all-products");
    }
  })
   

};
exports.removeFromShowcse = (req, res) => {
  let editID = req.params.id;



  db.query(`SELECT * FROM Products WHERE id =?`, [editID], (err, results)=>{
    if (err) {
      req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
      return res.redirect(`/super`);
    }
    if (results[0].showcase == "no") { 
      req.flash("warning_msg", ` Products is not on showcase! `);
      return res.redirect("back");
    }else {
      let data = {
        showcase: "no",
      };
      db.query(`UPDATE Products SET ? WHERE id = "${editID}" `,data,(err, results) => {
        if (err) {
          req.flash("error_msg",`Error from server Database: ${err.sqlMessage}`);
          return res.redirect(`/`);
        } else {
          req.flash("success_msg", ` removed from showcase successfully!`);
          return res.redirect("/super/all-products");
        }
      });
    }
  })


};