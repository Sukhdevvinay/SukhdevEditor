const express = require('express');
const app = express();
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

router.post('/save_text', isLoggedIn, async (req, res) => {
  let user_email = req.User_data.email; // Cookie se Aye email 
  const text_data = req.body.Text_data; // Frontend se Aye Text_data
  //  console.log("Actuals rec body : ",req.body);
  //  console.log("Recieved data : ",text_data);
  // try {
  const user = await User.findOne({ email: user_email });
  if (!user) { // User is Not exist 
    return res.status(401).json({ message: 'Create Your Account' });
  } else { // User Exits
    // console.log("Recieved data Else [Part]: ",text_data)
    user.Text_data = text_data;
    // console.log("Recived Data in Backedn : ",text_data);
    await user.save();
    // console.log(user);               
    res.status(200).json({ message: "Updated" });
    // return res.status(200).json({ message: "Text data saved successfully"});
  }
  // } catch (err) {
  //   console.log("Server Error");
  //   return res.status(500).json({ message: 'Server error', error: err });
  // }
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
