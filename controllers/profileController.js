const profileView = (req, res) => {
    const user = req.user || {}; // Ensure user is always an object
    res.render("profile", {
      user,
    });
  };
  
  module.exports = {
    profileView,
  };
  