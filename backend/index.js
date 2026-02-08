const express = require("express");
const app = express();
const { createTodo, updateTodo } = require("./types");
const { todo } = require("./db");

app.use(express.json());

app.post("/todo", async (req, res)=>{
    const createPayload = req.body;
    const parsedPayload = createTodo.safeParse(createPayload);
    if(!parsedPayload.success){
        res.status(411).json({
            message: "You sent the wrong inputs"
        })
        return;
    }
    await todo.create({
        title: createPayload.title,
        description: createPayload.description,
        completed: false
    })
    res.json({
        message: "To-do created!"
    })

});

app.get("/todos",async (req, res)=>{
    const todos = await todo.find({});
    res.json({
        todos
    })
});

app.put("/completed", async (req, res)=>{
     const updatePayload = req.body;
    const parsedPayload = updateTodo.safeParse(updatePayload);
    if(!parsedPayload.success){
        res.status(411).json({
            message: "You sent the wrong inputs"
        })
        return;
    }
    await todo.updateMany({
        _id: req.body.id
    },{
        completed: true
    })
    res.json({
        message: "Marked as completed!"
    })
});

app.listen(5000);