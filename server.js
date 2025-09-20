const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const path = require("path");

const app = express();

// DB Config
const connectDB = require("./config/db");
connectDB();
require("dotenv").config();
// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // folder containing EJS files

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Sessions
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
  })
);

// Flash
app.use(flash());

// Global Vars for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Routes
app.use("/", require("./routes/userRoutes")); // make sure userRoutes handles standalone EJS pages

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
