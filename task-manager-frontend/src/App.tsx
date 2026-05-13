import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { TaskDetail } from "./pages/TaskDetail";
import { Login } from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main>
                <Home />
              </main>
            </div>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main>
                <TaskDetail />
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
