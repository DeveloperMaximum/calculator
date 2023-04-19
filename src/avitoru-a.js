import { App } from "./app/index.js";
import process from 'process';
import {Autoru} from "./scenarios/autoru/index.js";

const config = {

    calculator: {
        api: 'http://192.168.254.91/api/',
    },
    browser: {
        user: 'a',
        headless: false,
        devtools: false,
        proxy: {
            username: 'SmtzNd',
            password: 'LrdTWh'
        },
        args: [
            '--proxy-server=193.124.187.220:8000',
            '--window-size=1240,1024',
            '--no-first-run',
            '--disable-sync',
            '--disable-images',
            '--disable-dev-shm-usage',
            '--disable-default-apps',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-client-side-phishing-detection',

            '--disable-accelerated-jpeg-decoding',
            '--enable-deferred-image-decoding',
            '--site-per-process',
            '--disable-dev-shm-usage',
        ],
        defaultViewport: {
            width: 1240,
            height: 1024
        }
    }

};

console.log(`Process ID: ${process.pid}`);
process.on('SIGHUP', () => console.log('Received: SIGHUP'));

process.on('beforeExit', (code) => {
    console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
    console.log('Process exit event with code: ', code);
});

(new App(config)).init().then(async (BOT) => {

});
