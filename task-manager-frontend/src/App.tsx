import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { TaskDetail } from "./pages/TaskDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
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
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
