const { writeConsole, fetchFile } = require("./cs_console")

const bot = require('../bot');
const vdf = require('simple-vdf');
const f = require("../tools/f");
const mmr_js = require('../game/mmr');
const { cleanOnGameEnd } = require('../game/game');

const fetchStatsFile = async (serverId, matchId = '1') => {

  // let filePath = 'cfg%2Fget5%2Fget5_matchstats_$$XXX$$.cfg';
  let filePath = 'get5stats/get5_matchstats_$$XXX$$.cfg';
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
  'Name       ',
  ' K  D  A ', //  37/23/23
  'ADR',
  'HS%',
  'Et.T', // Entry 🏃
  'Et.CT',
  'Tr.', // Trades ⇄
  '5k',
  '4k',
  '3k',
  '2k',
  'Bomb', // Plants Defuses
]; // 13

const dataFields = [
  'Name',
  'Kills',
  'Deaths',
  'Assists',
  'ADR',
  'HS%',
  'Ent. T +',
  'Ent. T -',
  'Ent. CT +',
  'Ent. CT -',
  'Trades',
  '5k',
  '4k',
  '3k',
  '2k',
  'Plants',
  'Defuses',
]; // 17

const tableTitlesToString = () => {
  return tableTitleArray.join('\t') + '\n';
}

const tableTitles = () => {
  return '| ' + tableTitleArray.join(' | ') + ' |\n';
}

// pad column to fit in table design
const padColumn = (index, value='-') => {
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
      return (value + '').substring(0, titleLength);
    }
  }
}

const shortenName = (name, maxsize = 10) => {
  if(name.length > maxsize) {
    return name.substring(0, maxsize) + '.';
  }
  return name;
}

let highestScoreObject = {};

const setHighestScore = (array, arrayIndex) => {
  array.forEach((value, index) => {
    if (highestScoreObject[index] && highestScoreObject[index].value) {
      // Compare to highestScoreObject
      if (index === 0) {} // No comparison (name)
      if (index === 2) { // Deaths compare to lowest
        if (value < highestScoreObject[index].value) {
          highestScoreObject[index].value = value;
          highestScoreObject[index].index = arrayIndex;
        } else if (value === highestScoreObject[index].value) {
          highestScoreObject.index = [].concat(highestScoreObject[index].index, arrayIndex);
        }
      } else { // Highest best
        if (value > highestScoreObject[index].value) {
          console.log('New highest!', value, tableTitleArray[index], arrayIndex);
          highestScoreObject[index].value = value;
          highestScoreObject[index].index = arrayIndex;
        } else if (value === highestScoreObject[index].value) {
          highestScoreObject.index = [].concat(highestScoreObject[index].index, arrayIndex);
        }
      }
    } else if(value && value !== '-'){ // First value
      if (index !== 0) {
        highestScoreObject[index] = {
          value: value,
          index: arrayIndex,
        }
      } // No comparison (name)
    }
  });
}

// Marks best values in table with bold
const hightlightHighestValues = (playerArrays, highestScore) => {
  const amountOfDataFields = dataFields.length; // TODO Amount of data fields
  for (let i = 0; i < amountOfDataFields; i++) {
    // Checks highestScore index
    if (highestScore[i] && highestScore[i].index && highestScore[i].value !== '-') {      
      const index = highestScore[i].index
      // playerArrays[index][i] = '**' + playerArrays[index][i] + '**';
      // playerArrays[index][i] = '⭐' + playerArrays[index][i];
    }
  }
}

const padTo2 = (value) => {
  return value.length === 1 ? ' ' + value : value;
}

const adjustStrings = (arrayOfArrays) => {
  const deathsIndex = 2;
  const assistsIndex = 3;
  const indexT = 7;
  const indexCT = 9;
  const defusesIndex = 16;
  return arrayOfArrays.map(array => {
    console.log('@adjustedStrings Start', array.length, array);
    const deaths = array[deathsIndex];
    const assists = array[assistsIndex];
    const entryTDeaths = array[indexT];
    const entryCTDeaths = array[indexCT];
    const defuses = array[defusesIndex];
    const tempArray = array.filter((_, index) => !(index === indexT || index === indexCT || index === deathsIndex || index === assistsIndex || index === defusesIndex) );
    // Expected order: name, KDA, ADR, etc
    const adjustedArray = tempArray.map((value, index) => {
      if (index === 1) return padTo2(value) + '/' + padTo2(deaths) + '/' + padTo2(assists); 
      if (index === 2) return value + '';
      if (index === 3) return value + '%';
      if (index === 4) return value + '/' + entryTDeaths;
      if (index === 5) return value + '/' + entryCTDeaths;
      if (index === 11) return value + '/' + defuses;
      return value;
    });
    console.log('@adjustedStrings end', adjustedArray.length, adjustedArray);
    return adjustedArray;
  });
}

