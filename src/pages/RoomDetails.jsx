import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import Navbar from "../components/Navbar";
import { showToast } from "../components/Toast";

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axiosInstance.get(`/hotelservice/api/v1/rooms/${id}`)
      .then(res => setRoom(res.data.data))
      .catch(() => showToast("Failed to load room", "error"));
  }, [id]);

  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const e = {};
    if (!checkIn)  e.checkIn  = "Select check-in date";
    if (!checkOut) e.checkOut = "Select check-out date";
    else if (checkOut <= checkIn) e.checkOut = "Must be after check-in";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleBookNow = () => {
    if (!validate()) return;
    navigate(`/booking/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
      : null;

  if (!room) return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />
      <div className="h-64 bg-violet-200 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 sm:h-80">
        <img
          src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1400&q=80"
          alt="Room"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/70 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-6 bg-white/20 backdrop-blur text-white
            text-sm px-4 py-1.5 rounded-full hover:bg-white/30 transition border border-white/20"
        >
          ← Back
        </button>
        <div className="absolute bottom-0 left-0 p-6 flex items-end justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold text-white">Room {room.roomNo}</h1>
            <p className="text-violet-200 text-sm mt-1">Hotel #{room.hotelId}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-amber-400">
              ₹{room.price.toLocaleString("en-IN")}
            </span>
            <span className="text-violet-200 text-sm ml-1">/ night</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">

        {/* Left */}
        <div className="md:col-span-2 space-y-5">
          <div className="card">
            <h2 className="text-lg font-bold text-indigo-900 mb-3">About this room</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Experience premium comfort in this beautifully appointed room. Features include
              floor-to-ceiling windows, a king-sized bed, and stunning views. Perfect for both
              leisure and business travelers.
            </p>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-indigo-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: "📶", label: "Free WiFi" },
                { icon: "❄️", label: "Air conditioning" },
                { icon: "🛁", label: "Private bathroom" },
                { icon: "🍽️", label: "Room service" },
                { icon: "📺", label: "Smart TV" },
                { icon: "🔒", label: "In-room safe" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-violet-50 rounded-xl px-3 py-2.5">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm text-indigo-800 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — booking panel */}
        <div className="card h-fit sticky top-20 border-violet-200">
          <h3 className="text-base font-bold text-indigo-900 mb-4">Select dates</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-violet-500 mb-1.5 uppercase tracking-wide">
                Check-in
              </label>
              <input
                type="date" min={today} value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); setErrors({}); }}
                className={`input-field ${errors.checkIn ? "input-error" : ""}`}
              />
              {errors.checkIn && <p className="text-xs text-red-500 mt-1">{errors.checkIn}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-violet-500 mb-1.5 uppercase tracking-wide">
                Check-out
              </label>
              <input
                type="date" min={checkIn || today} value={checkOut}
                onChange={(e) => { setCheckOut(e.target.value); setErrors({}); }}
                className={`input-field ${errors.checkOut ? "input-error" : ""}`}
              />
              {errors.checkOut && <p className="text-xs text-red-500 mt-1">{errors.checkOut}</p>}
            </div>
          </div>

          {/* Night + price summary */}
          {nights && (
            <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3
              flex items-center justify-between">
              <span className="text-sm text-violet-600 font-medium">
                {nights} night{nights !== 1 ? "s" : ""}
              </span>
              <span className="text-base font-bold text-violet-700">
                ₹{(room.price * nights).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <button onClick={handleBookNow} className="btn-brand w-full mt-4 py-3">
            Book now →
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Availability confirmed at checkout
          </p>
        </div>

      </div>
    </div>
  );
}
