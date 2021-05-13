# inhouseBot - Make your own inhouse league!

[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)

## Discord bot made to host inhouse games

#### The discord bot is in NodeJS and handles a inhouse system with rating for each individual user. 
#### Supports any game of your choice
Bots Purpose

* Balance Teams
* Adjust rating based on performance
* Easy discord and game interaction, giving commands to move voice channels etc
* Full list of commands is given below

#### Supports sizes of 2v2, 3v3, 4v4 and 5v5

## New: Counter Strike Integration

The bot is able to be easily configured to be setup together with a dathost hosted ebot server, which allows you to fetch in-game performance directly into the bot database, as well as fetching the result of the match.

## Bonus feature: Includes a Trivia game which is to be played in a discord channel
* Questions are fetched from an external API
* Feature contains ability to provide hints, a scoreboard as well as over 20 different trivia topics

## 

## Available commands

Prefix and bot-name can be modified to own liking

*Available commands for inhouse-bot (All Options):*  
(**[opt = default]** Syntax for optional arguments)

**-ping** *Pong*

**-h | -help** Shows the available commands

**-ha | -helpall** Shows information about all commands in detail

**-leaderboard [game = cs]** Returns Top 5 MMR holders  
**[game]** Opt. argument: name of the mode to retrieve top leaderboard for. Available modes are [cs,dota,cs1v1,dota1v1,trivia]

**-stats [game = cs]** Returns your own rating  
**[game]** Opt. argument: name of the mode to retrieve stats for. Available modes are [cs,dota,cs1v1,dota1v1,trivia]

**-roll [high] [low, high]** Rolls a number (0 - 100)  
**[high]** (0 - high)           **[low, high]** (low - high)

**-trivia | -starttrivia | -triviastart [questions = allsubjectseasy]** Starts a trivia game in the textchannel *trivia-channel*  
**[questions]** Opt. argument: name of question field and difficulty.

**-exit** *Admin Command* Clear all messages, exit games, prepares for restart


**Start Game commands**

**-b | -balance | -balanceGame | -inhousebalance [game = cs]** Starts an inhouse game with the players in the same voice chat as the message author.   
Requires 4, 6, 8 or 10 players in voice chat to work.  
**[game]** Opt. argument: name of the game being played. Available games are [cs,dota]

**-team1won | -team2won** Starts report of match result, requires majority of players to upvote from game for stats to be recorded.   
If majority of players downvote, this match result report disappears, use **-cancel** for canceling the match after this

**-tie | -draw** If a match end in a tie, use this as match result. Same rules for reporting as **-team1Won | -team2Won**

**-c | -cancel | -gamenotplayed** Cancels the game, to be used when game was decided to not be played  
Game can only be canceled by the person who started the game

**-split** Splits voice chat into two separate voice chats

**-u | -unite [channel]** Unite voice chat after game  
**[channel]** Opt. argument: name of channel to unite in

**-ua | -uniteAll [channel]** Unite all users active in voice to same channel  
**[channel]** Opt. argument: name of channel to unite in

**-mapveto | -startmapveto | -mapvetostart | -startmaps** Starts a map veto (*cs only*)

**-duel | -challenge [player] [game = cs] ** Starts a duel, a 1v1 match between 2 people **TBA**  
If only two people are in voiceChannel, start duel between them. Otherwise [player] is required.  
**[player]** Required if more than 2 players in voiceChannel. Person who is challenged  
**[game]** Opt. argument: name of the game being played. Available games are [cs1v1,dota1v1]

## [Installation](https://github.com/Lolispo/inhouseBot/wiki/Installation)

If any issues occur, notify a developer.

## Do you have any ideas for the future?

Make a [Pull Request](https://github.com/Lolispo/inhouseBot/pulls) for a new issue in the repository.

Current TODO:s for the projects are listed in the files, main TODO section is in bot.js



