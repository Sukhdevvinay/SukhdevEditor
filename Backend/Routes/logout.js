const express = require('express');
const router = express.Router();


router.get('/logout', async (req, res) => {
    res.clearCookie("token", {
        path: "/",     // Match path of how token was set
    });
    return res.status(200).json({ message: "Logout Succesfully" });
});

module.exports = router;