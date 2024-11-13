const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);

module.exports = {
  isDriver:async function(req, res, next) {
    const userPosition = req.user.position;
    const userRole = req.user.userRole;

    if (userPosition === "Logistics") {
      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/logistics');

    } else if (userPosition === "Attendant") {

      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/employee');
      
    } else if (userRole === "user") {
      const fetchDriverQuery = 'SELECT * FROM "drivers" WHERE "user_id" = $1'; 
      const { rows:results } = await query(fetchDriverQuery, [req.user.id]);

      if (results.length >0) {
        return next()
      }

      req.flash('warning_msg', 'you can not access here');
      return res.redirect('/user');

    }else if (userRole === "vendor") {
      req.flash('warning_msg', 'vendor That is not your role');
      return res.redirect('/vendor')
      
    } else if (userRole === "super") {
      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/super');
    } else if (userRole === "driver") {
      return next()
    }
  },

  alreadyDriver: async(req,res,next)=>{
    const userId = req.user.id;

    const fetchDriverQuery = 'SELECT * FROM "drivers" WHERE "user_id" = $1'; 
    const { rows:driverData } = await query(fetchDriverQuery, [userId]);


    if (driverData.length > 0) {

      req.flash('warning_msg', 'already registered as a rider');
      return res.redirect('/drivers');
    }
   return next() 

  }
}
