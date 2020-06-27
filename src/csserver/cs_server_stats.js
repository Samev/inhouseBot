const { writeConsole, fetchFile } = require("./cs_console")

const bot = require('../bot');
const vdf = require('simple-vdf');
const f = require("../tools/f");
const mmr_js = require('../game/mmr');
const { cleanOnGameEnd } = require('../game/game');

const fetchStatsFile = async (serverId, matchId = '1') => {

  // let filePath = 'cfg%2Fget5%2Fget5_matchstats_$$XXX$$.cfg';
  let filePath = 'cfg/get5/get5_matchstats_$$XXX$$.cfg';
  filePath = filePath.replace('$$XXX$$', matchId);
  return fetchFile(serverId, filePath);
}

const cleanStatsFile = () => {
  // TODO: Remove locally stored file
  // But I don't store it locally Michael, I dont have to remove it?
}

/*
+------+-------+--------+---------+-----+-----+-----------+------------+--------+----+----+----+----+-------------+--------------+
| Name | Kills | Deaths | Assists | ADR | HS% | Entry (T) | Entry (CT) | Trades | 5k | 4k | 3k | 2k | Bomb plants | Bomb defuses |
+------+-------+--------+---------+-----+-----+-----------+------------+--------+----+----+----+----+-------------+--------------+
|      |       |        |         |     |     |           |            |        |    |    |    |    |             |              |
+------+-------+--------+---------+-----+-----+-----------+------------+--------+----+----+----+----+-------------+--------------+

*/

const genSpaces = (num) => {
  return ' '.repeat(num);
}

const tableTitleArray = [
  'Name    ',
  'Kills',
  'Deaths',
  'Assists',
  'ADR',
  'HS%',
  'Ent. T',
  'Ent. CT',
  'Trades',
  '5k',
  '4k',
  '3k',
  '2k',
  'Plants',
  'Defuses',
];

const tableTitlesToString = () => {
  return tableTitleArray.join('\t') + '\n';
}

const tableTitles = () => {
  return '| ' + tableTitleArray.join(' | ') + '\n';
}

// pad column to fit in table design
const padColumn = (index, value) => {
  console.log('@padColumn', index, value);
  const columnTitle = tableTitleArray[index];
  const titleLength = columnTitle.length;
  const valueLength = value.length;
  if (valueLength < titleLength) {
    // Pad with spaces
    return ' ' + value + genSpaces(titleLength - valueLength) +  ' ';
  } else if (valueLength === titleLength) {
    return ' ' + value + ' ';
  } else {
    console.log('@padColumn LOOK INTO THIS', value, columnTitle);
    if (valueLength < titleLength + 2) {
      return value;
    } else {
      return value.substring(0, titleLength);
    }
  }
}

const shortenName = (name, maxsize = 6) => {
  if(name.length > maxsize) {
    return name.substring(0, maxsize) + '.';
  }
  return name;
}


