const zod = require("zod");

const createTodo = zod.object({
  title: zod.string(),
  description: zod.string(),
  priority: zod.enum(["low", "medium", "high"]),
  dueDate: zod.string(),   // frontend will send ISO string
  dueTime: zod.string().optional()
});

const updateTodo = zod.object({
    id: zod.string(),
    priority: zod.enum(["low", "medium", "high"]).optional()
});

module.exports = {
    createTodo: createTodo,
    updateTodo: updateTodo
}