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
      dailyFocusTarget: user.dailyFocusTarget || 60,
      preferences: user.preferences || { theme: "blue", darkMode: true, focusMode: false }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

app.put("/user/preferences", authMiddleware, async (req, res) => {
  try {
    const { theme, darkMode, focusMode } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if(!user.preferences) user.preferences = {};
    
    if(theme !== undefined) user.preferences.theme = theme;
    if(darkMode !== undefined) user.preferences.darkMode = darkMode;
    if(focusMode !== undefined) user.preferences.focusMode = focusMode;
    
    await user.save();
    res.json(user.preferences);
  } catch (err) {
    res.status(500).json({ message: "Failed to update preferences" });
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

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 0, size: 'A4' }); // margin 0 for full-bleed header

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TaskFlow_${type}_Report.pdf`);

    doc.pipe(res);

    // Global Stats Calculation
    const allTodos = await todo.find({ userId: req.userId });
    const allCompleted = allTodos.filter(t => t.completed).length;
    const completionRate = allTodos.length > 0 ? Math.round((allCompleted / allTodos.length) * 100) : 0;
    
    const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const focusHours = Math.floor(totalFocusMinutes / 60);
    const focusMins = totalFocusMinutes % 60;

    // ----- COVER HEADER -----
    doc.rect(0, 0, 612, 140).fill('#0f172a'); // Dark navy header
    doc.fillColor('#3b82f6').font('Helvetica-Bold').fontSize(32).text('TaskFlow', 50, 45, { continued: true })
       .fillColor('#ffffff').font('Helvetica-Bold').text(' Insights');
    
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(12)
       .text(`Generated for ${user.username} | ${type.toUpperCase()} REPORT`, 50, 90);
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 50, 105);

    // ----- INSIGHT CARDS -----
    const cardY = 170;
    
    // Productivity Index Card
    doc.roundedRect(50, cardY, 240, 100, 15).fill('#f8fafc');
    doc.fillColor('#3b82f6').font('Helvetica-Bold').fontSize(42).text(`${completionRate}%`, 70, cardY + 20);
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(12).text(`PRODUCTIVITY INDEX`, 70, cardY + 70);

    // Focus Time Card
    doc.roundedRect(320, cardY, 240, 100, 15).fill('#f8fafc');
    doc.fillColor('#8b5cf6').font('Helvetica-Bold').fontSize(35).text(`${focusHours}h ${focusMins}m`, 340, cardY + 25);
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(12).text(`TOTAL FOCUS TIME`, 340, cardY + 70);

    // Tasks Completed Card
    doc.roundedRect(50, 290, 510, 65, 15).fill('#f8fafc');
    doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(28).text(`${completedTodos.length}`, 75, 308, { continued: true })
       .fillColor('#0f172a').font('Helvetica-Bold').fontSize(16).text(`   Tasks Completed`, 75, 316);

    doc.y = 400;

    // ----- COMPLETED TASKS LIST -----
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(18).text('Recent Achievements', 50, doc.y);
    doc.moveDown(1);

    // Table Header
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(10);
    doc.text('DATE', 50, doc.y, { continued: false });
    doc.text('PRIORITY', 160, doc.y - 12, { continued: false });
    doc.text('TASK SUMMARY', 250, doc.y - 12, { continued: false });
    
    doc.moveTo(50, doc.y + 8).lineTo(562, doc.y + 8).strokeColor('#e2e8f0').lineWidth(2).stroke();
    doc.moveDown(1.5);

    // Table Body
    doc.font('Helvetica');
    completedTodos.forEach(t => {
      if(doc.y > 720) {
        doc.addPage({ margin: 0 });
        doc.y = 50;
      }
      const y = doc.y;
      doc.fillColor('#0f172a').fontSize(11).text(new Date(t.completedAt).toLocaleDateString(), 50, y, { continued: false });
      
      let pColor = '#94a3b8';
      if (t.priority === 'high') pColor = '#ef4444';
      if (t.priority === 'medium') pColor = '#f59e0b';
      if (t.priority === 'low') pColor = '#10b981';
      
      doc.fillColor(pColor).font('Helvetica-Bold').text((t.priority || "-").toUpperCase(), 160, y, { continued: false });
      doc.fillColor('#0f172a').font('Helvetica').text(t.title, 250, y, { width: 300, continued: false });
      
      doc.moveTo(50, doc.y + 5).lineTo(562, doc.y + 5).strokeColor('#f1f5f9').lineWidth(1).stroke();
      doc.moveDown(1);
    });

    if (completedTodos.length === 0) {
      doc.fillColor('#94a3b8').text('No tasks completed during this period.', 50, doc.y);
    }

    doc.moveDown(2);

    // Focus Sessions Section
    if(doc.y > 600) doc.addPage();
    doc.fontSize(16).fillColor('#0f172a').text('Focus Sessions');
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#64748b');
    doc.text('Date', 50, doc.y, { continued: false });
    doc.text('Duration (mins)', 150, doc.y - 10, { continued: false });
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1);

    doc.fillColor('#0f172a');
    sessions.forEach(s => {
      if(doc.y > 680) {
        doc.addPage();
      }
      const y = doc.y;
      doc.text(new Date(s.date).toLocaleDateString(), 50, y, { continued: false });
      doc.text(`${s.duration} mins`, 150, y, { continued: false });
      doc.moveDown(0.5);
    });

    if (sessions.length === 0) {
      doc.fillColor('#94a3b8').text('No focus sessions recorded.', 50, doc.y);
    }

    doc.end();

  } catch (err) {
    console.error("REPORT ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate report" });
    }
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
