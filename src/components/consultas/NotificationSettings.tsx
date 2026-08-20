import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useConsultas } from '@/hooks/useConsultas';
export const NotificationSettings = () => {
  const { notificationSettings, updateNotificationSettings, requestNotificationPermission } = useConsultas();

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificações
        </CardTitle>
        <CardDescription>
          Configure lembretes automáticos para consultas agendadas. E-mail e SMS dependem do
          provedor configurado pela clínica; notificações do navegador estão disponíveis agora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="browser-notifications">Notificações do Navegador</Label>
            </div>
            <Button onClick={handleEnableNotifications} variant="outline" size="sm">
              Ativar
            </Button>
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications">Notificações por Email</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationSettings.emailEnabled}
              onCheckedChange={(checked) =>
                updateNotificationSettings({
                  ...notificationSettings,
                  emailEnabled: checked,
                })
              }
              disabled
            />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-notifications">Notificações por SMS</Label>
            </div>
            <Switch
              id="sms-notifications"
              checked={notificationSettings.smsEnabled}
              onCheckedChange={(checked) =>
                updateNotificationSettings({
                  ...notificationSettings,
                  smsEnabled: checked,
                })
              }
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="antecedencia">Enviar lembrete com antecedência (horas)</Label>
          <Input
            id="antecedencia"
            type="number"
            min="1"
            max="168"
            value={notificationSettings.horasAntecedencia}
            onChange={(e) =>
              updateNotificationSettings({
                ...notificationSettings,
                horasAntecedencia: parseInt(e.target.value) || 24,
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
