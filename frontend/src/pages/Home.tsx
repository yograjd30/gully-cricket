import { Link } from 'react-router-dom';
import { Zap, Users, Trophy, BarChart3, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Users,
    title: 'Player Pool',
    desc: 'Build your squad roster with stats that persist forever.',
    color: 'text-lime-shot',
    glow: 'shadow-neon-lime',
  },
  {
    icon: Zap,
    title: 'Live Scoring',
    desc: 'Ball-by-ball with gully rules — offside wide, boundary out & more.',
    color: 'text-sky-six',
    glow: 'shadow-neon-blue',
  },
  {
    icon: Trophy,
    title: 'Match History',
    desc: 'Full scorecards, AI commentary, and player of the match.',
    color: 'text-gold-bail',
    glow: 'shadow-neon-gold',
  },
  {
    icon: BarChart3,
    title: 'Career Stats',
    desc: 'Batting averages, bowling figures, and leaderboards.',
    color: 'text-wicket-red',
    glow: 'shadow-neon-red',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function Home() {
  return (
    <div className="space-y-16 py-4">
      {/* ─── Hero Section ─────────────────────────────── */}
      <section className="relative text-center py-16 md:py-24">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-shot/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-sky-six/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          className="relative z-10 space-y-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-shot/10 border border-lime-shot/20 text-lime-shot text-xs font-mono tracking-wider uppercase">
            <Sparkles size={14} />
            AI-Powered Commentary
          </div>

          {/* Title */}
          <h1 className="font-barlow font-black text-5xl md:text-7xl lg:text-8xl tracking-tight">
            <span className="text-off-white">GULLY</span>
            <br />
            <span className="text-gradient-lime">CRICKET HQ</span>
          </h1>

          {/* Tagline */}
          <p className="text-muted-text text-lg md:text-xl font-inter max-w-md mx-auto">
            Your Pitch. Your Rules. Your Records.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              to="/draft"
              className="gully-btn-primary text-lg px-8 py-4 rounded-2xl group"
            >
              Start New Match
              <ChevronRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              to="/players"
              className="gully-btn-ghost text-base px-6 py-3 rounded-2xl"
            >
              Manage Squad
            </Link>
          </div>
        </motion.div>

        {/* Animated cricket ball */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="text-5xl opacity-30">🏏</div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────── */}
      <motion.section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {[
          { label: 'Gully Rules', value: '5+', sub: 'Custom rules engine' },
          { label: 'Ball Types', value: '10+', sub: 'Including boundaries' },
          { label: 'AI Commentary', value: 'Live', sub: 'Per delivery' },
          { label: 'Offline', value: 'Yes', sub: 'Score anywhere' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            className="gully-card text-center"
          >
            <div className="font-barlow font-black text-3xl text-lime-shot">{stat.value}</div>
            <div className="font-semibold text-off-white text-sm mt-1">{stat.label}</div>
            <div className="text-muted-text text-xs mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* ─── Features Grid ────────────────────────────── */}
      <section>
        <motion.h2
          className="font-barlow font-bold text-3xl md:text-4xl text-off-white text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Everything Your Gully Needs
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                className="gully-card group cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-pavilion-dark border border-crease-line flex items-center justify-center ${feature.color} group-hover:${feature.glow} transition-all duration-300`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-barlow font-bold text-xl text-off-white">
                      {feature.title}
                    </h3>
                    <p className="text-muted-text text-sm mt-1">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ─── Gully Rules Preview ──────────────────────── */}
      <section className="gully-card p-8 text-center space-y-6">
        <h2 className="font-barlow font-bold text-2xl md:text-3xl text-off-white">
          Built for <span className="text-gradient-lime">Real</span> Gully Rules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-pitch-black/50 rounded-xl p-4 border border-crease-line/50">
            <div className="text-lg font-bold text-gold-bail mb-1">Offside Wide</div>
            <div className="text-muted-text">0 runs, re-bowl. No free hit nonsense.</div>
          </div>
          <div className="bg-pitch-black/50 rounded-xl p-4 border border-crease-line/50">
            <div className="text-lg font-bold text-sky-six mb-1">Legside Wide</div>
            <div className="text-muted-text">1 run penalty to batting side, re-bowl.</div>
          </div>
          <div className="bg-pitch-black/50 rounded-xl p-4 border border-crease-line/50">
            <div className="text-lg font-bold text-wicket-red mb-1">Boundary Out</div>
            <div className="text-muted-text">Hit a six? You're OUT. Gully classic.</div>
          </div>
        </div>
        <Link
          to="/draft"
          className="inline-flex gully-btn-primary rounded-xl text-base"
        >
          Try It Now
        </Link>
      </section>
    </div>
  );
}