const buildMapStatsMessage = (mapTeam) => {
  let s = '';
  let playerArrays = [];
  for (let key in mapTeam) {
    if (mapTeam.hasOwnProperty(key)) {
      let playerArray = [];
      let player = mapTeam[key];
      if (key === 'score') continue;
      const { name, kills, deaths, assists } = player;
      const adr = Math.floor(player.damage / player.roundsplayed) + ''; // + ' DPR';
      const hsPerc = ((player.headshot_kills / kills).toFixed(2) * 100) + '%';
      const { firstkill_t, firstdeath_t } = player;
      const entriesT = (parseInt(firstkill_t) || 0) + '/' + ((parseInt(firstdeath_t) || 0)); // (parseInt(firstkill_t) || 0) + 
      const { firstkill_ct, firstdeath_ct } = player;
      const entriesCT = (parseInt(firstkill_ct) || 0) + '/' + ((parseInt(firstdeath_ct) || 0)); // (parseInt(firstkill_ct) || 0) + 
      const kill5_rounds = player['5kill_rounds'] || '-';
      const kill4_rounds = player['4kill_rounds'] || '-';
      const kill3_rounds = player['3kill_rounds'] || '-';
      const kill2_rounds = player['2kill_rounds'] || '-';

      playerArray.push(shortenName(name));
      playerArray.push(kills);
      playerArray.push(deaths);
      playerArray.push(assists);
      playerArray.push(adr);
      playerArray.push(hsPerc);
      playerArray.push(entriesT);
      playerArray.push(entriesCT);
      playerArray.push(player.tradekill || '-');
      playerArray.push(kill5_rounds);
      playerArray.push(kill4_rounds);
      playerArray.push(kill3_rounds);
      playerArray.push(kill2_rounds);
      playerArray.push(player.bomb_plants || '-');
      playerArray.push(player.bomb_defuses || '-');

/*
|      |       |        |         |     |     |           |            |        |    |    |    |    |             |              |
+------+-------+--------+---------+-----+-----+-----------+------------+--------+----+----+----+----+-------------+--------------+
*/
      playerArrays.push(playerArray);
      // s += playerArray.join('\t');
    }
  }
  const sortedArrays = playerArrays.sort((a, b) => a[1] < b[1]);
  for(let i = 0; i < sortedArrays.length; i++) {
    // TODO: Create table instead
    // s += sortedArrays[i].join('\t');
    s += '|';
    s += sortedArrays[i].map((entry, index) => padColumn(index, entry)).join('|');
    s += '\n';
  }
  return s;
}

// Builds the stats string to send in discord
const buildStatsMessage = (stats) => {
  let s = '';
  const winner = stats.winner;
  const teamWonName = stats[winner + '_name'];
  s += teamWonName + ' won! ';
  for (let i = 0; i < 1; i++) {
    // Check only give results for one game
    let map = stats['map' + i];
    const scoreResult = map.team1.score + '-' + map.team2.score;
    s += scoreResult + '\n';
    if (map) {
      s += stats.team1_name + ':\n';
      s += tableTitles();
      s += buildMapStatsMessage(map.team1);
      s += stats.team2_name + ':\n';
      s += tableTitles();
      s += buildMapStatsMessage(map.team2);
    }
  }
  return '```' + s + '```';
}

// Send stats message to discord in the correct channel
const sendStatsDiscord = (gameObject, statsMessage) => {
  // Sends in channel
  bot.printMessage(statsMessage, gameObject.getChannelMessage(), (message) => {
		f.deleteDiscMessage(message, 600000, 'statsresultsgame');
  });
  // TODO Send in game results chat which do not clear
}

const setResults = (gameObject, stats) => {
  const winnerTeam = stats.map0.winner;
  const winner = winnerTeam === 'team1' ? 1 : (winnerTeam === 'team2' ? 2 : '');
  if (winner !== '') {
    console.log('@getGameStatsDiscord Winning team:', winnerTeam);
    mmr_js.updateMMR(winner, gameObject, (message) => {
      console.log('DEBUG @callbackGameFinished - Calls on exit after delete on this message');
      f.deleteDiscMessage(message, removeBotMessageDefaultTime * 4, 'gameFinished');
      cleanOnGameEnd(gameObject);
    });
  }
}

const getGameStatsDiscord = (gameObject, stats) => {
  // Check which team that won and update MMR accordingly
  // setResults(gameObject, stats);

  const discordMessage = buildStatsMessage(stats);
  sendStatsDiscord(gameObject, discordMessage);
  // Visualize stats in discord message
}

const getGameStats = async (serverId, gameObject) => {
  // writeConsole(serverId, 'get5_dumpstats');

  // Get match id
  let matchId = '1'; // TODO: Fix
  const statsFile = await fetchStatsFile(serverId, matchId);
  console.log('@getGameStats Raw:', statsFile);
  const data = vdf.parse(statsFile.data);
  console.log(data);
  console.log(data.Stats.map0);
  getGameStatsDiscord(gameObject, data.Stats);

  cleanStatsFile();
}

class PlayerStats {
  // TODO: Should we initialize this data?

  constructor(playerStatsObject) {

  }
}

module.exports = {
  getGameStats : getGameStats,
}