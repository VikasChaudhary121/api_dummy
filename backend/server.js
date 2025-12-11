import express from "express";
import Fund from "./model/funds.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/funds", async (req, res) => {
  try {
    const funds = await Fund.find({});
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch funds" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
