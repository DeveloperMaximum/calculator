import fs from "fs";


export default class Cookie {

    config = {};

    constructor(config = {}) {
        this.config = config;
    }

    async save(page){
        let url = new URL(page.url());
        const cookies = await page.cookies();
        const cookieString = JSON.stringify(cookies);
        fs.writeFileSync(this.getCookieFile(url.host), cookieString);
        return url.host;
    }

    async get(link){
        let url = new URL(link);
        let file = this.getCookieFile(url.host);
        if (fs.existsSync(file)) {
            let cookiesString = fs.readFileSync(file, 'utf8');
            return JSON.parse(cookiesString);
        }else{
            return [];
        }
    }

    getCookieFile(host){
        return 'data/bots/' + this.config.browser.user + '/cookies/' + host;
    }
}
