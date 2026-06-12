import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Crosshair, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/players', icon: Users, label: 'Players' },
  { to: '/draft', icon: Crosshair, label: 'Score' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 bg-pavilion-dark/95 backdrop-blur-xl border-t border-crease-line">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-lime-shot'
                  : 'text-muted-text hover:text-off-white'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
