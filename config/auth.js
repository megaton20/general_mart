

module.exports = {
  ensureAuthenticated: function(req, res, next) {

    let openSession =  req.user
    if (openSession) {
      return next();
    }
    req.flash("error_msg", "Please sign in to Continue")
    res.redirect('/login')
    return
  },

  forwardAuthenticated: function(req, res, next) {
    
    let openSession =  req.user

    if (!openSession) {
      return next()
    }

    req.flash("warning_msg", `Already loged in!`)
    return res.redirect('/handler')
     
    }
};


