const zod = require("zod");

const createTodo = zod.object({
  title: zod.string(),
  description: zod.string(),
  priority: zod.enum(["low", "medium", "high"])
});

const updateTodo = zod.object({
    id: zod.string(),
    priority: zod.enum(["low", "medium", "high"]).optional()
});

module.exports = {
    createTodo: createTodo,
    updateTodo: updateTodo
}