'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';
import { useNotifications, type Notification as NotifType } from '@/hooks/useNotifications';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const isDev = process.env.NODE_ENV === 'development';

/** Unified role check - returns the appropriate link prefix based on user roles */
function getRoleLink(roles: string[], incidentId?: string | number): string {
  if (!incidentId) return '/alerts';

  const roleSet = new Set(roles);

  if (
    roleSet.has('traffic_operator') ||
    roleSet.has('super_admin') ||
    roleSet.has('city_admin') ||
    roleSet.has('urban_planner')
  ) {
    return `/dashboard/incidents/${incidentId}`;
  }

  if (roleSet.has('emergency')) {
    return `/emergency/incidents/${incidentId}`;
  }

  return '/map';
}

/** Check if user has a specific role */
function hasRole(roles: string[], ...roleNames: string[]): boolean {
  return roleNames.some(role => roles.includes(role));
}

export function NotificationListener() {
  const { addNotification, seedNotifications, seeded } = useNotifications();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const tRef = useRef(t);
  tRef.current = t;

  const userRef = useRef(user);
  userRef.current = user;

  const subscribedRef = useRef(false);

  // Seed notifications from API on first mount (API filters by role automatically)
  useEffect(() => {
    if (seeded || !user) return;
    const seed = async () => {
      try {
        const res = await api.get('/notifications?per_page=20');
        const notifications = res.data.data || [];

        const roles = user.roles || [];

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
            link: getRoleLink(roles, incidentId),
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
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    let channel: any;

    try {
      const echo = getEcho();
      channel = echo.channel('traffic');

      if (isDev) {
        console.log('[NotificationListener] ✅ Subscribed to channel: traffic');
      }

      channel.listen('.IncidentCreated', (data: any) => {
        if (isDev) {
          console.log('[NotificationListener] 🔔 IncidentCreated received:', data);
        }

        const currentT = tRef.current;
        const currentUser = userRef.current;

        const title = data.title || currentT('notifications.newIncident');
        const rawSeverity = data.severity || 'medium';
        const rawType = data.type || 'other';

        const translatedType = currentT(`enums.incidentType.${rawType}`);
        const translatedSeverity = currentT(`enums.incidentSeverity.${rawSeverity}`);

        const roles = currentUser?.roles || [];
        const link = getRoleLink(roles, data.id);

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

        // Citizens only see toast for high/critical severity nearby alerts
        if (hasRole(roles, 'citizen') && rawSeverity !== 'critical' && rawSeverity !== 'high') return;

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

      channel.listen('.PredictionReceived', (data: any) => {
        if (isDev) {
          console.log('[NotificationListener] 🧠 PredictionReceived:', data);
        }

        const currentT = tRef.current;
        const currentUser = userRef.current;

        const roles = currentUser?.roles || [];
        // Only operators/admins/planners see AI prediction notifications
        if (hasRole(roles, 'citizen', 'emergency')) return;

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

      channel.listen('.RecommendationGenerated', (data: any) => {
        if (isDev) {
          console.log('[NotificationListener] ✅ RecommendationGenerated:', data);
        }

        const currentT = tRef.current;
        const currentUser = userRef.current;
        const roles = currentUser?.roles || [];

        if (data.action === 'approved') {
          // Operators/admins see approval confirmation
          if (hasRole(roles, 'traffic_operator', 'city_admin', 'super_admin', 'urban_planner')) {
            const title = currentT('notifications.recommendationApproved') || 'Recommendation Approved';
            const message = data.description || currentT('notifications.recommendationApprovedMessage') || 'A traffic recommendation has been approved';
            const link = `/dashboard/recommendations`;

            addNotification({ title, message, type: 'system', link });

            toast.success(
              <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
                <span className="font-medium">{title}</span>
                <span className="text-sm opacity-90">{message}</span>
              </div>,
              { duration: 6000 }
            );
          }

          // Citizens see advisory toast
          if (hasRole(roles, 'citizen')) {
            const title = currentT('citizen.trafficAdvisory') || 'Traffic Advisory';
            const message = data.description || currentT('citizen.trafficAdvisoryDesc') || 'A traffic recommendation has been approved. Check your route.';
            const link = `/alerts`;

            addNotification({ title, message, type: 'system', link });

            toast.warning(
              <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
                <span className="font-medium">{title}</span>
                <span className="text-sm opacity-90">{message}</span>
              </div>,
              { duration: 7000 }
            );
          }

          // Emergency users see critical route alert
          if (hasRole(roles, 'emergency')) {
            const title = currentT('notifications.priorityRouteUpdated') || 'Priority Route Updated';
            const message = data.description || currentT('notifications.newRouteAvailable') || 'A new priority route is available';
            const link = `/emergency/priority-route`;

            addNotification({ title, message, type: 'incident', severity: 'high', link });

            toast.warning(
              <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
                <span className="font-medium">{title}</span>
                <span className="text-sm opacity-90">{message}</span>
              </div>,
              { duration: 8000 }
            );
          }
        }
      });

    } catch (err) {
      console.error('[NotificationListener] ❌ Failed to connect:', err);
      subscribedRef.current = false;
    }

    return () => {
      if (channel) {
        try {
          channel.stopListening('.IncidentCreated');
          channel.stopListening('.PredictionReceived');
          channel.stopListening('.RecommendationGenerated');
          channel.leave();
        } catch (err) {
          console.warn('[NotificationListener] ⚠️ Cleanup error:', err);
        }
      }
      if (isDev) {
        console.log('[NotificationListener] 🔌 Cleanup complete');
      }
    };
  }, []);

  return null;
}
