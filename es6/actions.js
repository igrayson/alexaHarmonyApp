import config from '../config';
import IRCCClient, { IRCC_COMMANDS } from './brav';
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

export async function increaseVolume(units=5) {
  if (units > 15) {
    console.log('Reducing units', units, 'to 15');
    units = 15;
  }
  console.log('Increasing volume by', units);
  await* _.times(units, () => bravia.sendCommand(IRCC_COMMANDS.VolumeUp));
  console.log('Volume increase succeeded.');
}

export async function decreaseVolume(units=5) {
  if (units > 15) {
    console.log('Reducing units', units, 'to 15');
    units = 15;
  }
  console.log('Decreasing volume by', units);
  await* _.times(units, () => bravia.sendCommand(IRCC_COMMANDS.VolumeDown));
  console.log('Volume decrease succeeded.');
}

export async function muteVolume() {
  console.log('Muting volume.');
  await bravia.sendCommand(IRCC_COMMANDS.Mute)
  console.log('Mute succeeded.');
}

export async function turnOnTV() {
  console.log('Turning on tv (cec-client on 0).');
  cecClient.send('on 0');
}

export async function turnOffTV() {
  console.log('Turning off tv.');
  await cecClient.send('standby 0');
  // await samsungSend('KEY_POWEROFF');
  console.log('Turning off tv successful.');
}

export async function turnOnAVR() {
  wol.wake(config.bravia_mac);
}

export async function turnOffAVR() {
  await bravia.sendCommand(IRCC_COMMANDS['STR:PowerMain']);
}
