import mongoose from 'mongoose';

const ballSchema = new mongoose.Schema({
  overNumber: { type: Number, required: true },
  ballNumber: { type: Number, required: true },
  batsmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  bowlerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  runs: { type: Number, default: 0 },
  extras: {
    type: {
      type: String,
      enum: ['none', 'offside_wide', 'legside_wide', 'no_ball', 'bye', 'leg_bye'],
      default: 'none',
    },
    runs: { type: Number, default: 0 },
  },
  isWicket: { type: Boolean, default: false },
  wicket: {
    type: {
      type: String,
      enum: ['bowled', 'caught', 'run_out', 'hit_wicket', 'boundary_out', 'retired'],
    },
    dismissedPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    fielderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  },
  commentary: { type: String, default: '' },
  isLegal: { type: Boolean, default: true },
  isUndone: { type: Boolean, default: false },
}, { _id: true });

const inningsSchema = new mongoose.Schema({
  battingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
  bowlingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
  balls: [ballSchema],
  totalRuns: { type: Number, default: 0 },
  totalWickets: { type: Number, default: 0 },
  totalBalls: { type: Number, default: 0 }, // legal balls only
  totalOvers: { type: Number, default: 0 },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
  },
  completed: { type: Boolean, default: false },
  result: { type: String, default: '' },
}, { _id: true });

const matchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionToken: { type: String, index: true }, // for guest matches

  // Setup
  teamA: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    name: { type: String, required: true },
    color: { type: String, default: '#A3E635' },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  },
  teamB: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    name: { type: String, required: true },
    color: { type: String, default: '#38BDF8' },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  },
  totalOvers: { type: Number, required: true, min: 1 },
  venue: { type: String, default: '' },
  matchDate: { type: Date, default: Date.now },

  // Rules config
  rules: {
    offsideWide: {
      runs: { type: Number, default: 0 },
      rebowl: { type: Boolean, default: true },
    },
    legsideWide: {
      runs: { type: Number, default: 1 },
      rebowl: { type: Boolean, default: true },
    },
    boundaryOut: { type: Boolean, default: true },
    noBall: {
      runs: { type: Number, default: 1 },
      freehit: { type: Boolean, default: false },
    },
    maxBoundaryOuts: { type: Number, default: null },
  },

  // Toss
  toss: {
    winner: { type: String, enum: ['teamA', 'teamB'] },
    decision: { type: String, enum: ['bat', 'field'] },
  },

  // Innings
  innings: [inningsSchema],

  // Match status
  status: {
    type: String,
    enum: ['setup', 'toss', 'innings1', 'innings2', 'completed'],
    default: 'setup',
  },

  // Result
  result: {
    winner: { type: String, enum: ['teamA', 'teamB', 'tie', 'no_result'] },
    margin: { type: String, default: '' },
    playerOfMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    summary: { type: String, default: '' },
  },
}, { timestamps: true });

matchSchema.index({ userId: 1, createdAt: -1 });
matchSchema.index({ status: 1 });

export default mongoose.model('Match', matchSchema);
