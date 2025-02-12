import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Users } from "./Users";

function App() {
  return (
    <Router>
      <main className="max-w-3xl mx-auto mt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </main>
    </Router>
  );
}

function Home() {
  return (
    <div className="items-center">
      <h1 className="text-4xl font-bold">React Sandbox</h1>
      <div className="mt-6 space-y-2">
        <Link
          to="/users"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          users search
        </Link>
      </div>
    </div>
  );
}

export default App;
