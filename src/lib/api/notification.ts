import { apiRequest } from '@/lib/api/client';

export interface NotificationSettingsDTO {
  id: string;
  unidade_id?: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  horas_antecedencia: number;
}

export async function getNotificationSettings(
  unidadeId?: string,
): Promise<NotificationSettingsDTO> {
  const q = unidadeId ? `?unidade_id=${encodeURIComponent(unidadeId)}` : '';
  const { data } = await apiRequest<NotificationSettingsDTO>(`/notification-settings${q}`);
  return data;
}

export async function putNotificationSettings(
  body: {
    unidade_id?: string;
    email_enabled: boolean;
    sms_enabled: boolean;
    horas_antecedencia: number;
  },
): Promise<NotificationSettingsDTO> {
  const { data } = await apiRequest<NotificationSettingsDTO>('/notification-settings', {
    method: 'PUT',
    body,
  });
  return data;
}
