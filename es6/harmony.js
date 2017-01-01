import HarmonyHubUtil from 'harmony-hub-util';

export default class HarmonyClient {
    constructor(host, deviceName) {
        this.host = host;
        this.deviceName = deviceName;
    }

    async runCommand(commandName) {
        if (!this.hutil) {
            this.hutil = await HarmonyHubUtil(this.host);
        }
        const result = await this.hutil.executeCommand(true, this.deviceName, commandName);
        if (!result) {
            throw new Error('Failed to run command.');
        }
    }
}