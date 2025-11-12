import axios from 'axios';

// 🌍 Base URL (auto-uses .env if available)
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/events`
  : 'http://localhost:5000/api/events';

// 🧹 Normalize backend snake_case → frontend camelCase
const normalizeEvent = (e: any) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  targetAmount: parseFloat(e.target_amount ?? e.targetAmount ?? 0),
  currentAmount: parseFloat(e.current_amount ?? e.currentAmount ?? 0),
  category: e.category,
  image: e.image_url ?? e.image,
  status: e.status,
  startDate: e.start_date ?? e.startDate,
  endDate: e.end_date ?? e.endDate,
  createdAt: e.created_at ?? e.createdAt,
  updatedAt: e.updated_at ?? e.updatedAt,
  organizerId: e.organizer_id ?? e.organizerId,
  organizerName: e.organizer?.name || e.organizerName || 'Unknown',
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
  /**
   * 🔹 Get all events (supports search + filter by category or status)
   */
  getAllEvents: async (params?: { search?: string; status?: string; category?: string }) => {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search.trim());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);

    const url = queryParams.toString() ? `${API_URL}?${queryParams}` : API_URL;
    const response = await axios.get(url);

    return {
      ...response.data,
      data: Array.isArray(response.data.data)
        ? response.data.data.map(normalizeEvent)
        : [],
    };
  },

  /**
   * 🔹 Search events only (alternative call used for live search bar)
   */
  searchEvents: async (query: string) => {
    const response = await axios.get(`${API_URL}?search=${encodeURIComponent(query)}`);
    return {
      ...response.data,
      data: Array.isArray(response.data.data)
        ? response.data.data.map(normalizeEvent)
        : [],
    };
  },

  /**
   * 🔹 Get single event by ID
   */
  getEventById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return {
      ...response.data,
      data: normalizeEvent(response.data.data),
    };
  },

  /**
   * 🔹 Create a new event (for organizers)
   */
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

  /**
   * 🔹 Get events created by the logged-in organizer
   */
  getMyEvents: async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const response = await axios.get(`${API_URL}/my/events`, { headers });

    return {
      ...response.data,
      data: Array.isArray(response.data.data)
        ? response.data.data.map(normalizeEvent)
        : [],
    };
  },
};
