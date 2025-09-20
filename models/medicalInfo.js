const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: String,
  frequency: String,
  // Add these new fields for the reminder system
  times: [String], // e.g., ['08:00', '14:00', '20:00']
  startDate: { type: Date, default: Date.now },
  duration: { type: Number, default: 30 }, // days
  active: { type: Boolean, default: true },
  reminderEnabled: { type: Boolean, default: true }
});

// New schema for tracking medicine history
const MedicineHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, required: true },
  medicineName: String,
  scheduledDate: Date,
  scheduledTime: String,
  actualTime: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['taken', 'skipped', 'missed'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

const MedicalInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  surgeryDetails: String,
  healthStatus: String,
  otherHealthProblems: String,
  medicine: [MedicineSchema],
  createdAt: { type: Date, default: Date.now }
});

const MedicalInfo = mongoose.model("MedicalInfo", MedicalInfoSchema);
const MedicineHistory = mongoose.model("MedicineHistory", MedicineHistorySchema);

module.exports = { MedicalInfo, MedicineHistory };