import api from './api';

export interface Event {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  endDate: string;
  image?: string;
  organizerId: string;
  organizerName: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  targetAmount: number;
  category: string;
  endDate: string;
  image?: string;
}

export const eventService = {
  async getAllEvents() {
    const response = await api.get('/events');
    return response.data;
  },

  async getEventById(id: string) {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  async createEvent(eventData: CreateEventData) {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  async updateEvent(id: string, eventData: Partial<CreateEventData>) {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  async deleteEvent(id: string) {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  async searchEvents(query: string) {
    const response = await api.get(`/events/search?q=${query}`);
    return response.data;
  },

  async filterEvents(category: string) {
    const response = await api.get(`/events/filter?category=${category}`);
    return response.data;
  },
};
