const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { MedicalInfo, MedicineHistory } = require("../models/medicalInfo");
// Remove the old: const MedicalInfo = require("../models/MedicalInfo");

// ------------------ Middleware ------------------

// Protect routes
function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  req.flash("error_msg", "Please log in to view this page");
  res.redirect("/login");
}

// ------------------ Routes ------------------

// Landing Page
router.get("/", (req, res) => res.render("pages/index", { title: "Home" }));

// ------------------ Register ------------------

// Register Page
router.get("/register", (req, res) => res.render("pages/register", { title: "Register" }));

// Register POST
router.post("/register", async (req, res) => {
  const { name, email, password, age, gender } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      req.flash("error_msg", "Email already registered");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with basic info only
    user = new User({
      name,
      email,
      password: hashedPassword,
      age,
      gender
    });

    await user.save();
    req.flash("success_msg", "You are now registered! Please login");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Try again.");
    res.redirect("/register");
  }
});

// ------------------ Login ------------------

// Login Page
router.get("/login", (req, res) => res.render("pages/login", { title: "Login" }));

// Login POST
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

    // Save user in session
    req.session.user = { _id: user._id, name: user.name, email: user.email };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Try again.");
    res.redirect("/login");
  }
});

// ------------------ Dashboard ------------------

// Dashboard
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const medicalInfo = await MedicalInfo.findOne({ userId: user._id });

    res.render("pages/dashboard", {
      title: "Dashboard",
      user,
      medicalInfo
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Cannot load dashboard");
    res.redirect("/");
  }
});

// ------------------ Add Medical Info ------------------

// Render Add Medical Info Form
router.get("/dashboard/add", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const medicalInfo = await MedicalInfo.findOne({ userId: user._id });

    res.render("pages/addMedicalInfo", {
      title: "Add Medical Info",
      user,
      medicalInfo
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Cannot load form");
    res.redirect("/dashboard");
  }
});

// Handle Medical Info POST
router.post("/dashboard/add", ensureAuthenticated, async (req, res) => {
  const { surgeryDetails, healthStatus, otherHealthProblems, medicines } = req.body;

  try {
    const user = await User.findById(req.session.user._id);
    let medicalInfo = await MedicalInfo.findOne({ userId: user._id });

    // Normalize medicines array
    let meds = [];
    if (medicines) {
      meds = Array.isArray(medicines)
        ? medicines.filter(m => m.name && m.name.trim() !== "")
        : medicines.name ? [medicines] : [];
    }

    if (!medicalInfo) {
      medicalInfo = new MedicalInfo({
        userId: user._id,
        surgeryDetails,
        healthStatus,
        otherHealthProblems,
        medicine: meds
      });
    } else {
      medicalInfo.surgeryDetails = surgeryDetails;
      medicalInfo.healthStatus = healthStatus;
      medicalInfo.otherHealthProblems = otherHealthProblems;
      medicalInfo.medicine = meds;
    }

    await medicalInfo.save();
    req.flash("success_msg", "Medical info saved successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error saving medical info");
    res.redirect("/dashboard/add");
  }
});

// ------------------ Logout ------------------
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/");
  });
});
const EnhancedWorkoutSystem = require("../services/workoutSystem");
const ExerciseAPIService = require("../services/exerciseService");

// Dummy base workout system (replace with your real one)
class WorkoutRecommendationEngine {
  generateWorkoutPlan(userProfile) {
    return {
      weeklyPlan: {
        Monday: { exercises: [] },
        Tuesday: { exercises: [] },
        Wednesday: { exercises: [] },
        Thursday: { exercises: [] },
        Friday: { exercises: [] },
        Saturday: { exercises: [] },
        Sunday: { exercises: [] }
      }
    };
  }
}

// Workout plan API
router.get("/api/workout-plan/:userId", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("medicalInfo");
    if (!user || !user.medicalInfo) {
      return res.status(404).json({ error: "User medical info not found" });
    }

    const userProfile = {
      surgeryType: user.medicalInfo.surgeryDetails,
      weeksPostSurgery: calculateWeeksPostSurgery(user.medicalInfo.surgeryDate),
      currentPainLevel: user.medicalInfo.currentPainLevel || 5,
      mobilityLevel: user.medicalInfo.mobilityLevel || "limited",
      age: user.age,
      fitnessLevel: user.fitnessLevel || "beginner"
    };

    const workoutSystem = new EnhancedWorkoutSystem(new WorkoutRecommendationEngine());
    const workoutPlan = await workoutSystem.generateEnhancedWorkoutPlan(userProfile);

    res.json({
      success: true,
      workoutPlan,
      generatedAt: new Date(),
      nextUpdate: calculateNextUpdate(userProfile.weeksPostSurgery)
    });
  } catch (error) {
    console.error("Error generating workout plan:", error);
    res.status(500).json({ error: "Failed to generate workout plan" });
  }
});

