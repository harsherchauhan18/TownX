import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/index.js";
import indexRouter from "./routes/index.route.js"; // your combined router

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// simple health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// mount all feature routers under /api/v1
// indexRouter should route to /user (or /users) and /recommender
app.use("/api/v1", indexRouter);

// 404 handler (keep after route mounts)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// centralized error handler
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = Number(process.env.PORT) || 8000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
