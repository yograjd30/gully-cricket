import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function Layout() {
  return (
    <div className="min-h-screen bg-pitch-black text-off-white font-inter">
      <OfflineBanner />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
