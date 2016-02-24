import alexa from 'alexa-app';
import config from './config';
import IRCCClient, { IRCC_COMMANDS } from './brav.es6';
import SamsungRemote from 'samsung-remote';
import Promise from 'bluebird';
import _ from 'lodash';
import wol from 'wol';

import { NodeCec, CEC } from 'node-cec';


const wake = Promise.promisify(wol.wake);

let cecClient;
const cec = new NodeCec('node-cec-monitor');
cec.once('ready', client => {
  console.log('cec-client ready.');
  cecClient = client;
});
// -m  = start in monitor-mode 
// -d8 = set log level to 8 (=TRAFFIC) (-d 8) 
// -br = logical address set to `recording device` 
cec.start( 'cec-client', '-m', '-d', '8', '-b', 'r' );

// var alexa = require('alexa-app'),
//     HarmonyUtils = require('harmony-hub-util'),
//     harmony_clients = {},
//     conf = require('./remote_conf.js'),
//     hub_ip = conf.hub_ip,
//     app_id = conf.app_id;

const bravia = new IRCCClient(config.bravia_ip, config.bravia_discover_port, config.bravia_command_port);
const samsung = new SamsungRemote({ip: config.samsung_ip});
const samsungSend = Promise.promisify(samsung.send);
// Define an alexa-app
const app = new alexa.app('remote');

app.launch(function(req, res) {
    console.log("Launching the application");
});


// function execCmdDF(hutils, is_device, dev_or_act, cmd, cnt, fn, res) {
//     console.log("execCmd called with cnt = " + cnt + " is_dev " + is_device +
//                 " dev/act " + dev_or_act + " cmd = " + cmd);
//     if (cnt === 0) {
//         fn(res);
//         hutils.end();
//         return;
//     }
//     hutils.executeCommand(is_device, dev_or_act, cmd).then(function (res) {
//         console.log(cnt + ". Command " + cmd + " to device/activity " +
//                     dev_or_act + " was executed with result : " + res);
//         if (res) {
//             setTimeout(function () {
//                 execCmdDF(hutils, is_device, dev_or_act, cmd, cnt - 1, fn, res);
//             }, 100);
//         }
//     }, function(err) {
//         console.log("ERROR Occured " + err);
//         console.log("      stack " + err.stack);
//     });
// }

// function execCmd(dev, cmd, cnt, fn, res) {
//     new HarmonyUtils(hub_ip).then(function (hutil) {
//         execCmdDF(hutil, true, dev, cmd, cnt, fn, res);
//     });
// }

// function execCmdCurrentActivity(cmd, cnt, fn, res) {
//     new HarmonyUtils(hub_ip).then(function (hutils) {
//         hutils.readCurrentActivity().then(function (current_activity) {
//             execCmdDF(hutils, false, current_activity, cmd, cnt, fn, res);
//         });
//     });
// }

// function execActivity(act, fn) {
//     new HarmonyUtils(hub_ip).then(function (hutils) {
//         hutils.executeActivity(act).then(function (res) {
//             fn(res);
//         });
//     });
// }

app.pre = function(req, res, type) {
    if (req.applicationId !== config.app_id) {
        console.log(" Received and invalid applicaiton ID " + req.applicationId);
        res.fail("Invalid applicationId");
    }
};

app.intent('IncreaseVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{increase volume|more volume|be louder|louder}"]
    },
    async function (req, res) {
        console.log('Increasing volume by 5');

        await* _.times(5, () => bravia.sendCommand(IRCC_COMMANDS.VolumeUp));
        // res.say('Okay.');
    });

app.intent('IncreaseVolumeBy',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{increase volume|volume|more volume|be louder|louder} {by|} {1-9|AMOUNT}"]
    },
    async function (req, res) {
        var amt = parseInt(req.slot('AMOUNT'), 10);
        if (isNaN(amt)) {
            amt = 1;
        }
        console.log('Increasing volume by ' + amt);
        await* _.times(amt,  () => bravia.sendCommand(IRCC_COMMANDS.VolumeUp));
        // res.say('Done');
    });

app.intent('DecreaseVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{decrease volume|reduce volume|less volume|quieter|be quieter}"]
    },
    async function (req, res) {
        console.log('Decreasing volume by 5');
        await* _.times(5, () => bravia.sendCommand(IRCC_COMMANDS.VolumeDown));
        // res.say('Done');
    });

app.intent('DecreaseVolumeBy',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{decrease volume|reduce volume|quieter|be quieter} {by|} {1-9|AMOUNT}"]
    },
    async function (req, res) {
        var amt = parseInt(req.slot('AMOUNT'), 10);
        if (isNaN(amt)) {
            amt = 1;
        }
        console.log('Decreasing volume by ' + amt);
        await* _.times(amt, () => bravia.sendCommand(IRCC_COMMANDS.VolumeDown));
    });

