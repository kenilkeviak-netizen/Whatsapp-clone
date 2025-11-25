const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", require: true },
    content: { type: String, require: true },
    contetnType: {
      type: String,
      enum: ["image", "video", "text"],
      default: "text",
    },
    viewers: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true },
  },
  { timeseries: true }
);

const Status = mongoose.model("Status", statusSchema);
module.exports = Status;
