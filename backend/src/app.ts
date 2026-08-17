import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    status: "ok",
  });
});

app.get("/ready", (_request, response) => {
  const isConnected = mongoose.connection.readyState === 1;

  response.status(isConnected ? 200 : 503).json({
    success: isConnected,
    database: isConnected ? "connected" : "unavailable",
  });
});

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);
