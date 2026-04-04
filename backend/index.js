const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const multer = require("multer");
const path = require("path");
const fs = require("fs");


const app = express();

const { createTodo, updateTodo } = require("./types");
const { todo, User, FocusSession, Feedback } = require("./db");
const { authMiddleware } = require("./middleware");

const JWT_SECRET = process.env.JWT_SECRET;
const cloudinary = require("./cloudinary");
const upload = require("./upload");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(express.json());
app.use(cors()); // Allow all for production troubleshooting, or specifically: origin: "*"
app.use("/uploads", express.static("uploads"));

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(411).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword
    });

    res.json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(403).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, username: user.username });

  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});


/* =========================
        TODO ROUTES
========================= */

app.post("/todo", authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, dueTime, recurrence } = req.body;

    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    const parsedDate = new Date(dueDate);

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const newTodo = await todo.create({
      title,
      description,
      completed: false,
      priority: priority || "medium",
      dueDate: parsedDate,
      dueTime: dueTime || null,
      userId: req.userId,
      recurrence: recurrence || "none"
    });

    res.json({
      message: "To-do created!",
      todo: newTodo
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/todos", authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;

    let filter = { userId: req.userId };

    // If schedule is requesting a range (week/month)
    if (start && end) {
      filter.dueDate = {
        $gte: new Date(start),
        $lt: new Date(end)
      };
    }

    const todos = await todo.find(filter).sort({ dueDate: 1 });

    res.json({ todos });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


app.delete("/todos/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId     // 🔥 User-specific delete
    });

    if (!deleted) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
  try {
    const body = req.body;
    
    // If completed is being set to true, set completedAt
    if (body.completed === true) {
      body.completedAt = new Date();
    } else if (body.completed === false) {
      body.completedAt = null;
    }

    const updated = await todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword)
    return res.status(400).json({ message: "Username and password required" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Settings: Secure Change Password
app.put("/change-password", authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both old and new passwords are required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(403).json({ message: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      profilePhoto: user.profilePhoto || "",
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post(
  "/upload-profile",
  authMiddleware,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Cloudinary using buffer
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_photos" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const imageUrl = uploadResult.secure_url;

      await User.findByIdAndUpdate(req.userId, {
        profilePhoto: imageUrl,
      });

      res.json({ profilePhoto: imageUrl });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Failed to upload to Cloudinary" });
    }
  }
);

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ 
      username: user.username,
      profilePhoto: user.profilePhoto,
      isPro: user.isPro || false,
      proSettings: user.proSettings || { accentColor: null, customBackground: null },
      dailyFocusTarget: user.dailyFocusTarget || 60
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/* =========================
        FOCUS ROUTES
========================= */

app.post("/focus-sessions", authMiddleware, async (req, res) => {
  try {
    const { duration } = req.body;
    const newSession = await FocusSession.create({
      duration,
      userId: req.userId,
      date: new Date()
    });
    res.json(newSession);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/focus-sessions", authMiddleware, async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ focusSessions: sessions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/feedback", authMiddleware, async (req, res) => {
  try {
    const { category, message } = req.body;

    if (!category || !message) {
      return res.status(400).json({ message: "Category and message are required" });
    }

    if (!["bug", "feature", "love", "other"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    await Feedback.create({
      userId: req.userId,
      category,
      message
    });

    res.json({ message: "Feedback received! Thank you for helping us improve." });

  } catch (err) {
    console.error("FEEDBACK ERROR:", err);
    res.status(500).json({ message: "Failed to send feedback" });
  }
});

app.put("/user/pro-settings", authMiddleware, async (req, res) => {
  try {
    const { proSettings, dailyFocusTarget } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (proSettings) {
      user.proSettings = { ...user.proSettings, ...proSettings };
    }
    if (dailyFocusTarget !== undefined) {
      user.dailyFocusTarget = dailyFocusTarget;
    }

    await user.save();
    res.json({
      proSettings: user.proSettings,
      dailyFocusTarget: user.dailyFocusTarget
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update pro settings" });
  }
});

app.get("/generate-report", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isPro) {
      return res.status(403).json({ message: "Pro membership required for reports." });
    }

    const { type } = req.query; // 'weekly' or 'monthly'
    const days = type === 'monthly' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch Completed Tasks in range
    const completedTodos = await todo.find({
      userId: req.userId,
      completed: true,
      completedAt: { $gte: startDate }
    }).sort({ completedAt: -1 });

    // Fetch Focus Sessions in range
    const sessions = await FocusSession.find({
      userId: req.userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Generate CSV String
    let csv = "Date,Type,Title/Duration,Detail/Priority\n";
    
    // Add Tasks
    completedTodos.forEach(t => {
      const dateStr = new Date(t.completedAt).toLocaleDateString();
      const title = t.title.replace(/,/g, ""); // Clean commas
      csv += `${dateStr},Task,${title},${t.priority}\n`;
    });

    // Add Sessions
    sessions.forEach(s => {
      const dateStr = new Date(s.date).toLocaleDateString();
      csv += `${dateStr},Focus Session,${s.duration} mins,Completed\n`;
    });

    // Send as Downloadable File
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=TaskFlow_${type}_Report.csv`);
    res.send(csv);

  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

app.post("/upgrade-to-pro", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId, 
      { isPro: true }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      message: "Welcome to Pro! Your features are now unlocked.", 
      isPro: true 
    });

  } catch (err) {
    console.error("UPGRADE ERROR:", err);
    res.status(500).json({ message: "Failed to process upgrade" });
  }
});

/* =========================
      RAZORPAY PAYMENT ROUTES
========================= */

// Create Razorpay Order
app.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const options = {
      amount: 49900, // ₹499 in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`, // max 40 chars
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("ORDER ERROR:", JSON.stringify(err, null, 2));
    // Surface Razorpay-specific error to help debug
    const razorpayMsg = err?.error?.description || err?.message || "Failed to create payment order";
    res.status(500).json({ message: razorpayMsg, debug: err?.statusCode });
  }
});

// Verify Razorpay Payment Signature & Upgrade to Pro
app.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature. Payment verification failed." });
    }

    // Signature valid → upgrade user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { isPro: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Payment verified! Welcome to Pro! 👑", isPro: true });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
