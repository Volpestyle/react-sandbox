import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import { Users } from "./Users";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">React Sandbox</h1>
      <div className="flex flex-col space-y-2">
        <Link
          to="/users"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Users
        </Link>
      </div>
    </div>
  );
}

export default App;
