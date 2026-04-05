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
const { todo, User, FocusSession, Feedback, Team, Notification, Payment } = require("./db");
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
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
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

    res.json({ token, username: user.username, userId: user._id });

  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});


/* =========================
        TODO ROUTES
========================= */

app.post("/todo", authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, dueTime, recurrence, teamId, assignedTo } = req.body;

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
      teamId: teamId || null,
      assignedTo: assignedTo || null,
      recurrence: recurrence || "none"
    });

    // Send notification if assigned to someone else
    if (assignedTo && assignedTo !== req.userId) {
      const creator = await User.findById(req.userId);
      await Notification.create({
        userId: assignedTo,
        message: `${creator.username} assigned you a task: ${title}`,
        taskId: newTodo._id,
        type: "assignment"
      });
    }

    // Send notification to all team members if it's a team task
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team) {
        const creator = await User.findById(req.userId);
        const memberNotifications = team.members
          .filter(m => m.toString() !== req.userId)
          .map(memberId => ({
            userId: memberId,
            message: `${creator.username} added a new task to ${team.name}: "${title}"`,
            taskId: newTodo._id,
            type: "team_task"
          }));
        
        if (memberNotifications.length > 0) {
          await Notification.insertMany(memberNotifications);
        }
      }
    }

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
    const { start, end, teamId } = req.query;

    let filter = {};
    if (teamId && teamId !== "personal") {
      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: "Team not found" });
      if (team.owner.toString() !== req.userId && !team.members.includes(req.userId)) {
        return res.status(403).json({ message: "Not a team member" });
      }
      filter = { teamId };
    } else {
      filter = { userId: req.userId, teamId: null };
    }

    // If schedule is requesting a range (week/month)
    if (start && end) {
      filter.dueDate = {
        $gte: new Date(start),
        $lt: new Date(end)
      };
    }

    const todos = await todo.find(filter)
      .populate("userId", "username profilePhoto")
      .populate("completedBy", "username profilePhoto")
      .populate("assignedTo", "username profilePhoto")
      .sort({ dueDate: 1 });

    res.json({ todos });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


