const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDb = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatRoute");
const statusRoute = require("./routes/statusRoute");
const http = require("http");
const initializeSocket = require("./services/socketService");

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOption));

//  Middleware
app.use(express.json()); // parse body data
app.use(cookieParser()); // parse token on every request
app.use(bodyParser.urlencoded({ extended: true }));

// create server
const server = http.createServer(app);

const io = initializeSocket(server);

// apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

// connect database
connectDb();

// Routes
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);
app.use("/api/status", statusRoute);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
