# Minna Tōhyō - みんな投票
[![GitHub license](https://img.shields.io/github/license/ToppleKek/minna_touhyou.svg)](https://github.com/ToppleKek/minna_touhyou/blob/master/LICENSE)
[![HitCount](http://hits.dwyl.io/ToppleKek/minna_touhyou.svg)](http://hits.dwyl.io/ToppleKek/minna_touhyou)

Everyone votes in this browser-based Q&amp;A game

## What is it?
Minna Tōhyō is a simple Kahoot! inspired, free, browser-based game built using [node.js](https://nodejs.org/en/), [socket.io](https://socket.io/) and 
[express.js](https://expressjs.com/) where the players are asked open response questions to which they must come up with their best answer.
After all answers have been collected, the players must all vote on the best answer. The lowest scoring answers get eliminated and the process repeats until the top 3 
answers are found. The top 3 questions get points. The host of the game can also select an answer they feel is the best and award them bonus points. 
The player with the most points at the end of the game wins!

## What should I use it for?
Minna Tōhyō can be used for whatever you want. Some suggestions include: classroom test practice/fun lession tool, your own entertainment with friends or even to end a presentation. 
;)

## Hosting your own instance
Currently, only one game can be hosted per instance as this was intended for personal use. This may be expanded in the future, but if you wish to host your own personal instance 
you can do the following (you must have node.js and npm installed):

- Clone the repo: `git clone https://github.com/ToppleKek/minna_touhyou.git`
- Install dependencies: `npm install`
- Run the instance: `node run.js`