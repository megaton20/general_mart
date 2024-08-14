const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const cron = require('node-cron');

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const expiryChecker = async () => {
  try {
    // Fetch all inventory items
    const results = await query(`SELECT * FROM "inventory"`);
    if (results.rows.length <= 0) {
      return console.log("no inventory data");
    }
    const inventoryData = results.rows;

    // Format dates and calculate days left
    const itemsWithDaysLeft = inventoryData.map((item) => {
      const today = new Date();
      const expireDate = new Date(item.Expire_date);
      const timeDifference = expireDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDifference / (1000 * 3600 * 24));

      return { ...item, days_left: daysLeft };
    });

    // Update inventory and associated product data based on days left
    for (const item of itemsWithDaysLeft) {
      const itemId = item.id;
      const daysLeft = item.days_left;

      // Determine status based on expiration
      let inventoryStatus = daysLeft <= 0 ? 'expired' : 'not-expired';
      let productStatus = daysLeft <= 0 ? 'expired' : 'not-expired';
      let productShowcase = daysLeft <= 0 ? 'no' : 'yes';
      let productActivate = daysLeft <= 0 ? 'no' : 'yes';

      // Update inventory status
      await query(`UPDATE "inventory" SET expired = $1 WHERE id = $2`, [inventoryStatus, itemId]);

      // Check if the item is associated with a product in the product shelf
      const existingProductResult = await query(`SELECT * FROM "Products" WHERE inventory_id = $1`, [itemId]);

      if (existingProductResult.rows.length <= 0) {
        console.log(`The community is safe! Inventory with ID ${itemId} was not added to the shelf. ${daysLeft} days left.`);
        continue;
      }

      const existingProduct = existingProductResult.rows[0];

      // Ensure that if the product was already not showcased, it remains that way
      if (existingProduct.showcase === 'no') {
        productShowcase = 'no';
      }

      // Update product status
      await query(
        `UPDATE "Products" SET status = $1, showcase = $2, activate = $3 WHERE inventory_id = $4`,
        [productStatus, productShowcase, productActivate, itemId]
      );
    }
  } catch (error) {
    console.error('Error in expiryChecker:', error);
  }
};

const userRankingChecker = async () => {
  try {
    // Fetch all rank data
    const rankResults = await query(`SELECT * FROM "ranks"`);

    if (rankResults.rows.length <= 0) {
      return console.log("no ranks data");
    }
    const ranks = rankResults.rows;

    // Fetch all user data
    const userResults = await query(`SELECT * FROM "Users"`);
    const userData = userResults.rows;

    // Iterate over each user to determine and update their rank
    for (const user of userData) {
      let newRank = null;

      // Determine the new rank based on spending
      for (let i = 0; i < ranks.length; i++) {
        if (user.spending <= ranks[i].threshold) {
          newRank = ranks[i];
          break;
        }
      }

      // If no rank matched, assign the highest rank
      if (!newRank && ranks.length > 0) {
        newRank = ranks[ranks.length - 1];
      }

      // Update user rank if a new rank is determined
      if (newRank) {
        await query(
          `UPDATE "Users" SET rank = $1, rank_id = $2 WHERE id = $3`,
          [newRank.name, newRank.id, user.id]
        );
      }
    }
  } catch (err) {
    console.error('Error in userRankingChecker:', err.message);
  }
};


const clearCartAtTheEndOfTheDay = async () => {
  try {
    await query('TRUNCATE TABLE "Cart"');
    console.log('Cart has been cleared successfully.');
  } catch (err) {
    console.error('Error clearing the cart:', err);
  }
};

