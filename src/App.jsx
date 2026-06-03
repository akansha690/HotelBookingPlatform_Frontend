import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import HotelDetails  from "./pages/HotelDetails";
import MyBookings    from "./pages/MyBookings";
import RoomDetails   from "./pages/RoomDetails";
import Booking       from "./pages/Booking";
import ProtectedRoute from "./components/ProtectedRoute";

/* Defined OUTSIDE App so React doesn't recreate it on every render */
function AuthRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;           // wait — don't redirect yet
  if (user)    return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes — bounce to home if already logged in */}
      <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

      {/* Protected routes */}
      <Route path="/"             element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/hotel/:id"    element={<ProtectedRoute><HotelDetails /></ProtectedRoute>} />
      <Route path="/room/:id"     element={<ProtectedRoute><RoomDetails /></ProtectedRoute>} />
      <Route path="/my-bookings"  element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
      <Route path="/booking/:roomId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
