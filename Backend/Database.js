const mongoose = require('mongoose');
const mongourl = process.env.MONGO_URI || "mongodb://localhost:27017/Editor";

const connectmongodb = async () => {
    try {
        await mongoose.connect(mongourl);
        console.log("Connected to DBMS");
    } catch (error) {
        console.error("Failed to connect to DBMS:", error);
    }
};

module.exports = connectmongodb;
