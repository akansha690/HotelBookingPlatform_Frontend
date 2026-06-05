import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { showToast } from "./Toast";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const displayName =
    user?.username || user?.name || user?.email?.split("@")[0] || null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    showToast("Logged out successfully", "info");
    navigate("/login");
  };

  return (
    <nav className="bg-violet-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">✦</span>
          <span className="text-white text-xl font-bold tracking-tight">StayEase</span>
        </Link>

        <div className="flex items-center gap-5">
          {displayName && (
            <span className="text-violet-200 text-sm hidden sm:flex items-center gap-1.5">
              Hi,{" "}
              <span className="text-white font-semibold bg-violet-600 px-2.5 py-0.5 rounded-full text-xs">
                {displayName}
              </span>
            </span>
          )}
          <Link to="/" className="text-violet-200 hover:text-white text-sm transition">
            Home
          </Link>
          <Link to="/my-bookings" className="text-violet-200 hover:text-white text-sm transition">
            My bookings
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="bg-amber-400 text-indigo-900 text-sm font-bold px-4 py-1.5 rounded-full hover:bg-amber-300 transition"
            >
              Logout
            </button>
          ) : (
            <Link to="/login">
              <button className="bg-amber-400 text-indigo-900 text-sm font-bold px-4 py-1.5 rounded-full hover:bg-amber-300 transition">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}