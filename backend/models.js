import mongoose from "mongoose";
import bcrypt from "bcrypt";

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    displayName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Report Schema
const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    thesisTitle: String,
    thesisText: String,
    reviewContent: String,
    reportType: { type: String, enum: ["review", "score", "detection"], default: "review" },
    fileUploadId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "reports" }
);

// File Upload Schema
const fileUploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: String,
    mimeType: String,
    size: Number,
    extractedText: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { collection: "file_uploads" }
);

// Review Schema (legacy, kept for compatibility)
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    thesisTitle: String,
    thesisText: String,
    reviewContent: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "reviews" }
);

export const User = mongoose.model("User", userSchema);
export const Report = mongoose.model("Report", reportSchema);
export const FileUpload = mongoose.model("FileUpload", fileUploadSchema);
export const Review = mongoose.model("Review", reviewSchema);
