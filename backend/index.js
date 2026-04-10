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
const { todo, User, FocusSession, Feedback, Team, Notification, Audit } = require("./db");
const { authMiddleware } = require("./middleware");

const JWT_SECRET = process.env.JWT_SECRET;
const cloudinary = require("./cloudinary");
const upload = require("./upload");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(express.json());
app.use(cors()); // Allow all for production troubleshooting, or specifically: origin: "*"
app.use("/uploads", express.static("uploads"));

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? "Email already exists" : "Username already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.json({ message: "User created successfully" });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/signin", async (req, res) => {
  const { identifier, password } = req.body; // identifier can be username or email

  try {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

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
        AUTH FLOW
========================= */

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Reset Link
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    // Setup Mailer (Optional)
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"TaskFlow Support" <support@taskflow.com>',
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link expires in 1 hour.</p>
        </div>
      `
    };

    // If SMTP is not configured, log to console for testing
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("=========================================");
      console.log("RESET LINK (SMTP NOT CONFIGURED):", resetUrl);
      console.log("=========================================");
      return res.json({ message: "Reset link generated (check server console for testing)" });
    }

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset link sent to your email" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to send reset link" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});


/* =========================
        TODO ROUTES
========================= */

app.post("/todo", authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, dueTime, recurrence, teamId, assignedTo, reminderAt } = req.body;

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
      recurrence: recurrence || "none",
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      reminderSent: false
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
    
    if ('reminderAt' in body) {
      body.reminderSent = false;
    }

    const updated = await todo.findByIdAndUpdate(req.params.id, body, { new: true });

    // Notify team members when a task is completed in a team workspace
    if (body.completed === true && taskToUpdate.teamId) {
      const team = await Team.findById(taskToUpdate.teamId);
      if (team) {
        const completer = await User.findById(req.userId);
        const memberNotifications = team.members
          .filter(m => m.toString() !== req.userId)
          .map(memberId => ({
            userId: memberId,
            message: `${completer.username} completed "${taskToUpdate.title}" ✅`,
            taskId: updated._id,
            type: "team_complete"
          }));
        if (memberNotifications.length > 0) {
          await Notification.insertMany(memberNotifications);
        }
      }
    }

    // Notify assignee when a task they are assigned to is edited (but not just toggled complete)
    if (!('completed' in body) && taskToUpdate.assignedTo && taskToUpdate.assignedTo.toString() !== req.userId) {
      const editor = await User.findById(req.userId);
      await Notification.create({
        userId: taskToUpdate.assignedTo,
        message: `${editor.username} updated a task assigned to you: "${body.title || taskToUpdate.title}"`,
        taskId: updated._id,
        type: "task_updated"
      });
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

// NOTE: Redundant /user/profile route was merged below into /profile

app.put("/profile", authMiddleware, async (req, res) => {
  const { username } = req.body;

  try {
    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username cannot be empty" });
    }

    // Check if username is taken
    const existingUser = await User.findOne({ username, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { username },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      username: updatedUser.username,
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error during profile update" });
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
    const user = await User.findById(req.userId).populate("buddy", "username");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate buddy code if missing
    if (!user.buddyCode) {
      user.buddyCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      await user.save();
    }

    res.json({ 
      username: user.username,
      email: user.email,
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
    const update = {};
    if (theme !== undefined) update["preferences.theme"] = theme;
    if (darkMode !== undefined) update["preferences.darkMode"] = darkMode;
    if (focusMode !== undefined) update["preferences.focusMode"] = focusMode;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.preferences);
  } catch (err) {
    console.error("PREF ERROR:", err);
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

    // Notify the linked buddy
    await Notification.create({
      userId: targetUser._id,
      message: `${user.username} linked up with you as a Focus Buddy! 👥 You'll keep each other accountable.`,
      type: "buddy_linked"
    });

    res.json({ message: `Success! You are now linked with ${targetUser.username}.`, buddyName: targetUser.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/buddy/unlink", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.buddy) {
      const buddyUser = await User.findById(user.buddy);
      if (buddyUser) {
        // Notify the disconnected buddy
        await Notification.create({
          userId: buddyUser._id,
          message: `${user.username} has disconnected as your Focus Buddy.`,
          type: "buddy_unlinked"
        });
        buddyUser.buddy = null;
        await buddyUser.save();
      }
    }

    user.buddy = null;
    await user.save();

    res.json({ message: "Buddy disconnected successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/buddy/notify-focus", authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'start', 'break', or 'complete'
    const user = await User.findById(req.userId).populate("buddy");
    
    if (!user || !user.buddy) return res.json({ message: "No buddy linked" });

    let message = "";
    if (action === "start") {
      message = `${user.username} just started a focus session! 🧘`;
    } else if (action === "break") {
      message = `${user.username} broke their focus session early. ⚠️`;
    } else if (action === "complete") {
      message = `${user.username} crushed their focus session! 🔥 Go celebrate with them.`;
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

    // Send welcome Pro notification
    await Notification.create({
      userId: req.userId,
      message: "🎉 Welcome to TaskFlow Pro! All premium features are now unlocked — enjoy unlimited workspaces, AI tools, and more.",
      type: "pro_upgrade"
    });

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
      amount: 9900, // ₹99 in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`, // max 40 chars
      notes: {
        userId: req.userId
      }
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

    // Send welcome Pro notification via payment verification path
    await Notification.create({
      userId: req.userId,
      message: "🎉 Payment confirmed! Welcome to TaskFlow Pro! All premium features are now unlocked.",
      type: "pro_upgrade"
    });

    res.json({ message: "Payment verified! Welcome to Pro! 👑", isPro: true });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

// Razorpay Webhook (Critical for reliable live payments)
app.post("/webhook/razorpay", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "razorsecretpay";
  const signature = req.headers["x-razorpay-signature"];

  try {
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // signature valid → process event
    const event = req.body.event;
    
    if (event === "payment.captured") {
      const { notes } = req.body.payload.payment.entity;
      
      if (!notes || !notes.userId) {
        console.error("WEBHOOK: ERROR - Missing userId in payment notes");
        return res.status(400).json({ status: "error", message: "Missing userId in notes" });
      }

      const user = await User.findByIdAndUpdate(
        notes.userId, 
        { isPro: true },
        { new: true }
      );
      console.log(`WEBHOOK: Upgraded user ${user?.username} (ID: ${notes.userId}) to Pro via captured payment.`);
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(500).json({ status: "error" });
  }
});

/* =========================
          AI ROUTES
========================= */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_KEY");

app.get("/ai/audits", authMiddleware, async (req, res) => {
  try {
    const audits = await Audit.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ audits });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audits" });
  }
});

app.post("/ai/generate-audit", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Check Cooldown (24 hours)
    const latestAudit = await Audit.findOne({ userId }).sort({ createdAt: -1 });
    if (latestAudit) {
      const hoursSince = (new Date() - new Date(latestAudit.createdAt)) / 36e5;
      if (hoursSince < 24) {
        return res.status(429).json({ message: `Your coach is still analyzing. Try again in ${Math.ceil(24 - hoursSince)} hours.` });
      }
    }

    // 2. Fetch Data (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedTasks = await todo.find({
      userId,
      completed: true,
      completedAt: { $gte: thirtyDaysAgo }
    });

    const pendingTasks = await todo.find({
      userId,
      completed: false
    });

    const focusSessions = await FocusSession.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });

    // 3. Aggregate Metrics
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    
    // Safety check for empty data
    if (completedTasks.length === 0 && focusSessions.length === 0) {
      return res.json({ audit: { 
        content: "I've started warming up the lab, but I need a few more days of data to give you a deep audit. Mark some tasks as complete and track a few focus sessions, and then check back tomorrow! 🧪",
        createdAt: new Date(),
        metricsSummary: { tasksCompleted: 0, focusMinutes: 0, topPriority: 'None', period: "Initial" }
      }});
    }

    const priorities = completedTasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});
    const topPriority = Object.entries(priorities).sort((a,b) => b[1] - a[1])[0]?.[0] || "medium";

    const hourMap = completedTasks.reduce((acc, t) => {
      // Use completedAt if available, fallback to updatedAt (timestamps:true)
      const dateToUse = t.completedAt || t.updatedAt;
      if (dateToUse) {
        const hour = new Date(dateToUse).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});
    const peakHour = Object.entries(hourMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "None";

    // 4. Gemini Prompt
    let advice;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an Elite Productivity Auditor and Psychologist. Analyze the following 30-day behavioral data for ${user.username}:

      - Tasks Completed: ${completedTasks.length}
      - Tasks Pending: ${pendingTasks.length}
      - Total Focus Time: ${totalFocusMinutes} minutes
      - Preferred Priority: ${topPriority}
      - Peak Productivity Hour: ${peakHour}:00

      Provide a professional, high-impact audit. Format it strictly with these sections:
      1. **Psychological Snapshot**: One paragraph describing their current work persona.
      2. **The "Traffic Jam"**: Identify one bottleneck in their data.
      3. **3 Actionable Magic Moves**: Clear, behavioral shifts they should make TODAY.

      Keep it concise, motivating, and professional. Use bullet points for moves.`;

      const result = await model.generateContent(prompt);
      advice = (await result.response).text();
    } catch (aiErr) {
      console.warn("AI COACH: Gemini Quota Reached or Failed. Using local heuristics.");
      // HEURISTIC FALLBACK
      const velocity = completedTasks.length / 30;
      const focusRatio = totalFocusMinutes / (completedTasks.length || 1);
      
      advice = `**Psychological Snapshot**
      Based on your recent metrics, you are functioning as 'The Foundation Builder.' You are consistently logging data, but your AI Coach is currently in deep meditation (Quota Limit reached). Your local performance signature is stable but has room for more explosive growth.

      **The "Traffic Jam"**
      Your current bottleneck appears to be ${totalFocusMinutes < 100 ? "low focus depth" : "task volume management"}. You are averaging ${velocity.toFixed(1)} tasks per day, which suggests a steady rhythm, but your focus sessions could be longer to handle high-complexity tasks.

      **3 Actionable Magic Moves**
      - **The 5-Minute Rule**: Start your most avoided task for just 5 minutes today; inertia is your only enemy.
      - **Focus Stacking**: Schedule one 45-minute deep focus session at ${peakHour === "None" ? "10:00" : peakHour + ":00"} tomorrow to capitalize on your natural peak.
      - **Priority Audit**: Review your pending list (${pendingTasks.length} items) and delete 3 tasks that no longer align with your core goals.`;
    }

    // 5. Save & Return
    const newAudit = await Audit.create({
      userId,
      content: advice,
      metricsSummary: {
        tasksCompleted: completedTasks.length,
        focusMinutes: totalFocusMinutes,
        topPriority,
        period: "30 Days"
      }
    });

    res.json({ audit: newAudit });

  } catch (err) {
    console.error("COACH FATAL ERROR:", err);
    res.status(500).json({ message: "The coach is currently unavailable. Try again later." });
  }
});

app.post("/ai/mind-sweep", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Extract all tasks from the following text and return them as a JSON array of objects. 
      Do not include any surrounding text, markdown formatting, or explanations. Return ONLY the valid JSON array.
      Each task object MUST have:
      - title (string, max 60 chars)
      - priority (string choice: "low", "medium", "high")
      - dueDate (ISO string of the date mentioned, default to today if not found)
      
      Format example:
      [{"title":"Task name","priority":"medium","dueDate":"2024-04-10T..."}]
      
      Text: "${text}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      let jsonStr = aiText.replace(/```json|```/gi, "").trim();
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      
      const tasks = JSON.parse(jsonStr);
      return res.json({ tasks });
    } catch (aiError) {
      console.log("AI limits reached or failed. Falling back to local heuristic extraction...");
      const phrases = text.split(/\.\s+|\n|, and | and /i).map(p => p.trim()).filter(p => p.length > 4);
      const tasks = phrases.map(phrase => {
        let priority = "medium";
        const lower = phrase.toLowerCase();
        if (lower.includes("urgent") || lower.includes("asap")) priority = "high";
        else if (lower.includes("maybe") || lower.includes("someday")) priority = "low";
        let dueDate = new Date();
        if (lower.includes("tomorrow")) dueDate.setDate(dueDate.getDate() + 1);
        let title = phrase;
        if (title.length > 60) title = title.substring(0, 57) + "...";
        return { title, priority, dueDate: dueDate.toISOString() };
      });
      return res.json({ tasks });
    }
  } catch (err) {
    console.error("MIND SWEEP ERROR:", err);
    res.status(500).json({ message: "Extraction failed." });
  }
});

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

    // Notify the team owner that someone joined
    if (team.owner.toString() !== req.userId) {
      const joiner = await User.findById(req.userId);
      await Notification.create({
        userId: team.owner,
        message: `${joiner.username} just joined your team "${team.name}"! 🎉`,
        type: "team_join"
      });
    }

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

    const oldName = team.name;
    team.name = name;
    await team.save();

    // Notify all team members about the rename
    const renamer = await User.findById(req.userId);
    const memberNotifications = team.members
      .filter(m => m.toString() !== req.userId)
      .map(memberId => ({
        userId: memberId,
        message: `${renamer.username} renamed the workspace "${oldName}" to "${name}"`,
        type: "team_rename"
      }));
    if (memberNotifications.length > 0) {
      await Notification.insertMany(memberNotifications);
    }

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

/* =========================
          REMINDER POLL
========================= */
setInterval(async () => {
  try {
    const now = new Date();
    // Find impending uncompleted tasks that have an unsent reminder
    const impendingTasks = await todo.find({
      completed: false,
      reminderSent: false,
      reminderAt: { $lte: now, $ne: null }
    }).populate("assignedTo").populate("userId");

    if (impendingTasks.length > 0) {
      const dbUpdates = [];
      const notifications = [];

      for (const t of impendingTasks) {
        // Decide who to notify. Assignee or creator.
        const targetUserId = t.assignedTo ? t.assignedTo._id : t.userId._id;
        
        notifications.push({
          userId: targetUserId,
          message: `⏰ Reminder: "${t.title}" is due soon!`,
          taskId: t._id,
          type: "system"
        });
        
        dbUpdates.push(todo.findByIdAndUpdate(t._id, { reminderSent: true }));
      }

      await Notification.insertMany(notifications);
      await Promise.all(dbUpdates);
    }
  } catch (err) {
    console.error("Reminder Poll Error:", err);
  }
}, 60000); // Check every 60 seconds

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
