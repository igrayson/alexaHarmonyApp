import lgtv2 from 'lgtv2';

export default class LgTvClient {
    constructor(host) {
        this.lgtv = lgtv2({ url: `ws://${host}:3000`});
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

    switchInput(inputId) {
        this.lgtv.request('ssap://tv/switchInput', { inputId });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.lgtv.connect((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}