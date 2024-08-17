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
    const results = await query(`SELECT id FROM "Products" WHERE "total_on_shelf" <= 0`);

 
    let shelfData = results.rows; // Accessing rows directly since `query` returns the data as an array of objects
    
    if (shelfData.length > 0) {
      let productIds = shelfData.map(product => product.id); // Extracting the product IDs

      if (productIds.length > 0) {
        // Generate the query for deleting items from the Cart table
        let deleteQuery = `DELETE FROM "Cart" WHERE "product_id" = ANY($1::int[])`;

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




module.exports = expiryChecker;
