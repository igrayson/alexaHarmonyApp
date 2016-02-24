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
  await* _.times(units, () => bravia.sendCommand(IRCC_COMMANDS.VolumeUp));
}

export async function decreaseVolume(units=5) {
  await* _.times(units, () => bravia.sendCommand(IRCC_COMMANDS.VolumeDown));
}

export async function muteVolume() {
  await bravia.sendCommand(IRCC_COMMANDS.Mute)
}

export async function turnOnTV() {
  cecClient.send('on 0');
}

export async function turnOffTV() {
  await samsungSend('KEY_POWEROFF');
}

export async function turnOnAVR() {
  wol.wake(config.bravia_mac);
}

export async function turnOffAVR() {
  await bravia.sendCommand(IRCC_COMMANDS['STR:PowerMain']);
}
