'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';

/**
 * Hook to subscribe to a Laravel Echo channel and listen for events.
 * Automatically subscribes on mount and cleans up on unmount.
 *
 * @param channel - Channel name (e.g., 'traffic')
 * @param event - Event class name (e.g., 'IncidentCreated')
 * @param callback - Function called with event data
 * @param enabled - Optional flag to enable/disable listening
 *
 * @example
 * useEcho('traffic', 'IncidentCreated', (data) => {
 *   console.log('New incident:', data);
 *   setIncidents(prev => [data, ...prev]);
 * });
 */
export function useEcho<T = any>(
  channel: string,
  event: string,
  callback: (data: T) => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let echoChannel: any;

    try {
      const echo = getEcho();
      echoChannel = echo.channel(channel);

      // Laravel broadcasts events with the class name prefix
      // e.g., '.IncidentCreated' or 'App\\Events\\IncidentCreated'
      echoChannel.listen(`.${event}`, (data: T) => {
        callbackRef.current(data);
      });
    } catch (err) {
      console.warn(`[useEcho] Failed to connect to channel "${channel}":`, err);
    }

    return () => {
      try {
        if (echoChannel) {
          echoChannel.stopListening(`.${event}`);
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [channel, event, enabled]);
}

/**
 * Hook to subscribe to multiple events on the same channel.
 *
 * @example
 * useEchoMulti('traffic', {
 *   IncidentCreated: (data) => addIncident(data),
 *   EdgeMetricsUpdated: (data) => updateEdge(data),
 *   PredictionReceived: (data) => addPrediction(data),
 * });
 */
export function useEchoMulti(
  channel: string,
  events: Record<string, (data: any) => void>,
  enabled: boolean = true
) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let echoChannel: any;
    const eventNames = Object.keys(eventsRef.current);

    try {
      const echo = getEcho();
      echoChannel = echo.channel(channel);

      eventNames.forEach((eventName) => {
        echoChannel.listen(`.${eventName}`, (data: any) => {
          eventsRef.current[eventName]?.(data);
        });
      });
    } catch (err) {
      console.warn(`[useEchoMulti] Failed to connect to channel "${channel}":`, err);
    }

    return () => {
      try {
        if (echoChannel) {
          eventNames.forEach((eventName) => {
            echoChannel.stopListening(`.${eventName}`);
          });
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [channel, enabled]);
}
