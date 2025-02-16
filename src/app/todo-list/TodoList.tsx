"use client";
import { useReducer, useState } from "react";

type State = {
  user: {
    name: string;
    email: string;
  };
  todos: Todo[];
};

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type ActionType =
  | { type: "UPDATE_USER"; payload: { name: string; email: string } }
  | { type: "ADD_TODO"; payload: Todo }
  | { type: "TOGGLE_TODO"; payload: number }
  | { type: "REMOVE_TODO"; payload: number };

const initialState: State = {
  user: {
    name: "",
    email: "",
  },
  todos: [],
};

const reducer = (state: State, action: ActionType) => {
  switch (action.type) {
    case "ADD_TODO": {
      return { ...state, todos: [...state.todos, action.payload] };
    }
    case "TOGGLE_TODO": {
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    }
    case "REMOVE_TODO": {
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };
    }
    default: {
      return state;
    }
  }
};

const TodoList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [todoText, setTodoText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTodoText(e.target.value);
  };

  const handleAddTodo = () => {
    const nextId =
      state.todos.length > 0
        ? Math.max(...state.todos.map((todo) => todo.id)) + 1
        : 1;
    dispatch({
      type: "ADD_TODO",
      payload: { id: nextId, text: todoText, completed: false },
    });
    setTodoText("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={todoText}
          onChange={handleTextChange}
          placeholder="Enter a new todo"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        />
        <button
          onClick={handleAddTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Add Todo
        </button>
      </div>
      <ul className="space-y-3">
        {state.todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">#{todo.id}</span>
              <span
                className={`text-md ${
                  todo.completed
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {todo.text}
              </span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  todo.completed
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {todo.completed ? "Completed" : "Pending"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  dispatch({ type: "TOGGLE_TODO", payload: todo.id })
                }
                className="px-3 py-1 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200"
              >
                Toggle
              </button>
              <button
                onClick={() =>
                  dispatch({ type: "REMOVE_TODO", payload: todo.id })
                }
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
