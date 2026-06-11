import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/players', label: 'Players' },
  { to: '/draft', label: 'New Match' },
  { to: '/history', label: 'History' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-pitch-black/90 backdrop-blur-xl border-b border-crease-line">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-lime-shot/10 border border-lime-shot/30 flex items-center justify-center group-hover:shadow-neon-lime transition-all duration-300">
            <Zap size={20} className="text-lime-shot" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-barlow font-bold text-lg text-off-white leading-none">
              Gully Cricket
            </h1>
            <p className="text-[10px] text-lime-shot font-mono tracking-widest uppercase">HQ</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === to
                  ? 'bg-lime-shot/10 text-lime-shot'
                  : 'text-muted-text hover:text-off-white hover:bg-crease-line/30'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-muted-text hover:text-off-white transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-crease-line bg-pavilion-dark/95 backdrop-blur-xl animate-slide-up">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block px-6 py-3 text-sm font-medium border-b border-crease-line/50 transition-colors',
                location.pathname === to
                  ? 'text-lime-shot bg-lime-shot/5'
                  : 'text-off-white hover:bg-crease-line/30'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
