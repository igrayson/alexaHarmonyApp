import Promise from 'bluebird';
import SamsungRemote from 'samsung-remote';
import _ from 'lodash';
import wol from 'wol';
import { NodeCec, CEC } from 'node-cec';

import HarmonyClient from './harmony';
import IRCCClient, { IRCC_COMMANDS } from './brav';
import LgTvClient from './lgtv';
import PcClient from './pc';
import config from '../config';

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

const pc = new PcClient(config.computer_ip);
const lgtv = new LgTvClient(config.lgtv_ip)
const harmony = new HarmonyClient(config.harmony_ip, 'Sony AV Receiver')
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
  // console.log('Turning on tv (cec-client on 0).');
  // cecClient.send('on 0');
  console.log('WoL-ing TV @', config.lgtv_mac)
  await wake(config.lgtv_mac);
}

export async function turnOffTV() {
  await awaitTVOnline();
  console.log('Turning off tv.');
  await lgtv.turnOff();
  // await cecClient.send('standby 0');
  // await samsungSend('KEY_POWEROFF');
  console.log('Turning off tv successful.');
}

export async function turnOnAVR() {
  console.log('WoL-ing AVR @', config.bravia_mac)
  await wake(config.bravia_mac);
}

export async function turnOnComputer() {
  console.log('WoL-ing computer @', config.computer_mac)
  await wake(config.computer_mac);
}

export async function turnOffComputer() {
  console.log('Sending sleep command to computer', config.computer_ip)
  await pc.putToSleep();
}

export async function turnOffAVR() {
  await bravia.sendCommand(IRCC_COMMANDS['STR:PowerMain']);
}

export async function runAVRCommand(command) {
  await awaitAVROnline();
  await harmony.runCommand(command);
  console.log('AVR command successful:', command);
}

export async function pauseTV() {
  await awaitTVOnline();
  await lgtv.pause();
}

export async function playTV() {
  await awaitTVOnline();
  await lgtv.play();
}

export async function launchTVApp(appId) {
  await awaitTVOnline();
  console.log('Launching webOS app', appId);
  await lgtv.launchApp(appId);
}

export async function switchTVInput(inputId) {
  await awaitTVOnline();
  console.log('Switching LGTV input to', inputId);
  await lgtv.switchInput(inputId);
}

async function awaitTVOnline() {
  let attempt = 0;
  while (attempt++ < 30) {
    try {
      console.log('Checking if TV is online...');
      lgtv.connect();
      console.log('Getting TV inputs');
      await lgtv.getInputs();
      console.log('TV is online!');
      return;
    } catch (error) {
      if (attempt >= 10) {
        console.warn('Failed max retries while waiting for TV to come online.', attempt, error);
        throw error;
      }
      console.log('TV connect failed; waiting to retry', error);
      await Promise.delay(500);
    }
  }

}

export async function awaitAVROnline() {
  let attempt = 0;
  while(attempt++ < 30) {
    try {
      console.log('Checking if AVR is online..')
      await bravia.refreshActionList();
      console.log('AVR is online!');
      return;
    } catch (error) {
      if (attempt >= 10) {
        console.warn('Failed max retries while waiting for AVR to come online.', error);
        throw error;
      }
      console.log('AVR online check failed; waiting to retry', error);
      await Promise.delay(500);
    }
  }
}

export async function sleep(millis) {
  await Promise.delay(millis);
}
