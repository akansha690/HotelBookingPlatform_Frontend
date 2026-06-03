import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import Navbar from "../components/Navbar";
import { showToast } from "../components/Toast";

const ROOM_IMGS = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
];

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axiosInstance.get(`/hotelservice/api/v1/hotels/${id}`),
      axiosInstance.get(`/hotelservice/api/v1/categories/${id}/roomcategories`),
      axiosInstance.get(`/hotelservice/api/v1/rooms/hotel/${id}`),
    ]).then(([h, c, r]) => {
      if (h.status === "fulfilled") setHotel(h.value.data.data);
      if (c.status === "fulfilled") setCategories(c.value.data.data);
      if (r.status === "fulfilled") setRooms(r.value.data.data);
    }).catch(() => showToast("Failed to load hotel", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered =
    selectedCategory === "All"
      ? rooms
      : rooms.filter((r) => r.roomTypeId === selectedCategory.id);

  if (loading) return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />
      <div className="h-80 bg-violet-200 animate-pulse" />
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-5">
        {[1,2,3].map(i => <div key={i} className="h-48 bg-violet-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-violet-400">Hotel not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />

      {/* Hero */}
      <div className="relative h-72 sm:h-96">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80"
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 via-violet-900/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-6 bg-white/20 backdrop-blur text-white
            text-sm px-4 py-1.5 rounded-full hover:bg-white/30 transition border border-white/20"
        >
          ← Back
        </button>
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h1 className="text-3xl sm:text-5xl font-bold drop-shadow">{hotel.name}</h1>
          <p className="mt-2 text-violet-200 flex items-center gap-1.5 text-sm">
            📍 {hotel.location} &nbsp;·&nbsp; {hotel.address}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Category chips */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4">Choose your room type</h2>
          <div className="flex gap-3 flex-wrap">
            {["All", ...categories.map(c => c)].map((cat) => {
              const isAll = cat === "All";
              const active = isAll ? selectedCategory === "All" : selectedCategory?.id === cat.id;
              return (
                <button
                  key={isAll ? "all" : cat.id}
                  onClick={() => setSelectedCategory(isAll ? "All" : cat)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                    active
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-white text-violet-600 border-violet-200 hover:border-violet-400"
                  }`}
                >
                  {isAll ? "All rooms" : cat.roomType}
                </button>
              );
            })}
          </div>
        </div>

        {/* Room count */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-indigo-900">
            {selectedCategory === "All" ? "All rooms" : `${selectedCategory.roomType} rooms`}
            <span className="ml-2 text-sm font-normal text-violet-400">
              ({filtered.length} available)
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-violet-100 p-12 text-center">
            <p className="text-violet-300 text-3xl mb-2">🛏</p>
            <p className="text-gray-400">No rooms in this category</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((room, idx) => {
              const isOccupied = !!room.bookingId;
              const catName = categories.find(c => c.id === room.roomTypeId)?.roomType;
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl overflow-hidden border border-violet-100
                    hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={ROOM_IMGS[idx % ROOM_IMGS.length]}
                      alt={`Room ${room.roomNo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 right-3 flex justify-between">
                      {catName && (
                        <span className="bg-violet-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          {catName}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ml-auto ${
                        isOccupied
                          ? "bg-red-100 text-red-600"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isOccupied ? "Occupied" : "Available"}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-bold text-indigo-900">Room {room.roomNo}</h3>
                    </div>
                    <p className="text-sm text-gray-400">Modern amenities with luxury comfort.</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-violet-600">
                          ₹{room.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-sm text-gray-400 ml-1">/ night</span>
                      </div>
                    </div>
                    <Link to={`/room/${room.id}`}>
                      <button className="btn-brand w-full mt-4">
                        View room →
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
