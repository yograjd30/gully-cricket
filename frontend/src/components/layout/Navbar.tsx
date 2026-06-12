import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-pitch-black/90 backdrop-blur-xl border-b border-crease-line">
      <div className="h-16 flex items-center justify-center px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-lime-shot/10 border border-lime-shot/30 flex items-center justify-center group-hover:shadow-neon-lime transition-all duration-300">
            <Zap size={20} className="text-lime-shot" />
          </div>
          <div>
            <h1 className="font-barlow font-bold text-lg text-off-white leading-none">
              Gully Cricket
            </h1>
            <p className="text-[10px] text-lime-shot font-mono tracking-widest uppercase">HQ</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
