import api from './api';
// eventService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

export const eventService = {
  createEvent: async (eventData: any) => {
    // Convert frontend camelCase → backend snake_case
    const payload = {
      title: eventData.title,
      description: eventData.description,
      target_amount: eventData.targetAmount,
      end_date: eventData.endDate,
      category: eventData.category,
      image_url: eventData.image,
    };

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    return axios.post(API_URL, payload, { headers });
  },
};


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