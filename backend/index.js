const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const PORT = process.env.PORT || 5000;


const app = express();

const { createTodo, updateTodo } = require("./types");
const { todo, User } = require("./db");
const { authMiddleware } = require("./middleware");

const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(cors());

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
      return res.status(403).json({ message: "User not found" });
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

    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});


/* =========================
        TODO ROUTES
========================= */

app.post("/todo", authMiddleware, async (req, res) => {
  const createPayload = req.body;
  const parsedPayload = createTodo.safeParse(createPayload);

  if (!parsedPayload.success) {
    return res.status(411).json({
      message: "You sent wrong inputs"
    });
  }

  await todo.create({
    title: createPayload.title,
    description: createPayload.description,
    completed: false,
    userId: req.userId      // 🔥 IMPORTANT
  });

  res.json({
    message: "To-do created!"
  });
});

app.get("/todos", authMiddleware, async (req, res) => {
  const todos = await todo.find({
    userId: req.userId      // 🔥 Only this user's todos
  });

  res.json({ todos });
});

// app.put("/completed", authMiddleware, async (req, res) => {
//   const updatePayload = req.body;
//   const parsedPayload = updateTodo.safeParse(updatePayload);

//   if (!parsedPayload.success) {
//     return res.status(411).json({
//       message: "Wrong inputs"
//     });
//   }

//   await todo.updateOne(
//     { _id: req.body.id, userId: req.userId }, // 🔥 Secure
//     { completed: true }
//   );

//   res.json({
//     message: "Marked as completed!"
//   });
// });

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
    const { id } = req.params;

    const existingTodo = await todo.findOne({
      _id: id,
      userId: req.userId  // 🔥 Important for security
    });

    if (!existingTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    existingTodo.completed = !existingTodo.completed;
    await existingTodo.save();

    res.json({ message: "Todo updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
