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
  const payload = {
    event_id: pledgeData.eventId,           // ✅ convert to snake_case
    amount: pledgeData.amount,
    is_anonymous: pledgeData.isAnonymous || false,
    message: pledgeData.message || '',
  };

  const response = await api.post('/pledges', payload);
  return response.data;
},


async getPledgesForEvent(eventId: string) {
  // ✅ Match backend’s getAllPledges route (with query parameter)
  const response = await api.get(`/pledges?event_id=${eventId}`);
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
