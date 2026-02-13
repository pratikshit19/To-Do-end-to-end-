const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:veKrvgqCnlWlRBYW@cluster0.926aoht.mongodb.net/todos")
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
    default: false,
    type: Boolean
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", userSchema);
const todo = mongoose.model('todos', todoSchema);

module.exports = {
    todo,
    User
}