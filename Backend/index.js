const express = require('express');
const connectmongodb = require("./Database");
const http = require("http");
const { Server } = require("socket.io");

connectmongodb();

const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cors({
  origin: true,
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // Two Frontend Component Can talk each other
    methods: ["GET", "POST"]
  }
});

// Connection Code start 

let users = {};
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("Connected_to_user",(user_name)=> {
    console.log("User : ",user_name," is connected");
  })
  socket.on("Send_text_data",(data)=> {
    console.log("Data sended :",data);
    socket.broadcast.emit("Write_text_data",data);
  })
  socket.on("Send_Draw_data",(data)=> {
    console.log("Draw data sended : ",data);
    socket.broadcast.emit("Write_Draw_data",data);
  })
  
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const login = require('./Routes/login');
const Signup = require('./Routes/signup');
const save_text = require('./Routes/save_text');
const save_draw = require('./Routes/save_draw');
const log_out = require('./Routes/logout');
const send_details = require('./Routes/send_details');

app.use('/login',login);
app.use('/Signup',Signup);
app.use('/editor',save_text); // Route : /editor/save_text
app.use('/Draw',save_draw); //Route : /Draw/save_draw
app.use('/logout',log_out);
app.use('/editor',send_details); // Route : /editor/send_details
app.use('/Draw',send_details); //Route : /Draw/send_details

server.listen(3000, function () {
    console.log("App is  listning on port 3000");
})


// Accounts : 
// Dinasha123@gmail.com : 12456
// Sukhdevvinay9693@gmail.com : 123456