import alexa from 'alexa-app';
import _ from 'lodash';

import * as actions from './actions';
import config from '../config';

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
        await actions.increaseVolume();
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
        await actions.increaseVolume(amt);
    });

app.intent('DecreaseVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{decrease volume|reduce volume|less volume|quieter|be quieter}"]
    },
    async function (req, res) {
        console.log('Decreasing volume by 5');
        await actions.decreaseVolume();
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
        await actions.decreaseVolume(amt);
    });

app.intent('MuteVolume',
    {
        "slots" : {},
        "utterances" : ["{mute|quiet|be quiet|shut up|unmute}"]
    },
    async function (req, res) {
        console.log('Muting!');
        await actions.muteVolume();
    });

app.intent('TurnOnTV',
    {
        "slots" : {},
        "utterances" : ["{turn on the TV|turn the TV on|turn on TV|turn TV on}"],
    },
    async function (req, res) {
        res.say('Turning on TV!');
        console.log('Turning on TV!');
        await actions.turnOnTV();
    });

app.intent('TurnOffTV',
    {
        "slots" : {},
        "utterances" : ["{turn the TV off|turn TV off}"],
    },
    async function (req, res) {
        res.say('Turning off TV!');
        console.log('Turning off TV!');
        await actions.turnOffTV();
    });

app.intent('TurnOff',
    {
        "slots" : {},
        "utterances" : ["{turn off|turn everything off|power off|power everything off|go to sleep|sleep}"]
    },
    async function (req, res) {
        res.say('Turning theater off.');
        console.log('Turning off everything!');
        await* [actions.turnOffTV(), actions.turnOffAVR()];
    });

app.intent('Turnon',
    {
        "slots" : {},
        "utterances" : ["{start|turn on|wake up|power everything on|power on everything|turn everything on}"]
    },
    async function (req, res) {
        res.say('Turning on theater.');
        console.log('Turning on everything!', config.bravia_mac);
        await* [actions.turnOnTV(), actions.turnOnAVR()];
        console.log('Turned on theater.');
    });

app.intent('Pause',
    {
        "slots" : {},
        "utterances" : ["{pause|pause netflix}"]
    },
    async function (req, res) {
        console.log('Telling TV to pause');
        await actions.pauseTV();
        console.log('Paused tv.');
    });

app.intent('Play',
    {
        "slots" : {},
        "utterances" : ["{unpause|play|resume}"]
    },
    async function (req, res) {
        console.log('Telling TV to resume');
        await actions.playTV();
        console.log('Resumed tv.');
    });

module.exports = app;

