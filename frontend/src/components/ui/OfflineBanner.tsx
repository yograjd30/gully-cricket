import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 w-full bg-gold-bail/90 text-pitch-black px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
      <WifiOff size={16} />
      You're offline. Scoring continues locally.
    </div>
  );
}
