import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllHotels } from "../api/hotel.api";
import Navbar from "../components/Navbar";
import { showToast } from "../components/Toast";

const IMGS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
  "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=600&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
  "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=600&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
];

export default function Home() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getAllHotels()
      .then(setHotels)
      .catch(() => showToast("Failed to load hotels", "error"))
      .finally(() => setLoading(false));
  }, []);

  const visible = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Navbar />

      {/* Hero */}
      <div className="bg-violet-700 pb-16 pt-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Find your perfect stay
          </h1>
          <p className="text-violet-300 mt-3 text-base">
            Hotels, rooms & apartments at the best prices across India
          </p>
          {/* Search bar */}
          <div className="mt-8 bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-lg max-w-lg mx-auto">
            <span className="text-violet-400 text-lg">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city or hotel name..."
              className="flex-1 outline-none text-sm text-indigo-900 placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >×</button>
            )}
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="bg-violet-700 h-8 relative">
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-violet-50"
          style={{ borderRadius: "40px 40px 0 0", background: "var(--page-bg)" }} />
      </div>

      {/* Hotels grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-indigo-900">
            {search ? `Results for "${search}"` : "Available hotels"}
          </h2>
          <span className="text-sm text-violet-500 font-medium">{visible.length} hotels</span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-violet-100 animate-pulse">
                <div className="h-48 bg-violet-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-violet-100 rounded w-3/4" />
                  <div className="h-3 bg-violet-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-violet-300 text-4xl mb-3">🏨</p>
            <p className="text-gray-400">No hotels found for "{search}"</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {visible.map((hotel, idx) => (
              <div
                key={hotel.id}
                onClick={() => navigate(`/hotel/${hotel.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-violet-100
                  hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={IMGS[idx % IMGS.length]}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {hotel.location}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-indigo-900 text-base">{hotel.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{hotel.address}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      {hotel.pricePerNight ? (
                        <>
                          <span className="text-xl font-bold text-violet-600">
                            ₹{hotel.pricePerNight.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">/ night</span>
                        </>
                      ) : (
                        <span className="text-sm text-violet-500 font-medium">View rooms →</span>
                      )}
                    </div>
                    <span className="bg-amber-400 text-indigo-900 text-xs font-bold
                      px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
