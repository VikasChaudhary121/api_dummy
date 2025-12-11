import mongoose from "mongoose";

const fundSchema = new mongoose.Schema(
  {
    fund: {
      type: String,
      required: true,
      trim: true,
    },
    net_asset: {
      type: Number,
      required: true,
    },
    CAGR_6MONTH: {
      type: Number,
      required: true,
    },
    CAGR_1YEAR: {
      type: Number,
      required: true,
    },
    CAGR_3YEAR: {
      type: Number,
      required: true,
    },
    min_investment: {
      type: Number,
      required: true,
    },
    expense_ratio: {
      type: Number,
      required: true,
    },
    originalIndex: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

const Fund = mongoose.models.Fund || mongoose.model("Fund", fundSchema);
export default Fund;