app.delete("/todos/:id", authMiddleware, async (req, res) => {
  try {
    const taskToDelete = await todo.findById(req.params.id);
    if (!taskToDelete) {
      return res.status(404).json({ error: "Todo not found" });
    }

    if (taskToDelete.teamId) {
      const team = await Team.findById(taskToDelete.teamId);
      if (!team || (team.owner.toString() !== req.userId && !team.members.includes(req.userId))) {
        return res.status(403).json({ error: "Not a member" });
      }
    } else if (taskToDelete.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Todo deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
  try {
    const body = req.body;
    
    const taskToUpdate = await todo.findById(req.params.id);
    if (!taskToUpdate) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (taskToUpdate.teamId) {
      const team = await Team.findById(taskToUpdate.teamId);
      if (!team || (team.owner.toString() !== req.userId && !team.members.includes(req.userId))) {
        return res.status(403).json({ message: "Not a member" });
      }
    } else if (taskToUpdate.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // If completed is being set to true, set completedAt and completedBy
    if (body.completed === true) {
      body.completedAt = new Date();
      body.completedBy = req.userId;
    } else if (body.completed === false) {
      body.completedAt = null;
      body.completedBy = null;
    }

    const updated = await todo.findByIdAndUpdate(req.params.id, body, { new: true });

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

// NOTE: Redundant /user/profile route was merged below into /profile

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
    const user = await User.findById(req.userId).populate("buddy", "username");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate buddy code if missing
    if (!user.buddyCode) {
      user.buddyCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      await user.save();
    }

    res.json({ 
      username: user.username,
      profilePhoto: user.profilePhoto || "",
      isPro: user.isPro || false,
      buddyCode: user.buddyCode,
      buddyName: user.buddy ? user.buddy.username : null,
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

/* =========================
        BUDDY ROUTES
========================= */

app.put("/buddy/link", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Buddy code required" });

    const user = await User.findById(req.userId);
    if (!user.isPro) return res.status(403).json({ message: "Pro membership required to link a buddy." });

    const targetUser = await User.findOne({ buddyCode: code.toUpperCase().trim() });
    if (!targetUser) return res.status(404).json({ message: "Invalid buddy code" });

    if (targetUser._id.toString() === req.userId) {
      return res.status(400).json({ message: "You cannot link with yourself" });
    }

    // Mutual Link
    user.buddy = targetUser._id;
    targetUser.buddy = user._id;

    await user.save();
    await targetUser.save();

    res.json({ message: `Success! You are now linked with ${targetUser.username}.`, buddyName: targetUser.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/buddy/notify-focus", authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'start' or 'break'
    const user = await User.findById(req.userId).populate("buddy");
    
    if (!user || !user.buddy) return res.json({ message: "No buddy linked" });

    let message = "";
    if (action === "start") {
      message = `${user.username} just started a focus session! 🧘`;
    } else if (action === "break") {
      message = `${user.username} broke their focus session early. ⚠️`;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await Notification.create({
      userId: user.buddy._id,
      message,
      type: "buddy_focus"
    });

    res.json({ message: "Buddy notified" });
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
    const amount = 49900; // ₹499 in paise
    const receipt = `rcpt_${crypto.randomBytes(8).toString("hex")}`;
    
    const options = {
      amount,
      currency: "INR",
      receipt,
    };
    
    const order = await razorpay.orders.create(options);
    
    // Log initialized payment
    await Payment.create({
      userId: req.userId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: "created"
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("ORDER ERROR:", JSON.stringify(err, null, 2));
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

    // Signature valid → upgrade user & update payment record
    const user = await User.findByIdAndUpdate(
      req.userId,
      { isPro: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update payment record to paid
    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { paymentId: razorpay_payment_id, status: "paid" }
    );

    res.json({ message: "Payment verified! Welcome to Pro! 👑", isPro: true });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

// Razorpay Webhook for Production Reliability
app.post("/razorpay-webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!secret || !signature) {
    return res.status(400).json({ status: "invalid_webhook" });
  }

  const crypto = require("crypto");
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest !== signature) {
    return res.status(400).json({ status: "invalid_signature" });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === "order.paid" || event === "payment.captured") {
    const orderId = payload.order?.entity?.id || payload.payment?.entity?.order_id;
    const paymentId = payload.payment?.entity?.id;

    if (orderId) {
      // Find the payment and user to upgrade
      const payment = await Payment.findOneAndUpdate(
        { orderId: orderId },
        { status: "paid", paymentId: paymentId },
        { new: true }
      );

      if (payment) {
        await User.findByIdAndUpdate(payment.userId, { isPro: true });
        console.log(`WEBHOOK: User ${payment.userId} upgraded via ${event}`);
      }
    }
  }

  res.json({ status: "ok" });
});

/* =========================
          TEAM ROUTES
========================= */

app.post("/team", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Team name is required" });

    const user = await User.findById(req.userId);
    if (!user.isPro) {
      const ownedTeamsCount = await Team.countDocuments({ owner: req.userId });
      if (ownedTeamsCount >= 2) {
        return res.status(403).json({ 
          message: "Free users can only create up to 2 teams. Upgrade to Pro for unlimited workspaces!",
          limitReached: true
        });
      }
    }

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    let newTeam = await Team.create({ name, inviteCode, owner: req.userId, members: [req.userId] });
    newTeam = await Team.findById(newTeam._id).populate("members", "username profilePhoto");
    res.json({ message: "Team created!", team: newTeam });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/team/join", authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: "Invite code is required" });
    const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!team) return res.status(404).json({ message: "Invalid invite code" });
    
    if (team.members.includes(req.userId)) return res.status(400).json({ message: "Already a member" });

    // Check member limit for Free user teams
    const owner = await User.findById(team.owner);
    if (!owner.isPro && team.members.length >= 5) {
      return res.status(403).json({ 
        message: "This team has reached the 5-member limit for Free workspaces. The owner needs to upgrade to Pro to add more members!",
        limitReached: true
      });
    }
    
    team.members.push(req.userId);
    await team.save();
    const populatedTeam = await Team.findById(team._id).populate("members", "username profilePhoto");
    res.json({ message: "Joined team successfully!", team: populatedTeam });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/team/:id", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Team name is required" });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the owner can rename the team" });
    }

    team.name = name;
    await team.save();
    res.json({ message: "Team renamed!", team });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/team/:id", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Debug logging to verify identity match
    console.log(`Delete Request - Team: ${team.name}, Owner: ${team.owner}, Requester: ${req.userId}`);

    if (team.owner.toString().trim() !== req.userId.toString().trim()) {
      return res.status(403).json({ 
        message: "Forbidden: You do not have permission to delete this team.",
        debug: { owner: team.owner, requester: req.userId } 
      });
    }

    // Notify all members before deleting
    const memberNotifications = team.members
      .filter(m => m.toString() !== req.userId)
      .map(memberId => ({
        userId: memberId,
        message: `The team "${team.name}" has been deleted by the owner.`,
        type: "team_deleted"
      }));
    
    if (memberNotifications.length > 0) {
      await Notification.insertMany(memberNotifications);
    }

    // Delete all todos associated with this team
    await todo.deleteMany({ teamId: req.params.id });

    // Delete the team itself
    await Team.findByIdAndDelete(req.params.id);

    res.json({ message: "Team and its tasks deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/teams", authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.userId })
      .populate("members", "username profilePhoto")
      .lean();
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
          NOTIFICATION ROUTES
========================= */

app.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
