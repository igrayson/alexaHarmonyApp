import HarmonyHubUtil from 'harmony-hub-util';

export default class HarmonyClient {
    constructor(host, deviceName) {
        this.host = host;
        this.deviceName = deviceName;
    }

    async runCommand(commandName) {
        if (!this.hutil) {
            this.hutil = await new HarmonyHubUtil(this.host);
        }
        console.log('Harmony connected; running command', this.deviceName, commandName);
        const result = await this.hutil.executeCommand(true, this.deviceName, commandName);
        if (!result) {
            throw new Error('Failed to run command.');
        }
    }
}
