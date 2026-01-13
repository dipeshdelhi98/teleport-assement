const express = require("express");
const crypto = require("crypto"); // Added for hashing
const { optimizeSchema } = require("./validation");
const optimizer = require("./optimizer");
const cache = require("./cache");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "1mb" })); // Limit payload size

// Health Check
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route
app.post("/api/v1/load-optimizer/optimize", async (req, res) => {
  // 1. Validation
  const { error, value } = optimizeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: "Invalid Request",
      details: error.details.map((d) => d.message),
    });
  }

  const { truck, orders } = value;

  // 2. Generate a clean Cache Key using Hash
  // We create a unique ID for the specific list of orders instead of putting the whole list in the key name.
  const ordersString = JSON.stringify(orders);
  const ordersHash = crypto
    .createHash("md5")
    .update(ordersString)
    .digest("hex");
  const cacheKey = `optimize:${truck.id}:${ordersHash}`;

  try {
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      console.log("Cache Hit");
      return res.status(200).json(cachedResult);
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }

  // 3. Optimization
  const startTime = process.hrtime();
  const rawResult = optimizer.optimize(truck, orders);
  const finalResult = optimizer.formatResult(rawResult, truck);

  const [seconds, nanoseconds] = process.hrtime(startTime);
  const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
  console.log(`Optimization took ${durationMs}ms`);

  // 4. Save to Cache (Async, don't wait)
  cache.set(cacheKey, finalResult, 600); // Cache for 10 mins

  // 5. Response
  res.status(200).json(finalResult);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
