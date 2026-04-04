'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';
import { useNotifications, type Notification as NotifType } from '@/hooks/useNotifications';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export function NotificationListener() {
  const { addNotification, seedNotifications, seeded } = useNotifications();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  
  // Use refs so the WebSocket listener always has the latest values
  // without needing to re-subscribe.
  const tRef = useRef(t);
  tRef.current = t;
  
  const userRef = useRef(user);
  userRef.current = user;

  // Seed notifications from API on first mount (API filters by role automatically)
  useEffect(() => {
    if (seeded || !user) return;
    const seed = async () => {
      try {
        const res = await api.get('/notifications?per_page=20');
        const notifications = res.data.data || [];

        // Determine link based on user role
        const role = user?.roles?.[0] || 'citizen';
        const linkPrefix = role === 'citizen' ? '/map' 
          : (role === 'emergency' ? '/emergency/incidents' : '/dashboard/incidents');

        const items: NotifType[] = notifications.map((notif: any) => {
          const type = notif.type === 'incident_created' ? 'incident' : 'system';
          const incidentId = notif.data?.id || notif.data?.incident_id;
          
          return {
            id: notif.id,
            title: notif.title || 'Notification',
            message: notif.message || '',
            type: type as any,
            severity: notif.data?.severity || 'medium',
            timestamp: new Date(notif.created_at),
            read: !!notif.read,
            link: role === 'citizen' ? `/map` : (incidentId ? `${linkPrefix}/${incidentId}` : linkPrefix),
          };
        });
        seedNotifications(items);
      } catch (error) {
        console.error('[NotificationListener] ❌ Error seeding:', error);
      }
    };
    seed();
  }, [seeded, seedNotifications, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: any;

    try {
      const echo = getEcho();
      channel = echo.channel('traffic');

      console.log('[NotificationListener] ✅ Subscribed to channel: traffic');

      // Exact match for Laravel's fully qualified namespace
      channel.listen('.App\\Events\\IncidentCreated', (data: any) => {
        console.log('[NotificationListener] 🔔 IncidentCreated received:', data);

        const currentT = tRef.current;
        const currentUser = userRef.current;

        // Citizens don't need operator-level incident notifications
        const role = currentUser?.roles?.[0] || '';
        if (role === 'citizen') return;
        
        const title = data.title || currentT('notifications.newIncident');
        const rawSeverity = data.severity || 'medium';
        const rawType = data.type || 'other';
        
        const translatedType = currentT(`enums.incidentType.${rawType}`);
        const translatedSeverity = currentT(`enums.incidentSeverity.${rawSeverity}`);
        
        // Determine link based on user role
        let link = `/alerts`;
        if (data.id && currentUser) {
          const roles = currentUser.roles || [];
          if (roles.includes('traffic_operator') || roles.includes('super_admin') || roles.includes('city_admin') || roles.includes('urban_planner')) {
            link = `/dashboard/incidents/${data.id}`;
          } else if (roles.includes('emergency')) {
            link = `/emergency/incidents/${data.id}`;
          }
        }

        addNotification({
          title,
          message: currentT('notifications.incidentMessage', {
            type: translatedType,
            severity: translatedSeverity,
          }),
          type: 'incident',
          severity: rawSeverity,
          link,
        });

        const toastFn = rawSeverity === 'critical' ? toast.error
          : rawSeverity === 'high' ? toast.warning
          : toast.info;

        toastFn(
          <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
            <span className="font-medium">{title}</span>
            <span className="text-sm opacity-90">
              {currentT('notifications.incidentMessage', {
                type: translatedType,
                severity: translatedSeverity,
              })}
            </span>
          </div>,
          { duration: 6000 }
        );
      });

      channel.listen('.App\\Events\\PredictionReceived', (data: any) => {
        console.log('[NotificationListener] 🧠 PredictionReceived:', data);

        const currentT = tRef.current;
        const currentUser = userRef.current;

        // Only operators/admins/planners see AI prediction notifications
        const role = currentUser?.roles?.[0] || '';
        if (role === 'citizen' || role === 'emergency') return;

        const edgeCount = data.edges?.length || 0;
        const title = currentT('notifications.newPrediction');
        const link = `/dashboard/predictions`;
        const message = edgeCount > 0
          ? currentT('notifications.predictionMessage', { edgeCount: String(edgeCount) })
          : currentT('notifications.predictionCompleted');

        addNotification({ title, message, type: 'prediction', link });

        toast.info(
          <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
            <span className="font-medium">{title}</span>
            <span className="text-sm opacity-90">{message}</span>
          </div>,
          { duration: 5000 }
        );
      });

      // Debug: listen to ALL events on channel
      channel.listenToAll((event: string, data: any) => {
        console.log(`[NotificationListener] 📡 Raw event: ${event}`, data);
      });

    } catch (err) {
      console.error('[NotificationListener] ❌ Failed to connect:', err);
    }

    return () => {
      try {
        if (channel) {
          channel.stopListening('.App\\Events\\IncidentCreated');
          channel.stopListening('.App\\Events\\PredictionReceived');
        }
        console.log('[NotificationListener] 🔌 Cleanup listeners');
      } catch {}
    };
  }, []);

  return null;
}
