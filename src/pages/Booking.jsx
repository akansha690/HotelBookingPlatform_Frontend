import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { v4 as uuidv4 } from "uuid";
import Navbar from "../components/Navbar";
import { showToast } from "../components/Toast";

const AUTO_CANCEL_SECONDS = 10 * 60; // 10 minutes

export default function Booking() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkIn  = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  const [room, setRoom]         = useState(null);
  const [hotel, setHotel]       = useState(null);
  const [category, setCategory] = useState(null);
  const [guests, setGuests]     = useState(1);
  const [loading, setLoading]   = useState(false);
  const [booking, setBooking]   = useState(null);
  const [idempotencyKey]        = useState(() => uuidv4());

  // countdown state
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef    = useRef(null);
  const autoCanRef  = useRef(null);

  /* ---------- FETCH ROOM ---------- */
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await axiosInstance.get(`/hotelservice/api/v1/rooms/${roomId}`);
        const roomData = data.data;
        setRoom(roomData);
        axiosInstance.get(`/hotelservice/api/v1/hotels/${roomData.hotelId}`)
          .then(r => setHotel(r.data.data)).catch(() => {});
        axiosInstance.get(`/hotelservice/api/v1/room-categories/${roomData.roomTypeId}`)
          .then(r => setCategory(r.data.data)).catch(() => {});
      } catch {
        showToast("Failed to load room details", "error");
      }
    };
    fetchRoom();
  }, [roomId]);

  /* ---------- START COUNTDOWN after booking is created ---------- */
  useEffect(() => {
    if (!booking) return;

    setSecondsLeft(AUTO_CANCEL_SECONDS);

    // tick every second
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // auto-cancel when countdown hits 0
    autoCanRef.current = setTimeout(async () => {
      try {
        await axiosInstance.delete(
          `/bookingservice/api/v1/bookings/${booking.bookingId}`
        );
        showToast("Booking auto-cancelled — 10 minutes expired", "error");
        navigate("/");
      } catch {
        showToast("Auto-cancel failed, please cancel manually", "error");
      }
    }, AUTO_CANCEL_SECONDS * 1000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(autoCanRef.current);
    };
  }, [booking]);

  /* ---------- HELPERS ---------- */
  const nights =
    checkIn && checkOut
      ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
      : null;

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }) : "—";

  const fmtCountdown = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const countdownColor = secondsLeft !== null
    ? secondsLeft <= 60
      ? "#EF4444"   // red — last minute
      : secondsLeft <= 180
      ? "#F59E0B"   // amber — last 3 mins
      : "#10B981"   // green — plenty of time
    : "#10B981";

  /* ---------- CREATE BOOKING ---------- */
  const createBooking = async () => {
    if (!room) { showToast("Room not loaded yet", "error"); return; }
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        "/bookingservice/api/v1/bookings",
        {
          hotelId: room.hotelId,
          categoryId: room.roomTypeId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Number(guests),
        },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );
      setBooking(res.data.data);
      showToast("Booking created — confirm within 10 minutes!", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create booking", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CONFIRM BOOKING ---------- */
  const confirmBooking = async () => {
    if (!booking) { showToast("Create a booking first", "error"); return; }
    try {
      setLoading(true);
      // clear timers — user confirmed in time
      clearInterval(timerRef.current);
      clearTimeout(autoCanRef.current);

      await axiosInstance.post(
        "/bookingservice/api/v1/bookings/final",
        {},
        { headers: { "Idempotency-Key": idempotencyKey } }
      );
      showToast("Booking confirmed! Redirecting…", "success");
      setTimeout(() => navigate("/my-bookings"), 1200);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to confirm booking", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CANCEL BOOKING ---------- */
  const cancelBooking = async () => {
    if (!booking?.bookingId) { showToast("No booking to cancel", "error"); return; }
    try {
      setLoading(true);
      // clear timers — user manually cancelled
      clearInterval(timerRef.current);
      clearTimeout(autoCanRef.current);

      await axiosInstance.delete(`/bookingservice/api/v1/bookings/${booking.bookingId}`);
      showToast("Booking cancelled", "info");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to cancel booking", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- LOADING ---------- */
  if (!room) return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-violet-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-900">Complete your booking</h1>
          <p className="text-sm text-violet-400 mt-1">Review details and confirm your stay</p>
        </div>

        {/* ── COUNTDOWN TIMER (shows only after booking created) ── */}
        {booking && secondsLeft !== null && (
          <div className="mb-5 bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: countdownColor }}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Confirm before time runs out
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Booking will auto-cancel when timer hits 00:00
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums"
                  style={{ color: countdownColor }}>
                  {fmtCountdown(secondsLeft)}
                </p>
                <p className="text-xs text-gray-400">remaining</p>
              </div>
            </div>
            {/* progress bar */}
            <div className="h-1.5 bg-gray-100">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${(secondsLeft / AUTO_CANCEL_SECONDS) * 100}%`,
                  background: countdownColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden mb-5">

          <div className="bg-violet-700 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">
                {hotel?.name || `Hotel #${room.hotelId}`}
              </p>
              <p className="text-violet-300 text-xs mt-0.5">
                📍 {hotel?.location || "—"}
              </p>
            </div>
            <span className="bg-amber-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-full">
              {category?.roomType || `Cat. ${room.roomTypeId}`}
            </span>
          </div>

          <div className="px-6 py-4 divide-y divide-violet-50">
            {[
              { label: "Room number", value: `Room ${room.roomNo}` },
              { label: "Guests",      value: `${guests} guest${guests !== 1 ? "s" : ""}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-indigo-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 px-6 pb-4">
            <div className="bg-violet-50 rounded-xl px-4 py-3 border border-violet-100">
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">Check-in</p>
              <p className="text-sm font-bold text-indigo-900">{fmt(checkIn)}</p>
            </div>
            <div className="bg-violet-50 rounded-xl px-4 py-3 border border-violet-100">
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">Check-out</p>
              <p className="text-sm font-bold text-indigo-900">{fmt(checkOut)}</p>
            </div>
          </div>

          {nights && (
            <div className="px-6 pb-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5
                flex items-center justify-between">
                <span className="text-sm text-amber-700 font-medium">
                  {nights} night{nights !== 1 ? "s" : ""}
                </span>
                <span className="text-sm text-amber-800 font-bold">
                  Estimated total shown after booking
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Guest selector */}
        {!booking && (
          <div className="bg-white rounded-2xl border border-violet-100 px-6 py-5 mb-5">
            <p className="text-sm font-bold text-indigo-900 mb-3">Number of guests</p>
            <div className="flex items-center gap-4 bg-violet-50 border border-violet-100
              rounded-xl px-4 py-3 w-fit">
              <button
                onClick={() => setGuests(g => Math.max(1, g - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-violet-200 text-violet-600
                  font-bold text-lg flex items-center justify-center hover:bg-violet-100 transition"
              >−</button>
              <span className="text-xl font-bold text-indigo-900 w-8 text-center">{guests}</span>
              <button
                onClick={() => setGuests(g => g + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-violet-200 text-violet-600
                  font-bold text-lg flex items-center justify-center hover:bg-violet-100 transition"
              >+</button>
            </div>
          </div>
        )}

        {/* Booking result card */}
        {booking && (
          <div className="bg-white rounded-2xl border border-emerald-200 px-6 py-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center
                justify-center text-white text-xs font-bold">✓</span>
              <p className="text-sm font-bold text-emerald-700">Booking created successfully</p>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { label: "Booking ID", value: `#${booking.bookingId}` },
                { label: "Status",     value: booking.status },
                { label: "Amount",     value: `₹${Number(booking.bookingAmount).toLocaleString("en-IN")}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-3 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${
                    label === "Status"  ? "text-amber-600"  :
                    label === "Amount"  ? "text-violet-700" : "text-indigo-900"
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!booking ? (
          <button
            onClick={createBooking}
            disabled={loading}
            className="btn-brand w-full py-4 text-base"
          >
            {loading ? "Creating booking…" : "Create booking →"}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={confirmBooking}
              disabled={loading}
              className="btn-success flex-1 py-4 text-base rounded-xl font-bold"
            >
              {loading ? "Confirming…" : "✓ Confirm booking"}
            </button>
            <button
              onClick={cancelBooking}
              disabled={loading}
              className="btn-danger flex-1 py-4 text-base rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
