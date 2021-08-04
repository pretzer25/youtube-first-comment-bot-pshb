# YouTube First Comment Bot (WebSub)

A bot that automatically leaves a comment on a new YouTube video

## Usage

To use this bot, first create a project in Google Developers Console using the step 1 of
[this guide](https://developers.google.com/youtube/v3/quickstart/nodejs#step_1_turn_on_the).

Then, move the [`client_secret.json`](client_secret.json) file in the root directory of this project.

Rename [`.env.bac`](.env.bac) to `.env` and set `SUBDOMAIN` to something that others probably won't choose
(i.e. your username), or else you will be assigned a random subdomain.

Create `comments.json` containing the channel ID's and the comment to leave (check
[`comments.example.json`](comments.example.json) if you want an example).

Run the script with `npm run start` or the bash or vbs script if you want it to run hidden. You will be prompted
to sign in.

Finally, copy the localtunnel link (found in the output as `Server accessible at <link>` and in
`address.txt`) and use it to subscribe on
[Google's pubhubsubbub server](https://pubsubhubbub.appspot.com/subscribe) or any other WebSub server such
as [Superfeedr](https://superfeedr.com/) (requires an account) for each channel. The callback URL will be the
localtunnel link, and the topic URL will be `https://www.youtube.com/xml/feeds/videos.xml?channel_id=<channel ID>`
where `<channel ID>` is the channel ID to subscribe to. Leave any other fields blank.

Now, when any of the channels you've subscribed to posts a new video, the bot will automatically leave a comment
in about 15 to 25 seconds.

The next time you want to start the bot, just run the script. All the setup should be done.

## Bot too slow?

Is 15 to 25 seconds too slow? Check out [BOT-HAT](../../../../BOT-HAT)'s
[Youtube First Comment Bot](../../../../BOT-HAT/Youtube-First-Comment-Bot) or
[my fork of that project](../../../Youtube-First-Comment-Bot).