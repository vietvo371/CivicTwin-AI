import TrafficMap from '@/components/TrafficMap';
import ReportIncidentDialog from '@/components/citizen/ReportIncidentDialog';

export default function CitizenMapPage() {
  return (
    <div className="relative w-full h-full">
      <TrafficMap isPublic={true} />
      
      {/* Report Incident FAB as Dialog Trigger */}
      <div className="absolute bottom-8 right-8 z-[100]">
        <ReportIncidentDialog />
      </div>
    </div>
  );
}