const shelfAvailableChecker = async () => {
  try {
    const results = await query(`SELECT id FROM "Products" WHERE total_on_shelf <= 0`);

 
    let shelfData = results.rows; // Accessing rows directly since `query` returns the data as an array of objects
    
    if (shelfData.length > 0) {
      let productIds = shelfData.map(product => product.id); // Extracting the product IDs

      if (productIds.length > 0) {
        // Generate the query for deleting items from the Cart table
        let deleteQuery = `DELETE FROM "Cart" WHERE product_id = ANY($1::int[])`;

        const deleteResult = await query(deleteQuery, [productIds]);
        
        console.log(`${deleteResult.rowCount} item(s) deleted from cart`);
      }
    }
  } catch (err) {
    console.error("Error during shelf availability check:", err);
  }
};





// Function to remove unverified users
const removeUnverifiedUsers = () => {
  const query = 'DELETE FROM "Users" WHERE status = \'unverified\' AND "userRole" = \'user\'';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error removing unverified users:', err.message);
      return;
    }
    console.log(`Removed ${result.rowCount} unverified users.`);
  });
};



// Schedule the job to run every 48 hours
cron.schedule('0 0 */2 * *', () => {
  removeUnverifiedUsers();
});



// Schedule the job to run once every 24 hours
cron.schedule('0 0 * * *', () => {
  clearCartAtTheEndOfTheDay();
});


// Schedule the job to run every minute
cron.schedule('* * * * *', () => {
    expiryChecker();
    userRankingChecker();
    shelfAvailableChecker()
});





