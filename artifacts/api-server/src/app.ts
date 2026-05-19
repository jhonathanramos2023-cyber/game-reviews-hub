import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

// Never send weak ETags — combined with conditional requests they yield 304 + empty body in some clients.
app.set("etag", false);

const defaultOrigins = [
  "https://game-reviews-web.onrender.com",
  "https://game-reviews-hub.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function buildAllowedOrigins(): Set<string> {
  const allowed = new Set(defaultOrigins);
  for (const key of ["CORS_ORIGIN", "FRONTEND_URL"] as const) {
    const raw = process.env[key];
    if (!raw) continue;
    for (const part of raw.split(",")) {
      const origin = part.trim();
      if (origin) allowed.add(origin);
    }
  }
  return allowed;
}

const allowedOrigins = buildAllowedOrigins();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/api", router);

export default app;
