const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    Draw_data : {
        type :  String,
        default : null
    },
    Text_data : {
        type : String,
        default : null
    }
});

mongoose.model("User",UserSchema)
module.exports = mongoose.model('User', UserSchema);