app.intent('MuteVolume',
    {
        "slots" : {},
        "utterances" : ["{mute|quiet|be quiet|shut up|unmute}"]
    },
    async function (req, res) {
        console.log('Muting!');
        await bravia.sendCommand(IRCC_COMMANDS.Mute)
        // execCmdCurrentActivity('Volume,Mute', 1, function (res) {
        //     console.log("Command Mute executed with result : " + res);
        // });
    });

// app.intent('IncreaseTVVolume',
//     {
//         "slots" : {'AMOUNT' : 'NUMBER'},
//         "utterances" : ["{increase|} TV volume by {1-9|AMOUNT}"]
//     },
//     function (req, res) {
//         var amt = parseInt(req.slot('AMOUNT'), 10);
//         if (isNaN(amt)) {
//             amt = 1;
//         }
//         res.say('Increasing TV volume by ' + amt);
//         console.log('Increasing volume by ' + amt);
//         execCmd('TV', 'VolumeUp', amt, function (res) {
//             console.log("Command Volume UP was executed with result : " + res);
//         });
//     });

// app.intent('DecreaseTVVolume',
//     {
//         "slots" : {'AMOUNT' : 'NUMBER'},
//         "utterances" : ["{decrease TV volume|reduce TV volume} by {1-9|AMOUNT}"]
//     },
//     function (req, res) {
//         var amt = parseInt(req.slot('AMOUNT'), 10);
//         if (isNaN(amt)) {
//             amt = 1;
//         }
//         res.say('Decreasing TV volume by ' + amt);
//         console.log('Decreasing volume by ' + amt);
//         execCmd('TV', 'VolumeDown', amt, function (res) {
//             console.log("Command Volume Down was executed with result : " + res);
//         });
//     });

// app.intent('MuteTVVolume',
//     {
//         "slots" : {},
//         "utterances" : ["{mute|unmute} {TV|telivision}"]
//     },
//     function (req, res) {
//         res.say('Muting TV!');
//         console.log('Muting!');
//         execCmd('TV', 'Mute', 1, function (res) {
//             console.log("Command Mute executed with result : " + res);
//         });
//     });

// app.intent('TurnOnTV',
//     {
//         "slots" : {},
//         "utterances" : ["{turn on the TV|turn the TV on|turn on TV|turn TV on}"]
//     },
//     function (req, res) {
//         res.say('Turning TV on!');
//         console.log('Turning TV on!');
//     });

// app.intent('AmplifierInputNext',
//     {
//         "slots" : {},
//         "utterances" : ["{select next amplifier input}"]
//     },
//     function (req, res) {
//         res.say('selecting next input on amplifier!');
//         console.log('Selecting next amplifier input!');
//         execCmd('Amplifier', 'InputNext', 1, function (res) {
//             console.log("Command Amplifier InputNext executed with result : " + res);
//         });
//     });

// app.intent('SelectPlaystation',
//     {
//         "slots" : {},
//         "utterances" : ["{select|} {playstation}"]
//     },
//     function (req, res) {
//         res.say('Selecting ps4!');
//         console.log('Selecting ps4!');
//         execCmd('TV', 'InputHdmi1', 1, function (res) {
//             console.log("Command TV InputHdmi1 executed with result : " + res);
//         });
//     });

app.intent('TurnOnTV',
    {
        "slots" : {},
        "utterances" : ["{turn on the TV|turn the TV on|turn on TV|turn TV on}"],
    },
    async function (req, res) {
        res.say('Turning on TV!');
        console.log('Turning on TV!');
	cecClient.send('on 0');
    });

app.intent('TurnOffTV',
    {
        "slots" : {},
        "utterances" : ["{turn the TV off|turn TV off}"],
    },
    async function (req, res) {
        res.say('Turning off TV!');
        console.log('Turning off TV!');
        await samsungSend('KEY_POWEROFF');
    });

app.intent('TurnOff',
    {
        "slots" : {},
        "utterances" : ["{turn off|turn everything off|power off|power everything off|go to sleep|sleep}"]
    },
    async function (req, res) {
        res.say('Turning theater off.');
        console.log('Turning off everything!');
        bravia.sendCommand(IRCC_COMMANDS['STR:PowerMain']);
        samsungSend('KEY_POWEROFF');
    });

app.intent('Turnon',
    {
        "slots" : {},
        "utterances" : ["{start|turn on|wake up|power everything on|power on everything|turn everything on}"]
    },
    async function (req, res) {
        res.say('Turning on theater.');
        console.log('Turning on everything!', config.bravia_mac);
        cecClient.send('on 0');
	wol.wake(config.bravia_mac);
	//await wake(config.bravia_mac);
        console.log('Turned on theater.');
    });

module.exports = app;

