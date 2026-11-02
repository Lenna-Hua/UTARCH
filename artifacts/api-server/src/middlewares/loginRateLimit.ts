import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

/** Brute-force protection for admin login */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 25 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Try again later." },
});
