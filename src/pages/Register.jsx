import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import { showToast } from "../components/Toast";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.username.trim())
      e.username = "Username is required";
    else if (formData.username.trim().length < 3)
      e.username = "Min. 3 characters";

    if (!formData.email.trim())
      e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Enter a valid email";

    if (!formData.password)
      e.password = "Password is required";
    else if (formData.password.length < 6)
      e.password = "Min. 6 characters";

    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const getErrMsg = (err) =>
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    "Something went wrong";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await axiosInstance.post("/register", {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      showToast("Account created! Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      const msg = getErrMsg(err);
      if (msg.toLowerCase().includes("email") ||
          msg.toLowerCase().includes("already")) {
        setErrors({ email: "An account with this email already exists" });
      } else if (msg.toLowerCase().includes("username")) {
        setErrors({ username: "Username already taken" });
      } else {
        showToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "username", label: "Username", type: "text",     placeholder: "johndoe" },
    { name: "email",    label: "Email",    type: "email",    placeholder: "you@example.com" },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
  ];

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl">

        {/* Left panel */}
        <div className="bg-violet-700 p-10 flex flex-col justify-center">
          <span className="text-amber-400 text-2xl mb-4">✦</span>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Join StayEase today
          </h1>
          <p className="text-violet-300 mt-3 text-sm leading-relaxed">
            Create your free account and start exploring hundreds of hotels across India.
          </p>
          <div className="mt-8 space-y-3">
            {["Instant booking confirmation", "Manage all your trips", "Exclusive member deals"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-violet-200 text-sm">
                <span className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-1">Create account</h2>
          <p className="text-sm text-gray-400 mb-7">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {fields.map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type={type} name={name} value={formData[name]}
                  onChange={handleChange} placeholder={placeholder}
                  className={`input-field ${errors[name] ? "input-error" : ""}`}
                />
                {errors[name] && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    ⚠ {errors[name]}
                  </p>
                )}
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-brand w-full py-3 mt-2">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
