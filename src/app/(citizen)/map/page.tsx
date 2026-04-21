'use client';

import { useSearchParams } from 'next/navigation';
import TrafficMap from '@/components/TrafficMap';
import ReportIncidentDialog from '@/components/citizen/ReportIncidentDialog';

export default function CitizenMapPage() {
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
