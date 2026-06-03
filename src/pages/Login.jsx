import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { showToast } from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.email.trim())         e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.password)             e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Min. 6 characters";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  // backend sends error in `error` field, not `message`
  const getErrMsg = (err) =>
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    "Something went wrong";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        "/login",
        JSON.stringify(formData),
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("token", res.data.data);
      const profile = await axiosInstance.get("/profile");
      setUser(profile.data.data);
      showToast("Welcome back!", "success");
      navigate("/");
    } catch (err) {
      const msg = getErrMsg(err);
      // map backend messages to friendly frontend messages
      if (msg.toLowerCase().includes("not been registered") ||
          msg.toLowerCase().includes("email")) {
        setErrors({ email: "No account found with this email" });
      } else if (msg.toLowerCase().includes("password") ||
                 msg.toLowerCase().includes("incorrect")) {
        setErrors({ password: "Incorrect password" });
      } else {
        showToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl">

        {/* Left panel */}
        <div className="bg-violet-700 p-10 flex flex-col justify-center">
          <span className="text-amber-400 text-2xl mb-4">✦</span>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Welcome back to StayEase
          </h1>
          <p className="text-violet-300 mt-3 text-sm leading-relaxed">
            Sign in to manage your bookings, explore top-rated hotels, and find your next perfect stay.
          </p>
          <div className="mt-8 space-y-3">
            {["Best prices guaranteed", "Instant booking confirmation", "Free cancellation"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-violet-200 text-sm">
                <span className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 mb-7">
            Don't have an account?{" "}
            <Link to="/register" className="text-violet-600 font-semibold hover:underline">
              Register
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="you@example.com"
                className={`input-field ${errors.email ? "input-error" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  ⚠ {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password" name="password" value={formData.password}
                onChange={handleChange} placeholder="Enter your password"
                className={`input-field ${errors.password ? "input-error" : ""}`}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  ⚠ {errors.password}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-brand w-full py-3 mt-2">
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
