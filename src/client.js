import {
    Client
} from 'discord.js';
import config from './config.js';

const client = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildMembers",
        "GuildIntegrations",
        "GuildScheduledEvents",
        "MessageContent",
    ]
});


export default client;

//BOT Status/activity controller
client.on('clientReady', async (interaction) => {
    const activities = config.activities;
    const status = [
        'dnd'
    ];

    let i = 0, s = 0;

    setInterval(() => {
        if (i >= activities.length) {
            i = 0;
        }

        client.user.setActivity(activities[i]);

        i++;
    }, 20000);

    setInterval(() => {
        if (s >= status.length) {
            s = 0;
        }

        client.user.setStatus(status[s]);

        s++;
    }, 10000);
});

client.on('clientReady', async () => {
    const activitiesChannel = await client.channels.fetch(config.channels.activities_channel).catch(() => {});
    if (activitiesChannel) {
        //console.log("Activity channel found!");

        const minMsecsFromStartToMessageThem = 10 * 60000; //10 minutes from the start of it

        setInterval(() => {
            var currDate = new Date();
            //TODO: Should we check the next day too?

            config.events.forEach((eventData) => {
                if (eventData.isOnCooldown) {
                    //Don't trigger another alert for the same event, as we already triggered one recently.
                    return;
                }

                eventData.validHours.forEach((validHour) => { 
                    var validDate = new Date();
                    validDate.setHours(validHour, eventData.startAt, 0, 0);

                    var timeUntilValidDate = (validDate - currDate);
                    if (timeUntilValidDate < 0) {
                        validDate.setDate(validDate.getDate() + 1);

                        timeUntilValidDate = (validDate - currDate); //Re-calculate it
                    }

                    if (timeUntilValidDate > 0) {
                        //console.log(`[${eventData.name}] Minutes until: ${(timeUntilValidDate / 60000)}. Is on cooldown? ${eventData.isOnCooldown}`);
                    }

                    if (timeUntilValidDate > 0 && timeUntilValidDate <= minMsecsFromStartToMessageThem && !eventData.isOnCooldown) {
                        const beautifiedTimeUntil = Math.ceil(timeUntilValidDate / 60000);

                        const message = `<@&${eventData.roleId}> Get ready! **${eventData.name}** is just **${beautifiedTimeUntil} minutes** away!!`;
                        
                        activitiesChannel.send({
                            content: message,
                            embeds: []
                        });

                        eventData.isOnCooldown = true;

                        setTimeout(() => {
                            eventData.isOnCooldown = null;
                        }, minMsecsFromStartToMessageThem + (5 * 60000));
                        

                        console.log(`[LOGS] ${eventData.name} alert sent with ${(timeUntilValidDate / 60000)} minutes until the event.`);
                    }
                })
            });
        }, 5000);

        console.log('[LOGS] Modules successfully loaded.');
        console.log(`[LOGS] ${client.user.tag} is now active!\n[LOGS] I'm on ${client.guilds.cache.size} servers.\n[LOGS] Taking care of ${client.users.cache.size} members.`);
    }
    else {
        console.error("[ERROR] Activity channel not found!");
    }
});

process.on('uncaughtException', err => console.error(err));
client.login(process.env.TOKEN);