// Helpers
function calculateWeeksPostSurgery(surgeryDate) {
  if (!surgeryDate) return 1;
  const now = new Date();
  const surgery = new Date(surgeryDate);
  const diffTime = Math.abs(now - surgery);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
}

function calculateNextUpdate(currentWeek) {
  const daysUntilUpdate = currentWeek <= 8 ? 7 : 14;
  const nextUpdate = new Date();
  nextUpdate.setDate(nextUpdate.getDate() + daysUntilUpdate);
  return nextUpdate;
}
// ------------------ Medicine Reminders ------------------

// Medicine Reminders Page
router.get("/medicine-reminders", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const medicalInfo = await MedicalInfo.findOne({ userId: user._id });

    res.render("pages/medicine-reminders", {
      title: "Medicine Reminders",
      user,
      medicalInfo
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Cannot load medicine reminders");
    res.redirect("/dashboard");
  }
});

// API: Get medicines for current user
router.get("/api/medicines", ensureAuthenticated, async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.findOne({ userId: req.session.user._id });
    res.json({ medicines: medicalInfo ? medicalInfo.medicine : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

// API: Add new medicine
router.post("/api/medicines", ensureAuthenticated, async (req, res) => {
  try {
    const { name, dosage, frequency, times, startDate, duration } = req.body;
    
    let medicalInfo = await MedicalInfo.findOne({ userId: req.session.user._id });
    
    if (!medicalInfo) {
      medicalInfo = new MedicalInfo({
        userId: req.session.user._id,
        medicine: []
      });
    }

    const newMedicine = {
      name,
      dosage,
      frequency,
      times: times || [],
      startDate: startDate || new Date(),
      duration: duration || 30,
      active: true,
      reminderEnabled: true
    };

    medicalInfo.medicine.push(newMedicine);
    await medicalInfo.save();

    res.json({ success: true, medicine: newMedicine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add medicine" });
  }
});

// API: Update medicine
router.put("/api/medicines/:id", ensureAuthenticated, async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.findOne({ userId: req.session.user._id });
    if (!medicalInfo) {
      return res.status(404).json({ error: "Medical info not found" });
    }

    const medicine = medicalInfo.medicine.id(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    Object.assign(medicine, req.body);
    await medicalInfo.save();

    res.json({ success: true, medicine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update medicine" });
  }
});

// API: Delete medicine
router.delete("/api/medicines/:id", ensureAuthenticated, async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.findOne({ userId: req.session.user._id });
    if (!medicalInfo) {
      return res.status(404).json({ error: "Medical info not found" });
    }

    medicalInfo.medicine.id(req.params.id).remove();
    await medicalInfo.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete medicine" });
  }
});

// API: Save medicine history (taken/skipped/missed)
router.post("/api/medicine-history", ensureAuthenticated, async (req, res) => {
  try {
    const { medicineId, medicineName, scheduledDate, scheduledTime, status } = req.body;

    const history = new MedicineHistory({
      userId: req.session.user._id,
      medicineId,
      medicineName,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status
    });

    await history.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save medicine history" });
  }
});

// API: Get medicine history
router.get("/api/medicine-history", ensureAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.session.user._id };
    
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const history = await MedicineHistory.find(query).sort({ scheduledDate: -1 });
    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch medicine history" });
  }
});

// API: Get medicine stats
router.get("/api/medicine-stats", ensureAuthenticated, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayHistory = await MedicineHistory.find({
      userId: req.session.user._id,
      scheduledDate: { $gte: startOfDay, $lt: endOfDay }
    });

    const taken = todayHistory.filter(h => h.status === 'taken').length;
    const missed = todayHistory.filter(h => h.status === 'missed').length;
    const skipped = todayHistory.filter(h => h.status === 'skipped').length;
    const total = todayHistory.length;

    // Calculate streak
    const streakData = await calculateStreak(req.session.user._id);

    res.json({
      today: { taken, missed, skipped, total },
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100,
      streak: streakData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch medicine stats" });
  }
});

// Helper function to calculate streak
async function calculateStreak(userId) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await MedicineHistory.find({
      userId,
      scheduledDate: { $gte: thirtyDaysAgo }
    }).sort({ scheduledDate: -1 });

    // Group by date
    const dailyData = {};
    history.forEach(record => {
      const dateKey = record.scheduledDate.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { taken: 0, total: 0 };
      }
      dailyData[dateKey].total++;
      if (record.status === 'taken') {
        dailyData[dateKey].taken++;
      }
    });

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedDates = Object.keys(dailyData).sort().reverse();
    
    for (const date of sortedDates) {
      const day = dailyData[date];
      if (day.taken === day.total && day.total > 0) {
        tempStreak++;
        if (date === sortedDates[0]) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  } catch (err) {
    console.error('Error calculating streak:', err);
    return { current: 0, longest: 0 };
  }
}

module.exports = router;
