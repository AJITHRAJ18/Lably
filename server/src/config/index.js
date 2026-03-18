// ============================================================
// Lably — Environment Configuration
// Validates and exports all environment variables.
// App will crash on startup if required vars are missing.
// ============================================================

import "dotenv/config";

const REQUIRED_VARS = [
  "GEMINI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_PLAN_MONTHLY",
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[Config] Fatal: missing required environment variables:\n  ${missing.join("\n  ")}\n\nCopy server/.env.example to server/.env and fill in the values.`
    );
    process.exit(1);
  }
}

validateEnv();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3001,
  isDev: (process.env.NODE_ENV || "development") === "development",

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    isTest: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_"),
    plans: {
      monthly: process.env.RAZORPAY_PLAN_MONTHLY,
    },
  },

  app: {
    url: process.env.APP_URL || "http://localhost:5173",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  },

  upload: {
    maxFileSizeMb: 20,
    get maxFileSizeBytes() {
      return this.maxFileSizeMb * 1024 * 1024;
    },
  },
};

export default config;
