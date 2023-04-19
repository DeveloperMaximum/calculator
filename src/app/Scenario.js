import { Cookie } from "../cookie/index.js";
import fetch from "node-fetch";

export default class Scenario {

    config;
    browser;
    page;

    constructor(browser, config = {}) {
        this.config = config;
        this.browser = browser;
        this.cookie = new Cookie(config);
    }

    async init(){
        let pages = await this.browser.pages();
        this.page = pages[0];

        await this.page.setDefaultTimeout(18000);
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36');
        return true;
    }

    async setCookiePage(url, pageIndex = 0){
        let pages = await this.browser.pages();
        let cookies = await this.cookie.get(url);
        await pages[pageIndex].setCookie(...cookies);
        return pages[pageIndex];
    }

    async existsInnerId(inner_id, url, resource_id){
        let response = await fetch('http://192.168.254.91/api/announcement?filter[inner_id]=' + inner_id + '&filter[url]=' + url + '&filter[resource_id]=' + resource_id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json;charset=utf-8'
            }
        });
        const exists = await response.json();
        return (exists.length > 0) ? exists[0] : false;
    }

    async sendToCollector(announcement){
        await fetch('http://192.168.254.91/api/announcement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(announcement)
        });
    }

    async sendUpdateToCollector(id, announcement){
        await fetch('http://192.168.254.91/api/announcement/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(announcement)
        });
    }

    async toPrint(string, page){
        let error_symbol = false;
        for (let i = 0; i < string.length; i++) {
            if(Math.random() < 0.2){
                error_symbol = true;
                await page.keyboard.press('Shift', {text: this.randomString(1), delay: this.randomSpeedPrint(500)});
                await page.keyboard.press('Backspace');
            }
            await page.keyboard.press('Shift', {text: string[i], delay: this.randomSpeedPrint()});
        }
        await page.keyboard.press('Enter');
    }

    randomString(length = 10){
        let alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
        let randomIndex = Math.floor(Math.random() * alphabet.length);
        return alphabet[randomIndex];
    }

    randomSpeedPrint(min = 200, max = 500){
        return Math.random() * (min - max) + max;
    }

    async randomMouseBehavior(min = 1000, max = 1000){
        let coords = {
            x: Math.random() * (min - max) + max,
            y: Math.random() * (min - max) + max
        };
        await this.page.mouse.move(coords.x, coords.y);
        await this.page.mouse.wheel({deltaY: coords.y});
        return true;
    }

    async scrollToElement(selector){
        await this.page.evaluate(() => document.querySelector(selector).scrollIntoView());
    }

    wait(seconds) {
        let waitTill = new Date(new Date().getTime() + seconds * 1000);
        while(waitTill > new Date()){}

    }

    last(collection) {
        return collection[collection.length - 1];
    }
}
