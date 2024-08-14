module.exports = {
  isDriver: function(req, res, next) {
    const userPosition = req.user.position;
    const userRole = req.user.userRole;

    if (userPosition === "Logistics") {
      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/logistics');

    } else if (userPosition === "Attendant") {

      req.flash('warning_msg', 'That is not your role');
      return res.redirect('/employee');
      
    } else if (userRole === "user") {
      req.flash('warning_msg', 'That is not your role');
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
  alreadyDriver:(req,res,next)=>{
    const userRole = req.user.userRole;
    if (userRole === "driver") {
      req.flash('warning_msg', 'already registered as a rider');
      return res.redirect('/drivers');
    }
   return next() 

  }
}
