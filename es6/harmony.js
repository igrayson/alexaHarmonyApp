import HarmonyHubUtil from 'harmony-hub-util';

export default class HarmonyClient {
    constructor(host, deviceName) {
        this.host = host;
        this.deviceName = deviceName;
    }

    async runCommand(commandName) {
        console.log('Connecting to harmony hub...');
        const hutil = await new HarmonyHubUtil(this.host);
        try {
            console.log('Harmony connected; running command', this.deviceName, commandName);
            const result = await hutil.executeCommand(true, this.deviceName, commandName);
            if (!result) {
                throw new Error('Failed to run command.');
            }
        } finally {
            hutil.end();
        }
    }
}
