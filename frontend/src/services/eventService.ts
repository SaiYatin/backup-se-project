import axios from 'axios';

// 🌍 API base URL (change VITE_API_URL in .env if needed)
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/events`
  : 'http://localhost:5000/api/events';

// 🔄 Helper function to convert backend snake_case → frontend camelCase
const normalizeEvent = (e: any) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  targetAmount: parseFloat(e.target_amount),
  currentAmount: parseFloat(e.current_amount),
  category: e.category,
  image: e.image_url,
  status: e.status,
  startDate: e.start_date,
  endDate: e.end_date,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
  organizerId: e.organizer_id,
  organizerName: e.organizer?.name || 'Unknown',
});

// 🧩 Type definitions
export interface Event {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  endDate: string;
  startDate?: string;
  image?: string;
  organizerId: string;
  organizerName: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  targetAmount: number;
  category: string;
  endDate: string;
  image?: string;
}

// 🧠 All event-related API functions
export const eventService = {
  // 🔹 Get all events (for Browse page)
  getAllEvents: async (params?: { search?: string; status?: string; category?: string }) => {
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.category) queryParams.append('category', params.category);

  const url = queryParams.toString() ? `${API_URL}?${queryParams}` : API_URL;
  const response = await axios.get(url);

  return {
    ...response.data,
    data: response.data.data.map(normalizeEvent),
  };
},


  // 🔹 Search events (optional, used for search bar)
  searchEvents: async (query: string) => {
    const response = await axios.get(`${API_URL}?search=${encodeURIComponent(query)}`);
    return {
      ...response.data,
      data: response.data.data.map(normalizeEvent),
    };
  },

  // 🔹 Get single event by ID
  getEventById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return {
      ...response.data,
      data: normalizeEvent(response.data.data),
    };
  },

  // 🔹 Create a new event (organizer only)
  createEvent: async (eventData: CreateEventData) => {
    const payload = {
      title: eventData.title,
      description: eventData.description,
      target_amount: eventData.targetAmount,
      end_date: eventData.endDate,
      category: eventData.category,
      image_url: eventData.image,
    };

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    return axios.post(API_URL, payload, { headers });
  },

  // 🔹 Get events created by logged-in organizer
  getMyEvents: async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${API_URL}/my/events`, { headers });
    return {
      ...response.data,
      data: response.data.data.map(normalizeEvent),
    };
  },
};
