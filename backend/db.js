const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:veKrvgqCnlWlRBYW@cluster0.926aoht.mongodb.net/todos");

const todoSchema = new mongoose.Schema({
    title: String,
    description: String,
    completed: Boolean
});

const todo = mongoose.model('todos', todoSchema);

module.exports = {
    todo,
}