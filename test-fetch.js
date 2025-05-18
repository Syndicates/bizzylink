/**
 * Simple fetch test to check if the leaderboard API is accessible
 */

const fetch = require('node-fetch');

async function testLeaderboard() {
  try {
    console.log('Attempting to fetch leaderboard data...');
    const response = await fetch('http://localhost:8080/api/leaderboard/playtime?timeFrame=all');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Leaderboard data received successfully!');
    console.log(`Found ${data.data?.players?.length || 0} players`);
    
    if (data.data?.players?.length > 0) {
      console.log('\nTop 5 players:');
      data.data.players.slice(0, 5).forEach((player, index) => {
        console.log(`${index + 1}. ${player.username} (${player.mcUsername}) - ${player.playtime || 'No playtime data'}`);
      });
    }
    
    console.log('\nFull response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
  }
}

testLeaderboard(); 