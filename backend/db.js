const mongoose = require("mongoose");
const { image } = require("./cloudinary");

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("MongoDB database connected");
})
.catch((err)=>{
    console.error("Connection error with MongoDB", err);
});

const todoSchema = new mongoose.Schema({
  title: String,
  description: String,

  completed: {
    type: Boolean,
    default: false
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },

  dueDate: {
    type: Date,
    required: true
  },

  dueTime: {
    type: String
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
}, { timestamps: true });  // good practice

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  profilePhoto: {
    type: String,   // will store image URL
    default: ""
  }
});

const User = mongoose.model("User", userSchema);
const todo = mongoose.model('todos', todoSchema);

module.exports = {
    todo,
    User
}