const buildMapStatsMessage = (mapTeam) => {
  let s = '';
  let playerArrays = [];
  let loopIndex = 0;
  for (let key in mapTeam) {
    if (mapTeam.hasOwnProperty(key)) {
      let playerArray = [];
      let player = mapTeam[key];
      if (key === 'score') continue;

      // Get stats values for player

      const { name, kills, deaths, assists } = player;
      const adr = Math.floor(player.damage / player.roundsplayed); // + ' DPR';
      const hsPerc = Math.floor(((parseInt(player.headshot_kills) || 0) / kills).toFixed(2) * 100);
      const { firstkill_t, firstdeath_t, firstkill_ct, firstdeath_ct } = player;
      const entriesT = parseInt(firstkill_t) || 0;
      const failedEntriesT = parseInt(firstdeath_t) || 0;
      const entriesCT = parseInt(firstkill_ct) || 0;
      const failedEntriesCT = parseInt(firstdeath_ct) || 0;
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
      playerArray.push(failedEntriesT);
      playerArray.push(entriesCT);
      playerArray.push(failedEntriesCT);
      playerArray.push(player.tradekill || '-');
      playerArray.push(kill5_rounds);
      playerArray.push(kill4_rounds);
      playerArray.push(kill3_rounds);
      playerArray.push(kill2_rounds);
      playerArray.push(player.bomb_plants || '-');
      playerArray.push(player.bomb_defuses || '-');

      setHighestScore(playerArray, loopIndex);

      playerArrays.push(playerArray);
      loopIndex++;
    }
  }

  // Set bolded for highest values
  hightlightHighestValues(playerArrays, highestScoreObject);
  const fixedPlayerArray = adjustStrings(playerArrays);

  const sortedArrays = fixedPlayerArray.sort((a, b) => parseInt(a[1]) < parseInt(b[1]));
  console.log('SIZES:', tableTitleArray.length, fixedPlayerArray.length, sortedArrays.length);
  for(let i = 0; i < sortedArrays.length; i++) {
    console.log('@loop last', tableTitleArray[i], sortedArrays[i]);
    s += '|';
    let innerCounter = 0;
    s += sortedArrays[i].map((entry, index) => {
      console.log('@inner loop', index, innerCounter, entry)
      innerCounter++;
      return padColumn(index, entry);
    }).join('|');
    s += '|\n';
  }
  return s;
}

// Builds the stats string to send in discord
const buildStatsMessage = (stats) => {
  let s = '';
  for (let i = 0; i < 1; i++) {
    // Check only give results for one game
    let map = stats['map' + i];
    if (!map) return null;
    const winner = map.winner;
    const teamWonName = stats[winner + '_name'];
    console.log('@buildStatsMessage DEBUG', winner, teamWonName);
    s += teamWonName + ' won! ';
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
  return '```' + s + '```'; // TODO: Include some explanation after message in footer?
}

// Send stats message to discord in the correct channel
const sendStatsDiscord = (gameObject, statsMessage) => {
  // Sends in channel
  bot.printMessage(statsMessage, gameObject.getChannelMessage(), (message) => {
		f.deleteDiscMessage(message, 3600000, 'statsresultsgame' + Math.floor(Math.random() * 10));
  });
  // TODO Send in game results chat which do not clear
}

// Checks if the stats file has the same players in both teams as the gameObject
const samePlayersInTeams = (gameObject, stats) => {
  // TODO: Check if same players between file and content
  /*
  const team1 = gameObject.getBalanceInfo().team1;
  const team2 = gameObject.getBalanceInfo().team2;
  const serverTeam1 = stats.map0.team1;
  const serverTeam2 = stats.map0.team2;
  */
  // Temp: Check same teamnames
  const team1Name = gameObject.getBalanceInfo().team1Name;
  const team2Name = gameObject.getBalanceInfo().team2Name;
  const serverTeam1Name = stats.team1_name;
  const serverTeam2Name = stats.team2_name;
  console.log('@samePlayersInTeam:', team1Name === serverTeam1Name && team2Name === serverTeam2Name);
  return team1Name === serverTeam1Name && team2Name === serverTeam2Name;
}

const setResults = (gameObject, stats) => {
  const winnerTeam = stats.map0.winner;
  const winner = winnerTeam === 'team1' ? 1 : (winnerTeam === 'team2' ? 2 : '');
  // console.log('@setResults DEBUG:', winnerTeam, '"' + winner + '"');
  if (winner !== '' && samePlayersInTeams(gameObject, stats)) {
    console.log('@getGameStatsDiscord Winning team:', winnerTeam);
    mmr_js.updateMMR(winner, gameObject, (message) => {
      console.log('DEBUG @callbackGameFinished - Calls on exit after delete on this message');
      f.deleteDiscMessage(message, f.getDefaultRemoveTime() * 4, 'gameFinished');
      cleanOnGameEnd(gameObject);
    });
  } else {
    console.log('Missing Winner - Incomplete Results', winner, samePlayersInTeams(gameObject, stats));
  }
}

const getGameStatsDiscord = (gameObject, stats) => {
  // Check which team that won and update MMR accordingly
  setResults(gameObject, stats);

  const discordMessage = buildStatsMessage(stats);
  if (discordMessage) {
    // Visualize stats in discord message
    sendStatsDiscord(gameObject, discordMessage);
  }
}

const getGameStats = async (serverId, gameObject) => {
  // writeConsole(serverId, 'get5_dumpstats');

  // Get match id
  let matchId = gameObject.getMatchId();
  const statsFile = await fetchStatsFile(serverId, matchId);
  if (statsFile.data && statsFile.statusCode >= 200 && statsFile.statusCode < 400) {
    console.log('@getGameStats Raw:', statsFile);
    const data = vdf.parse(statsFile.data);
    console.log(data);
    console.log(data.Stats.map0);
    getGameStatsDiscord(gameObject, data.Stats);
    cleanStatsFile();
  }
}

module.exports = {
  getGameStats : getGameStats,
}