async function createTables() {
  try {
    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS "Brands" (
        "id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Cart" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL,
        "user_email" VARCHAR(255),
        "product_id" INT NOT NULL,
        "quantity" INT NOT NULL,
        "max" INT,
        "product_name" VARCHAR(255) NOT NULL,
        "price_per_item" NUMERIC(10,2) NOT NULL,
        "subtotal" NUMERIC(10,2) NOT NULL,
        "uuid" BIGINT,
        "image" VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS "Category" (
        "CategoryID" SERIAL PRIMARY KEY,
        "Category_name" VARCHAR(255) NOT NULL,
        "details" VARCHAR(800) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Damaged" (
        "id" SERIAL PRIMARY KEY,
        "Product_name" VARCHAR(255) NOT NULL,
        "Category_Id" INT NOT NULL,
        "Unit_price" INT NOT NULL,
        "Supplier_id" INT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Deactivated" (
        "id" SERIAL PRIMARY KEY,
        "reason" VARCHAR(255) NOT NULL,
        "comment" VARCHAR(500) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Discount" (
        "id" SERIAL PRIMARY KEY,
        "Discount_name" VARCHAR(100) NOT NULL,
        "Discount_percentage" INT NOT NULL,
        "Start_date" DATE NOT NULL,
        "End_date" DATE NOT NULL,
        "Discount_provider" VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Drivers" (
        "id" SERIAL PRIMARY KEY,
        "user_id" BIGINT NOT NULL,
        "companyName" VARCHAR(255) NOT NULL,
        "companyEmail" VARCHAR(255) NOT NULL,
        "companyPhone" VARCHAR(255) NOT NULL,
        "companyAddress" VARCHAR(255) NOT NULL,
        "HQ_state" VARCHAR(255) NOT NULL,
        "HQ_lga" VARCHAR(255) NOT NULL,
        "bankAccount" VARCHAR(255) NOT NULL,
        "accountName" VARCHAR(255) NOT NULL,
        "Bank_name" VARCHAR(255) NOT NULL,
        "service" VARCHAR(255) NOT NULL,
        "goodsHandled" VARCHAR(255) NOT NULL,
        "hours" VARCHAR(255) NOT NULL,
        "days" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Fashion_Category" (
        "CategoryID" SERIAL PRIMARY KEY,
        "Category_name" VARCHAR(255) NOT NULL,
        "details" VARCHAR(800) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Inventory" (
        "id" SERIAL PRIMARY KEY,
        "Product_name" VARCHAR(255) NOT NULL,
        "Brand_name" VARCHAR(255) NOT NULL,
        "brand_id" INT,
        "Category_name" VARCHAR(255) NOT NULL,
        "category_id" INT,
        "Purchase_price" NUMERIC(10,2) NOT NULL,
        "QTY_recieved" INT NOT NULL,
        "total_in_pack" INT NOT NULL,
        "created_date" DATE NOT NULL,
        "Supplier_name" VARCHAR(255) NOT NULL,
        "supplier_id" INT,
        "Reciever_name" VARCHAR(255) NOT NULL,
        "Payment_method" VARCHAR(255) NOT NULL,
        "Delivery_method" VARCHAR(255) NOT NULL,
        "Cost_of_delivery" INT NOT NULL,
        "image" VARCHAR(255),
        "barcode" VARCHAR(255),
        "Manufacture_date" DATE NOT NULL,
        "Expire_date" DATE NOT NULL,
        "Total_damaged" INT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'unverified',
        "activate" VARCHAR(10) NOT NULL DEFAULT 'no',
        "expired" VARCHAR(255),
        "details" VARCHAR(500),
        "specifications" VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS "Logistics" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "phone" VARCHAR(255),
        "address" VARCHAR(255),
        "image" VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS "Newsletter" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Orders" (
        "id" SERIAL PRIMARY KEY,
        "vendor_id" INT,
        "customer_email" VARCHAR(255) NOT NULL,
        "customer_phone" BIGINT,
        "customer_id" INT NOT NULL,
        "transaction_id" INT NOT NULL,
        "pick_up_store_id" INT,
        "pick_up_store_name" VARCHAR(255),
        "sale_id" BIGINT NOT NULL,
        "Delivery" VARCHAR(255) NOT NULL,
        "driver_id" INT,
        "rider_id" INT,
        "rider_company_name" VARCHAR(255),
        "rider_phone" VARCHAR(255),
        "rider_email" VARCHAR(255),
        "driver" VARCHAR(255),
        "driver_phone" VARCHAR(255),
        "driver_email" VARCHAR(255),
        "customer_address" VARCHAR(255),
        "customer_state" VARCHAR(255),
        "customer_lga" VARCHAR(255),
        "status" VARCHAR(255),
        "payment_type" VARCHAR(255) NOT NULL,
        "total_amount" NUMERIC(10,2) NOT NULL,
        "shipping_fee" NUMERIC(10,2),
        "created_date" DATE NOT NULL,
        "pickup" VARCHAR(255) NOT NULL DEFAULT 'open',
        "delivery_pin" BIGINT
      );

      CREATE TABLE IF NOT EXISTS "Order_Products" (
        "id" SERIAL PRIMARY KEY,
        "product_id" INT NOT NULL,
        "store_id" INT,
        "cart_id" BIGINT,
        "sale_id" BIGINT NOT NULL,
        "price_per_item" NUMERIC(10,2) NOT NULL,
        "subTotal" NUMERIC(10,2),
        "quantity" INT,
        "name" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) DEFAULT 'sold',
        "image" VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS "Positions" (
        "id" SERIAL PRIMARY KEY,
        "Position_name" VARCHAR(255) NOT NULL,
        "Salary" INT NOT NULL,
        "Job_description" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Products" (
        "id" SERIAL PRIMARY KEY,
        "ProductName" VARCHAR(100) NOT NULL,
        "Brand_name" VARCHAR(255) NOT NULL,
        "category" VARCHAR(255) NOT NULL,
        "category_id" INT,
        "inventory_id" INT,
        "vendor_inventory_id" INT,
        "vendor_id" INT,
        "UnitPrice" NUMERIC(10,2),
        "StockQuantity" INT NOT NULL,
        "total_in_pack" INT,
        "total_on_shelf" INT,
        "created_date" DATE NOT NULL,
        "activate" VARCHAR(10) DEFAULT 'no',
        "status" VARCHAR(233) DEFAULT 'not-expired',
        "showcase" VARCHAR(20) DEFAULT 'yes',
        "image" VARCHAR(255),
        "details" VARCHAR(800),
        "specifications" VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS "Ranks" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "threshold" NUMERIC(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Return_Order" (
        "id" SERIAL PRIMARY KEY,
        "sale_id" BIGINT NOT NULL,
        "store_id" BIGINT NOT NULL,
        "store_name" VARCHAR(255) NOT NULL,
        "attendant_id" BIGINT NOT NULL,
        "attendant_name" VARCHAR(255) NOT NULL,
        "refund_method" VARCHAR(255) NOT NULL,
        "reason_for_return" VARCHAR(255) NOT NULL,
        "created_date" DATE NOT NULL,
        "Status" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Sales" (
        "id" SERIAL PRIMARY KEY,
        "store_name" VARCHAR(255),
        "store_id" INT,
        "sale_type" VARCHAR(255) NOT NULL,
        "sale_id" BIGINT NOT NULL,
        "created_date" DATE NOT NULL,
        "Discount_applied" INT NOT NULL DEFAULT 0,
        "attendant_id" VARCHAR(255) NOT NULL,
        "total_amount" NUMERIC(10,2) NOT NULL,
        "shipping_fee" NUMERIC(10,2),
        "Payment_type" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) NOT NULL DEFAULT 'unresolved'
      );

      CREATE TABLE IF NOT EXISTS "Stores" (
        "id" SERIAL PRIMARY KEY,
        "store_name" VARCHAR(100) NOT NULL,
        "store_address" VARCHAR(100) NOT NULL,
        "state" VARCHAR(100) NOT NULL,
        "lga" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Suppliers" (
        "id" SERIAL PRIMARY KEY,
        "First_name" VARCHAR(255) NOT NULL,
        "Last_name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "Phone" INT NOT NULL,
        "Address" VARCHAR(255) NOT NULL,
        "Business_name" VARCHAR(255) NOT NULL,
        "created_date" DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Transactions" (
        "id" SERIAL PRIMARY KEY,
        "transaction_id" VARCHAR(255) NOT NULL,
        "reference" VARCHAR(255) NOT NULL,
        "amount" NUMERIC(10,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "paid_at" VARCHAR(255),
        "cancel" VARCHAR(255) NOT NULL DEFAULT 'no'
      );

      CREATE TABLE IF NOT EXISTS "Users" (
        "id" SERIAL PRIMARY KEY,
        "googleId" VARCHAR(255),
        "First_name" VARCHAR(255) NOT NULL,
        "Last_name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "Phone" BIGINT,
        "Address" VARCHAR(250),
        "created_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "previous_visit" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" VARCHAR(20) NOT NULL DEFAULT 'unverified',
        "verify_email" BOOLEAN DEFAULT FALSE,
        "verify_phone" BOOLEAN NOT NULL DEFAULT TRUE,
        "spending" NUMERIC(10,2) DEFAULT 0.00,
        "cashback" NUMERIC(10,2) DEFAULT 0.00,
        "userRole" VARCHAR(244) NOT NULL DEFAULT 'user',
        "Password" VARCHAR(255),
        "state" VARCHAR(255),
        "lga" VARCHAR(255),
        "store_id" INT,
        "logistic_id" INT,
        "logistics_company_name" VARCHAR(255),
        "store_name" VARCHAR(255),
        "gender" VARCHAR(255),
        "salary" BIGINT,
        "position" VARCHAR(255),
        "position_id" INT,
        "land_mark" VARCHAR(500),
        "image" VARCHAR(255),
        "rank" VARCHAR(255) DEFAULT 'Newbie',
        "rank_id" INT DEFAULT 1,
        "token" VARCHAR(255),
        "tokenExpires" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Vendors_Inventory" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT,
        "Product_name" VARCHAR(255) NOT NULL,
        "Brand_name" VARCHAR(255) NOT NULL,
        "Category_name" VARCHAR(255) NOT NULL,
        "category_id" INT,
        "QTY_recieved" INT NOT NULL,
        "total_in_pack" INT
      );
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables', err);
  } 
}


createTables();
module.exports = expiryChecker;
