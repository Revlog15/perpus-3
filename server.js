const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Load .env if present without extra dependencies
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (process.env[k] === undefined) process.env[k] = v;
      }
    }
  });
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");
const PORTFOLIO_URL =
  process.env.PORTFOLIO_URL || "https://revand-portofolio.vercel.app";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve only public static assets cleanly (compatible locally & with Vercel CDN)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.use("/public", express.static(publicDir));
if (BASE_PATH) {
  app.use(BASE_PATH, express.static(publicDir));
}

// Helper to send HTML with injected Back-to-Portfolio floating button
function sendHtml(filePath, res) {
  fs.readFile(filePath, "utf-8", (err, html) => {
    if (err) return res.status(500).send("Error reading file");
    const scriptInjection = `
      <script>
        window.__PORTFOLIO_URL__ = ${JSON.stringify(PORTFOLIO_URL)};
        window.__BASE_PATH__ = ${JSON.stringify(BASE_PATH)};
      </script>
      <script src="${BASE_PATH}/js/back-to-portfolio.js"></script>
    </body>`;
    const finalHtml = html.includes("</body>")
      ? html.replace("</body>", scriptInjection)
      : html + scriptInjection;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(finalHtml);
  });
}

// Router for application endpoints
const appRouter = express.Router();

// Pages
appRouter.get("/", (req, res) => {
  sendHtml(path.join(__dirname, "login_register.html"), res);
});
appRouter.get("/admin", (req, res) => {
  sendHtml(path.join(__dirname, "pages/admin/index.html"), res);
});
appRouter.get("/user", (req, res) => {
  sendHtml(path.join(__dirname, "pages/user/index.html"), res);
});

// Routers
const booksRouter = require("./src/routes/books");
const loansRouter = require("./src/routes/loans");
const returnsRouter = require("./src/routes/returns");
const usersRouter = require("./src/routes/users");
const adminRouter = require("./src/routes/admin");
const authRouter = require("./src/routes/auth");

appRouter.use("/api/books", booksRouter);
appRouter.use("/api/loans", loansRouter);
appRouter.use("/api/returns", returnsRouter);
appRouter.use("/api/users", usersRouter);
appRouter.use("/api/admin", adminRouter);
appRouter.use("/", authRouter); // /login, /register

// API health/info
appRouter.get("/api", (req, res) => {
  res.json({
    ok: true,
    message: "NesPus API",
    basePath: BASE_PATH,
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

// Mount router on root and optionally on BASE_PATH
app.use("/", appRouter);
if (BASE_PATH) {
  app.use(BASE_PATH, appRouter);
}

// Start HTTP server only when executed directly (Vercel imports `app` as a Function handler)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (BASE_PATH: "${BASE_PATH}")`);
  });
}

module.exports = app;
