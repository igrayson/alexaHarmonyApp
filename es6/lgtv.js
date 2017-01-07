import lgtv2 from 'lgtv2';

export default class LgTvClient {
    constructor(host) {
        this.host = host;
    }

    getInputs() {
        return new Promise((resolve, reject) => {
            this.lgtv.request('ssap://tv/getExternalInputList', (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        })
    }

    pause() {
        this.lgtv.request('ssap://media.controls/pause');
    }

    play() {
        this.lgtv.request('ssap://media.controls/play');
    }

    switchInput(inputId) {
        this.lgtv.request('ssap://tv/switchInput', { inputId });
    }

    launchApp(appId) {
        this.lgtv.request('ssap://system.launcher/launch', { id: appId });
    }

    async turnOff() {
        this.lgtv.request('ssap://system/turnOff');
    }

    connect() {
        console.log('Connecting to', this.host);
        this.lgtv = lgtv2({ url: `ws://${this.host}:3000`});
    }
}