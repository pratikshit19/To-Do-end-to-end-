const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const multer = require("multer");
const path = require("path");


const app = express();

const { createTodo, updateTodo } = require("./types");
const { todo, User } = require("./db");
const { authMiddleware } = require("./middleware");

const JWT_SECRET = process.env.JWT_SECRET;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors({
  origin: ["192.168.29.199:5173","http://localhost:5173","https://to-do-app-gilt-tau.vercel.app"], credentials: true
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
    const { title, description, priority, dueDate, dueTime } = req.body;

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
      userId: req.userId
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
    const updated = await todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
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
  authenticateToken,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      await User.findByIdAndUpdate(userId, {
        profilePhoto: imageUrl,
      });

      res.json({ profilePhoto: imageUrl });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
