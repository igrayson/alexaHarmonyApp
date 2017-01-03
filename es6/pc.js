import agent from 'superagent-bluebird-promise';
import _ from 'lodash';

export default class PCClient {
  constructor(host) {
    this.host = host;
  }

  async putToSleep() {
    await agent.post(`http://${this.host}:5709/sleep`);
  }

}
