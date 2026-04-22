'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TrafficMap from '@/components/TrafficMap';
import ReportIncidentDialog from '@/components/citizen/ReportIncidentDialog';

function MapContent() {
  const searchParams = useSearchParams();
  const focusIncidentId = searchParams.get('incident')
    ? Number(searchParams.get('incident'))
    : undefined;

  return (
    <div className="relative w-full h-full">
      <TrafficMap isPublic={true} focusIncidentId={focusIncidentId} />

      <div className="absolute bottom-8 right-8 z-[100]">
        <ReportIncidentDialog />
      </div>
    </div>
  );
}

function MapFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100">
      <div className="text-gray-500">Loading map...</div>
    </div>
  );
}

export default function CitizenMapPage() {
  return (
    <Suspense fallback={<MapFallback />}>
      <MapContent />
    </Suspense>
  );
}
