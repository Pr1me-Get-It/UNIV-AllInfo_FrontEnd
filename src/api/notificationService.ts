import { api } from './client';

export const notificationService = {
  saveExpoToken: (expoPushToken: string) =>
    api.post('/notifications/expo-token', { expoPushToken }),

  setExpoTokenActive: (expoPushToken: string, isActive: boolean) =>
    api.patch('/notifications/expo-token', { expoPushToken, isActive }),

  getKeywords: () =>
    api.get<string[]>('/notifications/keywords'),

  addKeywords: (keywords: string[]) =>
    api.post('/notifications/keywords', { keywords }),

  deleteKeywords: (keywords: string[]) =>
    api.delete('/notifications/keywords', { data: { keywords } }),

  getSources: () =>
    api.get<string[]>('/notifications/sources'),

  addSources: (sources: string[]) =>
    api.post('/notifications/sources', { sources }),

  deleteSources: (sources: string[]) =>
    api.delete('/notifications/sources', { data: { sources } }),
};
