import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { CreateTodo } from './components/createTodo'
import { Todos } from './components/Todos'

function App() {
  

  return (
    
      <div>
        <CreateTodo/>
        <Todos todos ={[
          {
            title: "1st todo",
            description:"dec of 1st todo",
            completed:true
          }
        ]}/>
      </div>
    
  )
}

export default App
