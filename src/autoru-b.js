import { App } from "../../Users/dvosoev/Downloads/Telegram Desktop/node/src/app";
import process from 'process';
import {Autoru} from "../../Users/dvosoev/Downloads/Telegram Desktop/node/src/scenarios/autoru";

const config = {

    browser: {
        user: 'b',
        headless: false,
        devtools: false,
        proxy: {
            username: 'Epu7q8',
            password: 'o8PBxC'
        },
        args: [
            '--proxy-server=91.231.8.175:8000',
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

process.argv.forEach((value, index)=>{
    if(value === '--bot'){
        config.browser.user = process.argv[index + 1];
    }
});

(new App(config)).init().then(async (BOT) => {

});
