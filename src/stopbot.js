import Discord from 'discord.js';
import logger from 'winston';
import request from 'superagent';
import auth from '../auth.json';
import messageHandler from './messageHandler.js';
import express from 'express';
import pg from 'pg';

const app = express();

// database configs
const PGUSER = 'brendazhang';
const PGDATABASE = 'stopbot_db';

const config = {
  user: PGUSER, // name of the user account
  database: PGDATABASE, // name of the database
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
};

// database connection
const stopClient = new pg.Client(config);
stopClient.connect();

app.listen(5432, () => {
  console.log('Server started');
});

// trial query
stopClient.query(`SELECT * from word_lists WHERE serverid = '264445053596991498'`, (err, result) => {
  console.log(err ? err : result.rows[0]['stoplist'].length);
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const TOKEN = auth.token;
const DBOT_TOKEN = auth.dbot_token;
const PWBOT_TOKEN = auth.pwbot_token;

const bot = new Discord.Client({
  token: TOKEN,
  autorun: true
});

bot.on('ready', (evt) => {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.user.username + ' - ' + bot.user.id);

  // Server count for discord bot lists
  request.post(`https://discordbots.org/api/bots/${bot.user.id}/stats`)
    .set('Authorization', DBOT_TOKEN)
    .send({server_count: bot.guilds.size})
    .end(err => {
      if (err) return console.error(err);
      console.log("Success (dbot)!");
    });

  request.post(`https://bots.discord.pw/api/bots/${bot.user.id}/stats`)
    .set('Authorization', PWBOT_TOKEN)
    .send({server_count: bot.guilds.size})
    .end(err => {
      if (err) return console.error(err);
      console.log("Success (pwbot)!");
    });

  bot.user.setPresence({status: 'online', game: {name: '!go fish | !help', type: 0}});
});

messageHandler(bot, stopClient);

bot.login(TOKEN);
