const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);

const fetchUserQuery = 'SELECT * FROM "Users" WHERE id = $1'; // PostgreSQL parameterized query

module.exports = {
  ensureBasicInformation: async (req, res, next) => {
    const userId = req.user.id;
    try {
      const { rows } = await query(fetchUserQuery, [userId]);
      const userData = rows[0];
      
      if (!(userData.Address && userData.state && userData.lga && userData.land_mark)) {
        req.flash("error_msg", "Complete your form registration");
        return res.redirect(`/user/edit-user/${userId}`);
      }
      return next();
    } catch (error) {
      req.flash('error_msg', `Error: ${error.message}`);
      return res.redirect('/');
    }
  },

  ensureAuthenticatedEmail: async (req, res, next) => {
    const userId = req.user.id;
    try {
      const { rows } = await query(fetchUserQuery, [userId]);
      const userData = rows[0];

      if (userData.verify_email == 0) {
        req.flash("error_msg", "Please verify your email to complete request!");
        return res.redirect('/user/profile');
      }
      return next();
    } catch (error) {
      req.flash('error_msg', `Error: ${error.message}`);
      return res.redirect('/');
    }
  },

  ensureAuthenticatedPhone: async (req, res, next) => {
    const userId = req.user.id;
    try {
      const { rows } = await query(fetchUserQuery, [userId]);
      const userData = rows[0];

      if (userData.verify_phone == 0) {
        req.flash("error_msg", "Please verify your phone number to complete request!");
        return res.redirect('back');
      }
      return next();
    } catch (error) {
      req.flash('error_msg', `Error: ${error.message}`);
      return res.redirect('/');
    }
  }
};

