import puppeteer from "puppeteer";
import { Avitoru } from "../scenarios/avitoru/index.js";

export default class App {

    config;
    browser;

    constructor(config = {}) {
        this.config = config;
        this.browser = false;
    }

    async init() {
        this.browser = await puppeteer.launch(this.config.browser);
        let pages = await this.browser.pages();
        await pages[0].authenticate(this.config.browser.proxy);

        const autoru = new Avitoru(this.browser, this.config);
        try {
            if(await autoru.run()){
                await this.browser.close();
                await this.init();
            }
        } catch (e) {
            await this.browser.close();
            await this.init();
        }

        return this;
    };

    async close(){
        return await this.browser.close();
    }
}
