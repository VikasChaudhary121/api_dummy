import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import Fund from "./model/funds.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "./Mutual_Funds.csv");
const MONGO_URI = process.env.MONGO_URI;
const BATCH_SIZE = 500;

if (!MONGO_URI) {
  console.error("MONGO_URI not set in environment. Exiting.");
  process.exit(1);
}

function cleanNumber(val) {
  if (val === undefined || val === null) return undefined;
  const cleaned = String(val)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/Rs\.?/gi, "")
    .trim();

  if (cleaned === "" || cleaned === "-" || cleaned.toLowerCase() === "na")
    return undefined;
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
}

function toNumberOrUndefined(val) {
  return cleanNumber(val);
}

async function insertBatch(batch) {
  if (!batch.length) return 0;
  try {
    const res = await Fund.insertMany(batch, { ordered: false });
    return res.length;
  } catch (err) {
    console.error("insertMany error:", err.message || err);
    return 0;
  }
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");

  const stream = fs.createReadStream(FILE).pipe(csv());
  let batch = [];
  let totalInserted = 0;

  stream.on("error", (err) => {
    console.error("CSV stream error:", err);
  });

  stream.on("data", async (row) => {
    const doc = {
      originalIndex: row["Unnamed: 0"] ? Number(row["Unnamed: 0"]) : undefined,
      fund: (row["Scheme"] || row["Fund"] || "").trim(),
      net_asset: toNumberOrUndefined(
        row["Net_Asset_Value(Rs.)"] ||
          row["Net Asset Value(Rs.)"] ||
          row["Net Asset"] ||
          row["Net_Asset_Value"]
      ),
      CAGR_6MONTH: toNumberOrUndefined(
        row["CAGR% 6 Months"] || row["CAGR 6 Months"] || ["CAGR% 6 Months"]
      ),
      CAGR_1YEAR: toNumberOrUndefined(
        row["CAGR% 1 Year"] || row["CAGR 1 Year"] || ["CAGR% 1 Year"]
      ),
      CAGR_3YEAR: toNumberOrUndefined(
        row["CAGR% 3 Year"] || row["CAGR 3 Year"] || ["CAGR% 3 Year"]
      ),
      min_investment: toNumberOrUndefined(
        row["Min. Invest(Rs.)"] || row["Min Invest(Rs.)"] || row["Min. Invest"]
      ),
      expense_ratio: toNumberOrUndefined(
        row["Exp. Ratio(%)"] || row["Expense Ratio(%)"] || ["Exp. Ratio(%)"]
      ),
    };

    if (!doc.fund) return;

    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      stream.pause();
      const inserted = await insertBatch(batch);
      totalInserted += inserted;
      console.log(`Inserted so far: ${totalInserted}`);
      batch = [];
      stream.resume();
    }
  });

  stream.on("end", async () => {
    if (batch.length > 0) {
      const inserted = await insertBatch(batch);
      totalInserted += inserted;
    }
    console.log("Import completed. Total inserted:", totalInserted);
    await mongoose.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
