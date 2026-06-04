import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    console.log("ProtectedRoute — loading:", loading, "| user:", user);
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--page-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "4px solid #7C3AED",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite"
          }} />
          <p style={{ color: "#7C3AED", fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute — no user, redirecting to /login");
    return <Navigate to="/" replace />;
  }

  return children;
}
