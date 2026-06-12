import mongoose from 'mongoose';
import connectDB from './src/lib/db.js';
import Match from './src/models/Match.js';

async function test() {
  await connectDB();
  
  // Create a match in 'toss' status
  const match = await Match.create({
    teamA: {
      name: 'Team A',
      players: [new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString()]
    },
    teamB: {
      name: 'Team B',
      players: [new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString()]
    },
    totalOvers: 2,
    status: 'toss',
    innings: []
  });

  console.log('Created match:', match._id);
  console.log('teamA players:', match.teamA.players);

  // Simulate updateToss
  const winner = 'teamA';
  const decision = 'bat';

  const battingFirst = decision === 'bat' ? winner : (winner === 'teamA' ? 'teamB' : 'teamA');
  const bowlingFirst = battingFirst === 'teamA' ? 'teamB' : 'teamA';

  const battingPlayers = match[battingFirst]?.players || [];
  console.log('battingFirst:', battingFirst);
  console.log('battingPlayers found:', battingPlayers);

  match.toss = { winner, decision };
  match.innings = [
    {
      battingTeam: battingFirst,
      bowlingTeam: bowlingFirst,
      strikerId: battingPlayers[0] || null,
      nonStrikerId: battingPlayers[1] || null,
      balls: [],
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      totalOvers: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      completed: false,
    }
  ];
  match.status = 'innings1';
  await match.save();

  const fetched = await Match.findById(match._id).lean();
  console.log('Fetched innings after updateToss:', fetched.innings[0]);

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
