# Draft Boy Advance

This is a Discord bot you can use for drafting pokemon teams. Since the untimely demise of draft-league.nl, our league has been searching for alternatives and decided on creating DBA.

# SETUP:

The bot is not currently scalable to run in multiple servers (functionality planned), so if you want to use it you will need to clone it and run your own instance.

To do so, you will need a google cloud service account, which you can set up at console.cloud.google.com. Once you have that, you can download a credentials.json file from the console. Move that file to the bot's root folder.

The bot uses google sheets to track and output the draft data. You will need to copy [this](https://docs.google.com/spreadsheets/d/1m4CsvwY6wZDcFwh5lv-7nuUHzyz94MkraYDjA2Vk-Vk/edit?usp=sharing) template to your own Google Drive (file => Make a copy). Then get your google service account email. It is visible on the google cloud console, and in the client_email section of your credentials.json file. Share your spreadsheet with that email, unchecking the 'alert people' box and allowing edit privilege when you do so.

Currently this template is set up for Gen IX VGC Series 2. To change the allowed Pokemon, change column H in Master to include only the legal Pokemon in your format of choice.

IMPORTANT: Once you have set everything up, the three pages Master, BotData, and PickOrder should be LOCKED and HIDDEN to all users except the Google service account, and Teams List should be LOCKED to all users. Manual changes to these spreadsheets will likely cause unexpected behavior.

You will also need to [set up a bot application with Discord](https://discordjs.guide/preparations/setting-up-a-bot-application.html). Once you have done so, make a config.json file in the root folder. It should look like this:

{

token: "BOT_TOKEN_HERE",

clientId: "BOT_CLIENT_ID_HERE",

spreadsheetId: "SHEETS_SPREADSHEET_ID_HERE"

}

You can find the ID of your spreadsheet in the URL - the long, random-looking string between "d/" and "/edit".

Finally, make sure you have Node.js installed, then run npm i in the project folder.

[Invite your bot to your server](https://discordjs.guide/preparations/adding-your-bot-to-servers.html).

run npm start

If everything went right you should now have a live clone of Draft Boy Advance.

# USAGE

## Add to Draft

Before you run /start, you'll need to add players to your draft. To do so, right click on a user you want to add to the draft, and in the context menu go to Apps => Add To Draft. That user will be given the 'Drafter' role and added to the Pick Order spreadsheet. Once everyone playing has been marked as a drafter, you can continue.

## Slash Commands

### /pickorder

Admin-only command. Returns the current pick order.

### /clearpickorder

Admin-only command. Removes all players from the draft allowing you to change the order of players. Cannot be used while a draft is live - You will need to use /stop, then /clearpickorder, and then re-/start the draft.

### /start (outputchannel, playercount, teamsize)

Admin-only command. This is what you run when you are ready to begin your draft.
/start outputchannel: The channel you want the bot to talk in. Pick announcements will be sent here.
/start playercount: The number of seats in the draft. Make sure you get this right, or players will be skipped or the bot might softlock.
/start teamsize: the number of Pokemon on a full roster.

### /stop

Admin-only command. Empties the spreadsheet of bot output and stops the draft. Use only in case of emergency (i.e. you need to restart the draft halfway through because you messed up the pick order). You should prefer using /goto whenever possible

### /pick (pokemon)

If it is your turn to pick, attempts to lock in the pokemon, otherwise it attempts to add the pokemon to the user's queued picks. Duplicate pokemon and user entry not matching a format-legal pokemon are disallowed. Picks are case-insensitive, but must be spelled correctly (Quakxly will return an error). Draft Boy will attempt a spell-check and return its best guess as a reply to your message, but will not automatically lock in its guess.

Queued picks are automatically staged and locked in if they are still available when the draft passes to the user who queued them. If a user's first queued pick is sniped, the second queued pick is tried, and so on until either a legal pick is found or all queued picks have been tried, in which case the user is prompted for a new pick.

### /check

Replies with a list of the user's current queued picks, if they have any. Queued picks are private information and visible only to the user making the request.

### /delete (pokemon)

Deletes the chosen Pokemon from the user's queued picks.

### /deleteall

Deletes all Pokemon from the user's queued picks.

### /goto (picknumber)

Admin-only command. Rewinds the draft to picknumber, including that number - i.e. /goto 1 will clear the entire draft and the player in the first seat will be prompted to pick.

## Notes

I will continue adding functionality to this bot over time, so if you see something missing that you would like in future releases, let me know with an issue on the [github](https://github.com/Sam-Dunlap/Draft-Boy-Advance).

It's therefore a good idea to occasionally check back here for updates if you're using a clone.

Thanks to [ScoutFlower](https://www.youtube.com/@sscoutflower) for formatting the spreadsheet.

## Example Output

### Lock-in announcement (sent to `outputchannel`)
![image](https://github.com/Sam-Dunlap/Draft-Boy-Advance/assets/16829393/31e03e77-67ff-43f2-9665-d895bb41c400)

### Pick Command
![image](https://github.com/Sam-Dunlap/Draft-Boy-Advance/assets/16829393/7b726616-2913-43e4-908c-498a718cdce7)
