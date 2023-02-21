const { getDraftSeat } = require('./SnakeDraftEquations');
const { getUser } = require('./PendingPicks');
const {getCacheWithGuildId} = require('./Cache');

const stagePicks = (props) => {
    const { n, x, guildId, pickedMons } = props;
    const { pickOrder } = getCacheWithGuildId(guildId);
   
    let n1 = Number(n) + 1;
    let nextPlayerName;
    const stagedPicks = [];


    let foundAllQueuedPicks = false;
    while (!foundAllQueuedPicks) {
        const y = getDraftSeat(n1, x);
        const username = pickOrder[y - 1];
        const user = getUser(username);

        // no queued picks for next draft seat
        if (!user || user.picks.length === 0) {
            foundAllQueuedPicks = true;
            nextPlayerName = username;
            console.log('no queued picks for next draft seat');
            console.log(pickOrder);
            console.log(username);
            break;
        };

        while (pickedMons.includes(user.picks[0])) {
            user.deletePickByIndex(0);
            if (user.picks.length === 0) {
                nextPlayerName = username;
                foundAllQueuedPicks = true;
                console.log('they sniped this poor mans whole career');
                break;
            };

        };

        // success
        pickedMons.push(user.picks[0]);
        stagedPicks.push([user.picks[0], user.name]);
        console.log(user.picks[0]);
        user.deletePickByIndex(0);

        n1++;
    };
    console.log('in stagePicks: ', n1, nextPlayerName, stagedPicks);
    return { n1, nextPlayerName, stagedPicks }

}

module.exports = {
    stagePicks
}