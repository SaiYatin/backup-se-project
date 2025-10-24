import api from './api';

export interface Pledge {
  id: string;
  eventId: string;
  userId: string;
  userName?: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
}

export interface CreatePledgeData {
  eventId: string;
  amount: number;
  isAnonymous?: boolean;
  message?: string;
}

export const pledgeService = {
  async submitPledge(pledgeData: CreatePledgeData) {
    const response = await api.post('/pledges', pledgeData);
    return response.data;
  },

  async getPledgesForEvent(eventId: string) {
    const response = await api.get(`/pledges/event/${eventId}`);
    return response.data;
  },

  async getMyPledges() {
    const response = await api.get('/pledges/my');
    return response.data;
  },

  async getAggregatePledges(eventId: string) {
    const response = await api.get(`/pledges/aggregate/${eventId}`);
    return response.data;
  },
};
