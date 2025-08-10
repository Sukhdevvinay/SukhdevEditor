const express = require('express');
const app = express();
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

router.post('/login', async (req, res) => {
  const {email, password } = req.body; // User Entered Details
  try {
    const user = await User.findOne({ email });
    if (!user) { // User is not found or Incorrect Password
      return res.status(401).json({ message: 'Invalid credentials' });
    } else {
      bcrypt.compare(password, user.password, function (err, result) {
            if (result == false) res.send("Password is incoorect");
            else {
                let token = jwt.sign({email: email}, "privatestring");
                res.cookie("token", token);
                return res.status(200).json({message:"Login Succesfuly"});
            };
        })
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err });
  }
});

module.exports = router;
