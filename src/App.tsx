import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Users } from "./Users";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center">
        <main className="mt-16">
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
      <h1 className="text-4xl font-bold">React Sandbox</h1>
      <div className="flex flex-col space-y-2">
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
