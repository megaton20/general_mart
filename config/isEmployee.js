module.exports = {
  isAttendant: function(req, res, next) {
    const userPosition = req.user.position;
    const userRole = req.user.userRole; // Corrected typo

    if (userPosition === "Attendant") {
      return next();
    } else if (userPosition === "Logistics") {
      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/logistics');
    } else if (userRole === "user") {
      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/user');

    }else if (userRole === "vendor") {
      req.flash('warning_msg', 'vendor That is not your role');
      return res.redirect('/vendor');

      
    } else if (userRole === "super") {
      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/super');
    }else if (userRole === "driver") {
      req.flash('warning_msg', 'driver That is not your role');
      return res.redirect('/drivers');
    }
  }
}
