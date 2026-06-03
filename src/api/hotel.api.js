import axiosInstance from "./axios";

// GET all hotels (via gateway)
export const getAllHotels = async () => {
  const res = await axiosInstance.get("/hotelservice/api/v1/hotels");
  return res.data.data;
};

// GET hotel by id
export const getHotelById = async (id) => {
  const res = await axiosInstance.get(
    `/hotelservice/api/v1/hotels/${id}`
  );
  return res.data.data;
};