const express = require('express');
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/send_details', isLoggedIn, async (req, res) => {
  let user_email = req.User_data.email; // Cookie se Aye email 
  try {
    const user = await User.findOne({ email: user_email });
    if (!user) return res.status(400).json({ message: "Login Required" });
    res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token || token === "") {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  try {
    const data = jwt.verify(token, "privatestring");
    req.User_data = data;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

module.exports = router;
