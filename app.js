require('dotenv').config();
const fs = require('fs');
const express = require('express');
const localtunnel = require('localtunnel');
const fetch = require("node-fetch");
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

const parser = bodyParser.xml({
  limit: '1MB', // Reject payload bigger than 1 MB
  xmlParseOptions: {
    normalize: true, // Trim whitespace inside text nodes
    normalizeTags: false, // Transform tags to lowercase
    explicitArray: false, // Only put nodes in array if >1
  },
});

const port = process.env.PORT || 8080;
const subdomain = process.env.SUBDOMAIN;

(async () => {
  const comment = await require('./comment');
  const app = express();

  app.get('/feeds', ({query: {'hub.challenge': challenge}}, res) => {
    console.log(challenge);
    res.status(200).end(challenge);
  });

  let hasCommented = {};

  app.post('/feeds', parser, ({ body: { feed } }, res) => {
    console.log(feed);
    if (feed.entry) {
      let { 'yt:videoId': videoId, 'yt:channelId': channelId } = feed.entry;
      console.log(`video ID: ${videoId}, channel ID: ${channelId}`);
      if (!hasCommented[videoId]) {
        comment(videoId, channelId);
        hasCommented[videoId] = true;
      }
    }
    res.status(204).end();
  });

  app.listen(port, () => console.log(`Server started on port ${port}.`));
  const tunnel = await localtunnel({ port, subdomain });
  const url = `${tunnel.url}/feeds`
  console.log(`Server accessible at ${url}.`);

  Object.keys(JSON.parse("" + await fs.promises.readFile("comments.json")))
    .forEach(id => fetch("https://pubsubhubbub.appspot.com/subscribe", {
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      "body": new URLSearchParams({
        "hub.callback": url,
        "hub.topic": `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${id}`,
        "hub.verify": "async",
        "hub.mode": "subscribe"
      }),
      "method": "POST",
    }).then(response => response.ok
      ? console.log(`successfully subscribed to ${id}.`)
      : console.log(`failed to subscribed to ${id} with status code ${response.status} and message ${response.statusText}.`)
    )
  );

  fs.writeFileSync('./address.txt', url);
  tunnel.on('close', () => console.log('localtunnel connection closed'));
})();