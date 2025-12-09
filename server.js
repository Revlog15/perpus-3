const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));
app.use(express.urlencoded({ extended: true }));

// Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login_register.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/admin/index.html"));
});
app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/user/index.html"));
});

// Routers
const booksRouter = require("./src/routes/books");
const loansRouter = require("./src/routes/loans");
const returnsRouter = require("./src/routes/returns");
const paymentsRouter = require("./src/routes/payments");
const usersRouter = require("./src/routes/users");
const adminRouter = require("./src/routes/admin");
const authRouter = require("./src/routes/auth");

app.use("/api/books", booksRouter);
app.use("/api/loans", loansRouter);
app.use("/api/returns", returnsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/", authRouter); // /login, /register

// API health/info
app.get("/api", (req, res) => {
  res.json({
  ok: true,
  message: "NesPus API",
    endpoints: [
      "/api/books",
      "/api/loans",
      "/api/returns",
      "/api/payments",
      "/api/users",
      "/api/admin",
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
