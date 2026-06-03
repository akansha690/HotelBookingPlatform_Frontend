import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import Navbar from "../components/Navbar";
import { showToast } from "../components/Toast";

const FILTERS = ["All", "BOOKED", "PENDING", "CANCELLED"];
const AUTO_CANCEL_SECONDS = 10 * 60;

// ── Countdown hook for a single booking ──
function useCountdown(createdAt) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!createdAt) return;
    const created = new Date(createdAt).getTime();
    const deadline = created + AUTO_CANCEL_SECONDS * 1000;

    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  return secondsLeft;
}

// ── Per-card countdown display ──
function CountdownBadge({ createdAt }) {
  const s = useCountdown(createdAt);
  if (s === null) return null;

  const m   = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  const color = s <= 60 ? "#EF4444" : s <= 180 ? "#F59E0B" : "#10B981";

  if (s === 0) return (
    <div className="mt-2 text-xs text-red-500 font-semibold">
      ⏰ Expired — will be auto-cancelled shortly
    </div>
  );

  return (
    <div className="mt-2 rounded-xl overflow-hidden border"
      style={{ borderColor: color }}>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          ⚠ Confirm before auto-cancel
        </span>
        <span className="text-base font-bold tabular-nums" style={{ color }}>
          {m}:{sec}
        </span>
      </div>
      <div className="h-1 bg-gray-100">
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${(s / AUTO_CANCEL_SECONDS) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

// ── Confirm modal for pending bookings ──
function ConfirmModal({ booking, onClose, onConfirmed, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const s = useCountdown(booking.createdAt);

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }) : "—";

  const confirmBooking = async () => {
    try {
      setLoading(true);
      // idempotency key was stored when booking was created
      // for confirmation we use the booking's own idempotencyKey from DB
      await axiosInstance.post(
        "/bookingservice/api/v1/bookings/final",
        {},
        { headers: { "Idempotency-Key": booking.idempotencyKey } }
      );
      showToast("Booking confirmed!", "success");
      onConfirmed();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to confirm", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {
    try {
      setLoading(true);
      await axiosInstance.delete(
        `/bookingservice/api/v1/bookings/${booking.id}`
      );
      showToast("Booking cancelled", "info");
      onCancelled();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to cancel", "error");
    } finally {
      setLoading(false);
    }
  };

  const color = s !== null
    ? s <= 60 ? "#EF4444" : s <= 180 ? "#F59E0B" : "#10B981"
    : "#10B981";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(30,27,74,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-violet-700 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">Confirm your booking</p>
            <p className="text-violet-300 text-xs mt-0.5">Booking #{booking.id}</p>
          </div>
          <button onClick={onClose}
            className="text-violet-300 hover:text-white text-2xl leading-none transition">
            ×
          </button>
        </div>

        {/* Countdown */}
        {s !== null && s > 0 && (
          <div className="mx-5 mt-4 rounded-xl overflow-hidden border"
            style={{ borderColor: color }}>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color }}>
                Time remaining to confirm
              </span>
              <span className="text-2xl font-bold tabular-nums" style={{ color }}>
                {Math.floor(s / 60).toString().padStart(2, "0")}:
                {(s % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100">
              <div className="h-full transition-all duration-1000"
                style={{
                  width: `${(s / AUTO_CANCEL_SECONDS) * 100}%`,
                  background: color,
                }} />
            </div>
          </div>
        )}

        {s === 0 && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3
            text-sm text-red-600 font-medium">
            ⏰ Timer expired — this booking will be auto-cancelled
          </div>
        )}

        {/* Details */}
        <div className="px-5 py-4 space-y-2">
          {[
            { label: "Hotel",     value: `Hotel #${booking.hotelId}` },
            { label: "Category",  value: `Cat. ${booking.categoryId}` },
            { label: "Guests",    value: booking.numberOfGuests },
            { label: "Check-in",  value: fmt(booking.checkInDate) },
            { label: "Check-out", value: fmt(booking.checkOutDate) },
            { label: "Amount",    value: `₹${Number(booking.bookingAmount || 0).toLocaleString("en-IN")}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-violet-50 text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="font-semibold text-indigo-900">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-3">
          <button
            onClick={confirmBooking}
            disabled={loading || s === 0}
            className="btn-success flex-1 py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? "Confirming…" : "✓ Confirm booking"}
          </button>
          <button
            onClick={cancelBooking}
            disabled={loading}
            className="btn-danger flex-1 py-3 rounded-xl font-bold"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [confirmBooking, setConfirmBooking] = useState(null); // booking to confirm

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axiosInstance.get("/bookingservice/api/v1/bookings/my-bookings");
      setBookings(res.data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to fetch bookings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => fetchBookings(true), 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setCancellingId(bookingId);
      await axiosInstance.delete(`/bookingservice/api/v1/bookings/${bookingId}`);
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: "CANCELLED" } : b
      ));
      showToast("Booking cancelled", "info");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to cancel", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }) : "—";

  const nights = (a, b) => {
    if (!a || !b) return null;
    const d = Math.round((new Date(b) - new Date(a)) / 86400000);
    return d > 0 ? d : null;
  };

  const badgeCls = {
    BOOKED:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
  };
  const dotCls = {
    BOOKED:    "bg-emerald-500",
    PENDING:   "bg-amber-400",
    CANCELLED: "bg-red-400",
  };

  const totalSpent = bookings
    .filter(b => b.status !== "CANCELLED")
    .reduce((s, b) => s + (b.bookingAmount || 0), 0);
  const confirmed = bookings.filter(b => b.status === "BOOKED").length;
  const pending   = bookings.filter(b => b.status === "PENDING").length;
  const visible   = activeFilter === "All"
    ? bookings
    : bookings.filter(b => b.status === activeFilter);

  if (loading) return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-violet-100 h-36 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />

      {/* Confirm modal */}
      {confirmBooking && (
        <ConfirmModal
          booking={confirmBooking}
          onClose={() => setConfirmBooking(null)}
          onConfirmed={() => {
            setBookings(prev => prev.map(b =>
              b.id === confirmBooking.id ? { ...b, status: "BOOKED" } : b
            ));
            setConfirmBooking(null);
          }}
          onCancelled={() => {
            setBookings(prev => prev.map(b =>
              b.id === confirmBooking.id ? { ...b, status: "CANCELLED" } : b
            ));
            setConfirmBooking(null);
          }}
        />
      )}

      {/* Page header */}
      <div className="bg-violet-700 pt-10 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">My bookings</h1>
              <p className="text-violet-300 text-sm mt-1">
                {bookings.length} total reservation{bookings.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => fetchBookings()}
              className="bg-violet-600/50 border border-violet-500 text-violet-200
                text-xs px-3 py-1.5 rounded-full hover:bg-violet-600 transition"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Total spent", value: `₹${totalSpent.toLocaleString("en-IN")}` },
              { label: "Confirmed",   value: confirmed },
              { label: "Pending",     value: pending },
            ].map(({ label, value }) => (
              <div key={label} className="bg-violet-600/50 rounded-xl px-4 py-3 border border-violet-500">
                <p className="text-xs text-violet-300 mb-1">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="bg-violet-700 h-8 relative">
        <div className="absolute bottom-0 left-0 right-0 h-8"
          style={{ borderRadius: "40px 40px 0 0", background: "var(--page-bg)" }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`text-xs px-4 py-1.5 rounded-full border font-semibold transition-all ${
                activeFilter === f
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-violet-600 border-violet-200 hover:border-violet-400"
              }`}>
              {f === "All"
                ? `All (${bookings.length})`
                : `${f.charAt(0) + f.slice(1).toLowerCase()} (${bookings.filter(b => b.status === f).length})`
              }
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <span className="text-5xl">🏨</span>
            <p className="text-indigo-900 font-semibold text-lg">No bookings yet</p>
            <p className="text-gray-400 text-sm">Start exploring hotels to make your first booking</p>
            <button onClick={() => navigate("/")} className="btn-brand px-8 py-3 mt-2">
              Browse hotels →
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-sm text-violet-300 py-12">
            No {activeFilter.toLowerCase()} bookings.
          </p>
        ) : (
          <div>
            {visible.map((booking, idx) => {
              const n = nights(booking.checkInDate, booking.checkOutDate);
              const isCancelled = booking.status === "CANCELLED";
              const isPending   = booking.status === "PENDING";
              const isLast      = idx === visible.length - 1;

              return (
                <div key={booking.id} className="flex gap-3">
                  {/* Rail */}
                  <div className="flex flex-col items-center w-8 pt-2 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotCls[booking.status] || "bg-gray-300"}`} />
                    {!isLast && <div className="w-0.5 flex-1 bg-violet-100 my-1.5" />}
                  </div>

                  {/* Card */}
                  <div className={`flex-1 bg-white rounded-2xl border border-violet-100
                    overflow-hidden mb-5 ${isCancelled ? "opacity-60" : ""}`}>

                    <div className="h-1" style={{
                      background: booking.status === "BOOKED" ? "#10B981"
                        : booking.status === "PENDING" ? "#F59E0B" : "#EF4444"
                    }} />

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-indigo-900">
                            Hotel #{booking.hotelId}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Booking #{booking.id} · Cat. {booking.categoryId}
                            {booking.numberOfGuests
                              ? ` · ${booking.numberOfGuests} guest${booking.numberOfGuests !== 1 ? "s" : ""}`
                              : ""}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                          badgeCls[booking.status] || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                        </span>
                      </div>

                      {/* Countdown for pending bookings */}
                      {isPending && (
                        <CountdownBadge createdAt={booking.createdAt} />
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                        <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Check-in</p>
                          <p className="text-sm font-bold text-indigo-900 mt-0.5">{fmt(booking.checkInDate)}</p>
                        </div>
                        <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Check-out</p>
                          <p className="text-sm font-bold text-indigo-900 mt-0.5">{fmt(booking.checkOutDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-violet-50">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-violet-700">
                            {booking.bookingAmount != null
                              ? `₹${Number(booking.bookingAmount).toLocaleString("en-IN")}`
                              : "—"}
                          </span>
                          {n && <span className="text-xs text-gray-400">· {n} night{n !== 1 ? "s" : ""}</span>}
                        </div>

                        <div className="flex gap-2">
                          {isPending && (
                            <button
                              onClick={() => setConfirmBooking(booking)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200
                                text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold transition"
                            >
                              Confirm →
                            </button>
                          )}
                          {!isCancelled && !isPending && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200
                                text-red-600 bg-red-50 hover:bg-red-100 font-semibold transition disabled:opacity-50"
                            >
                              {cancellingId === booking.id ? "…" : "Cancel"}
                            </button>
                          )}
                          {isPending && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200
                                text-red-600 bg-red-50 hover:bg-red-100 font-semibold transition disabled:opacity-50"
                            >
                              {cancellingId === booking.id ? "…" : "Cancel"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-2">
          <button onClick={() => navigate("/")}
            className="text-sm text-violet-500 hover:text-violet-700 font-medium transition">
            ← Browse more hotels
          </button>
        </div>
      </div>
    </div>
  );
}
