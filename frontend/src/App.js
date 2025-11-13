import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

export default function App(){
  const [todos,setTodos]=useState([]),[loading,setLoading]=useState(true);
  const [newTitle,setNewTitle]=useState(''),[newDescription,setNewDescription]=useState('');
  useEffect(()=>{(async()=>{try{setLoading(true);const r=await axios.get('/api/todos');setTodos(r.data);}finally{setLoading(false);}})();},[]);
  const addTodo=async e=>{e.preventDefault(); if(!newTitle.trim())return;
    const r=await axios.post('/api/todos',{title:newTitle,description:newDescription});
    setTodos([r.data,...todos]); setNewTitle(''); setNewDescription('');};
  const toggleTodo=async t=>{const r=await axios.put(`/api/todos/${t.id}`,{...t,completed:!t.completed});
    setTodos(todos.map(x=>x.id===t.id?r.data:x));};
  const del=async id=>{if(!window.confirm('Delete this todo?'))return;
    await axios.delete(`/api/todos/${id}`); setTodos(todos.filter(t=>t.id!==id));};
  if(loading) return <div className="loading">Loading...</div>;
  return (<div className="App">
    <header><h1>Todo App</h1><p>Docker Compose Lab</p></header>
    <div className="container">
      <form onSubmit={addTodo} className="todo-form">
        <h2>Add New Todo</h2>
        <input placeholder="What needs to be done?" value={newTitle} onChange={e=>setNewTitle(e.target.value)} required />
        <textarea placeholder="Description (optional)" value={newDescription} onChange={e=>setNewDescription(e.target.value)} rows="3" />
        <button type="submit">Add Todo</button>
      </form>
      <div className="todos-section">
        <h2>My Todos ({todos.length})</h2>
        {todos.length===0? <p className="no-todos">No todos yet!</p> :
          <div className="todos-list">
            {todos.map(todo=>(
              <div key={todo.id} className={`todo-item ${todo.completed?'completed':''}`}>
                <input type="checkbox" checked={todo.completed} onChange={()=>toggleTodo(todo)} />
                <div className="todo-content"><h3>{todo.title}</h3>{todo.description&&<p>{todo.description}</p>}</div>
                <button onClick={()=>del(todo.id)}>×</button>
              </div>
            ))}
          </div>}
      </div>
    </div>
  </div>);
}
