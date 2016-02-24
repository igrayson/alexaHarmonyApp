import agent from 'superagent-bluebird-promise';
import xmlParser from 'xml-parser';
import _ from 'lodash';

export const IRCC_COMMANDS = {
  'STR:PowerMain': 'AAAAAgAAADAAAAAVAQ==',
  'Mute': 'AAAAAgAAADAAAAAUAQ==',
  'Confirm': 'AAAAAgAAADAAAAAMAQ==',
  'Home': 'AAAAAgAAADAAAABTAQ==',
  'Display': 'AAAAAgAAADAAAABLAQ==',
  'Return': 'AAAAAwAAARAAAAB9AQ==',
  'Options': 'AAAAAwAAARAAAABzAQ==',
  'STR:FunctionPlus': 'AAAAAgAAALAAAABpAQ==',
  'STR:FunctionMinus': 'AAAAAgAAALAAAABqAQ==',
  'Play': 'AAAAAwAAARAAAAAyAQ==',
  'Pause': 'AAAAAwAAARAAAAA5AQ==',
  'Stop': 'AAAAAwAAARAAAAA4AQ==',
  'Next': 'AAAAAwAAARAAAAAxAQ==',
  'Prev': 'AAAAAwAAARAAAAAwAQ==',
  'STR:Shuffle': 'AAAAAwAAARAAAAAqAQ==',
  'STR:Repeat': 'AAAAAwAAARAAAAAsAQ==',
  'STR:FF': 'AAAAAwAAARAAAAA0AQ==',
  'STR:FR': 'AAAAAwAAARAAAAAzAQ==',
  'VolumeUp': 'AAAAAgAAADAAAAASAQ==',
  'VolumeDown': 'AAAAAgAAADAAAAATAQ==',
  'Up': 'AAAAAgAAALAAAAB4AQ==',
  'Down': 'AAAAAgAAALAAAAB5AQ==',
  'Left': 'AAAAAgAAALAAAAB6AQ==',
  'Right': 'AAAAAgAAALAAAAB7AQ==',
  'STR:Num1': 'AAAAAgAAADAAAAAAAQ==',
  'STR:Num2': 'AAAAAgAAADAAAAABAQ==',
  'STR:Num3': 'AAAAAgAAADAAAAACAQ==',
  'STR:Num4': 'AAAAAgAAADAAAAADAQ==',
  'STR:Num5': 'AAAAAgAAADAAAAAEAQ==',
  'STR:Num6': 'AAAAAgAAADAAAAAFAQ==',
  'STR:Num7': 'AAAAAgAAADAAAAAGAQ==',
  'STR:Num8': 'AAAAAgAAADAAAAAHAQ==',
  'STR:Num9': 'AAAAAgAAADAAAAAIAQ==',
  'STR:Num0': 'AAAAAgAAADAAAAAJAQ==',
  'STR:PureDirect': 'AAAAAwAABRAAAAB5AQ==',
}

export default class IRCCClient {
  constructor(host, discoverPort, commandPort) {
    this.host = host;
    this.discoverPort = discoverPort;
    this.commandPort = commandPort;
    this.actionDefs = undefined;
  }

  _headers() {
    return {
      'X-CERS-DEVICE-ID': 'TVSideView:30-75-12-a2-70-9d',
      'X-CERS-DEVICE-INFO': 'Android5.1.1/IRCCClient/D5803'
    };
  }

  async pullActionList() {
    if (!_.isUndefined(this.actionDefs)) {
      return;
    }
    this.actionDefs = { };
    const result = await agent.get(`http://${this.host}:${this.discoverPort}/actionList`)
      .set(this._headers());
    const xmlResult = xmlParser(result.text);
    if ('actionList' !== _.get(xmlResult, 'root.name')) {
      console.log('ActionList request did not resolve expected XML structure.')
      return;
    }
    console.log('ActionList XML retrieved.');

    this.actionDefs = _(xmlResult).get('root.children').reduce((defs, node) => {
      if (_.get(node, 'attributes.name')) {
        defs[node.attributes.name] = node.attributes.url;
      }
      return defs;
    }, {});

    console.log('Action definitions resolved:', this.actionDefs);
  }

  async getCommandList() {
    await this.pullActionList();
    if (!this.actionDefs.getRemoteCommandList) {
      throw new Error('No definition for "getRemoteCommandList" action.');
    }
    const result = await agent.get(this.actionDefs.getRemoteCommandList)
      .set(this._headers());

    console.log('result', result.status, result.text);
  }

  async getStatus() {
    await this.pullActionList();
    if (!this.actionDefs.getStatus) {
      throw new Error('No definition for "getStatus" action.');
    }
    const result = await agent.get(this.actionDefs.getSystemInformation)
      .set(this._headers());

    console.log('result', result.status, result.text);
  }

  async sendCommand(cmd) {
    const soapData = `<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
      <IRCCCode>${cmd}</IRCCCode>
    </u:X_SendIRCC>
  </s:Body>
</s:Envelope>`;

    console.log('sending', cmd);
    const result = await agent.post(`http://${this.host}:${this.commandPort}/upnp/control/IRCC`)
      .set('soapaction', '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"')
      .type('text/xml; charset=utf-8')
      .accept('gzip')
      .send(soapData);

    console.log('SendIRCC result:', result.status, result.text);

  }

  async register() {
    await this.pullActionList();
    if (!this.actionDefs.register) {
      throw new Error('No definition for "register" action.');
    }

    console.log('performing register', this.actionDefs.register);
    await agent.get(this.actionDefs.register)
      .set(this._headers())
      .auth('9916', '9916')
      .query({
        //GET /register?name=D5803+%28Video+%26+TV+SideView%29&registrationType=initial&deviceId=TVSideView%3A30-75-12-a2-70-9d&wolSupport=true HTTP/1.1\r\n
        name: 'D5803+(Video+&+TV+SideView)',
        registrationType: 'initial',
        deviceId: this._headers()['X-CERS-DEVICE-ID'],
        wolSupport: 'true'
      });
    // console.log(JSON.stringify(xmlResult, null, 2));
  }
}


const client = new IRCCClient('192.168.0.13', 50002, 50001);
(async function() {
  // await client.sendCommand(IRCC_COMMANDS['STR:PowerMain']);
  // await client.sendCommand('AAAAAgAAABoAAABaAw==');
  // await client.sendCommand(IRCC_COMMANDS.VolumeUp);
  // await client.sendCommand(IRCC_COMMANDS.VolumeUp);
  // await client.sendCommand(IRCC_COMMANDS.VolumeUp);
  // await client.sendCommand(IRCC_COMMANDS.VolumeUp);
})();
