import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function Layout() {
  return (
    <div className="h-screen w-full bg-[#050505] text-off-white font-inter flex justify-center overflow-hidden">
      {/* Centered mobile viewport frame */}
      <div className="w-full max-w-[480px] h-screen bg-pitch-black border-x border-crease-line/30 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <OfflineBanner />
        <Navbar />
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
