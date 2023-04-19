import fetch from "node-fetch";
import Scenario from "../../app/Scenario.js";

export default class Avitoru extends Scenario {

    async run(){
        const url = 'https://drom.ru/';
        let pages = await this.browser.pages();
        let PAGE = pages[0];

        let cookies = await this.cookie.get(url);
        await PAGE.setCookie(...cookies);
        await PAGE.setDefaultTimeout(5000);


        await PAGE.setRequestInterception(true);
        PAGE.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
                //req.abort();
                req.continue();
            } else {
                req.continue();
            }
        });

        await PAGE.goto(url, { waitUntil: "domcontentloaded" });
        await PAGE.waitForTimeout(3000);
        await this.cookie.save(pages[0]);
        //return true;
        await PAGE.waitForTimeout(2000);
        await this.cookie.save(pages[0]);
        await PAGE.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36');

        /*****************************************************************/

        // todo: выбираем регион
        console.log('1');
        const firstChildText = (selector) => {
            try {
                let collection = document.querySelectorAll(selector);
                return collection[0];
            }catch(e){
                return '';
            }
        };
        console.log('2');

        await PAGE.waitForSelector('[data-ga-stats-name="topmenu_sales"]');
        await PAGE.click('[data-ga-stats-name="topmenu_sales"]');
        await PAGE.waitForTimeout(2000);


        // todo: применяем фильтр
        await PAGE.waitForSelector('[value="2"]');
        // await PAGE.evaluate(() => document.querySelector('button.Button_width_full').scrollIntoView());
        await PAGE.click('[value="2"]');
        await PAGE.waitForTimeout(2000);
        let url_go = 'https://spb.drom.ru/auto/used/all/';
        var now = new Date();
        console.log(now.getMinutes());
        if(now.getMinutes()>=0){
            url_go = 'https://auto.drom.ru/region59/used/all/';
        }
        if(now.getMinutes()>=0){
            url_go = 'https://auto.drom.ru/region59/used/all/?distance=1000';
        }
        if(now.getMinutes()>=10){
            url_go = 'https://auto.drom.ru/region55/used/all/';
        }
        if(now.getMinutes()>=15){
            url_go = 'https://auto.drom.ru/region55/used/all/?distance=1000';
        }
        if(now.getMinutes()>=20){
            url_go = 'https://novosibirsk.drom.ru/auto/used/all/';
        }
        if(now.getMinutes()>=25){
            url_go = 'https://auto.drom.ru/region72/used/all/';
        }
        if(now.getMinutes()>=30){
            url_go = 'https://auto.drom.ru/region72/used/all/?distance=1000';
        }

        if(now.getMinutes()>=35){
            url_go = 'https://auto.drom.ru/region38/used/all/?distance=1000';
        }
        if(now.getMinutes()>=40){
            url_go = 'https://auto.drom.ru/region24/used/all/';
        }

        if(now.getMinutes()>=43){
            url_go = 'https://auto.drom.ru/region86/used/all/';
        }

        if(now.getMinutes()>=45){
            url_go = 'https://auto.drom.ru/region86/used/all/?distance=1000';
        }

        if(now.getMinutes()>=50){
            url_go = 'https://auto.drom.ru/used/all/page4/';
        }
        if(now.getMinutes()>=55){
            url_go = 'https://auto.drom.ru/used/all/page5/';
        }


        // todo: сортируем выдачу
        await PAGE.goto(url_go, { referer: "https://auto.drom.ru/", waitUntil: "domcontentloaded" });
        await PAGE.waitForTimeout(2000);

        // todo: собираем все ссылки с объявлениями
        await PAGE.waitForSelector('[data-ga-stats-name="dateasc"]');
        let links = await PAGE.$$eval('.css-1173kvb .css-3jcp5o', el => el.map(x => {
            return {
                href: x.getAttribute('href'),
                price: Number.parseInt(x.querySelector('[data-ftid="bull_price"]')?.innerText.replace(/( )/g,''))
            };
        }));
        await PAGE.waitForTimeout(1000);
        for (let i = 0; i < 20; i++) {

            console.log('Итерация'+i);
            // todo: проверяем ссылку, если авто новый, то пропускаем
            if(links[i].href.indexOf('cars/new') !== -1) {
                continue;
            }


            // todo: получаем ID объявления
            let link_array = links[i].href.split('/');
            let last_element_array = link_array[link_array.length - 2].split('-');
            let id = link_array[link_array.length - 1].replace('.html','');
            console.log('ИД'+id);


            // todo: проверяем наличие объявления в БД
            let exists = await this.existsInnerId(id, links[i].href, 6);//5 автору
            if(exists !== false){
                const link = links[i].href;
                console.log('Объявление ' + id + ' уже есть в коллекторе (' + exists.id + ')');
                await this.sendUpdateToCollector(exists.id, { price: links[i].price });
                console.log('Обновили данные объявления ' + exists.id + ', ' + links[i].price);
                continue;
            }


            // todo: открываем объявление по ссылке
            console.log('Переходим ' + id);
            if(i>0){
                await PAGE.goto(links[i].href, { waitUntil: "domcontentloaded",  referer: links[i-1].href });
            } else {
                await PAGE.goto(links[i].href, { waitUntil: "domcontentloaded" });
            }

            await PAGE.waitForTimeout(2000);


            // todo: получаем данные автомобиля
            console.log(3);
            await PAGE.waitForSelector('.css-qxc9at');
            console.log(4);
            await PAGE.waitForTimeout(1000);
            await PAGE.waitForSelector('.css-qxc9at');
            console.log(5);
            let car = await PAGE.evaluate(() => {


                const pause = (async () => {
                    let waitTill =   new Date(new Date().getTime() + 2 * 1000);
                    while(waitTill > new Date()){}
                    return true;
                });

                const lastChildText = (selector) => {
                    try {
                        let collection = document.querySelectorAll(selector);
                        return collection[collection.length - 1]?.innerText;
                    }catch(e){
                        return '';
                    }
                };

                let c = {};
                let string = document.querySelector('[data-drom-module="bull-page"]').getAttribute('data-drom-module-data');
                let arr_main = JSON.parse(string);

                c.city = arr_main.geoInfo[0]?.text;
                c.city = c.city.split(',');
                c.city = c.city[0];
                pause();

                c.inner_id = 10;//ID объявления
                console.log(c.inner_id);
                console.log(7);
                c.name = document.querySelector('h1 .css-ik080n')?.innerText;
                console.log(c.name);
                c.description = document.querySelector('.css-1j8ksy7  .css-ik080n')?.innerText;
                console.log(c.description);
                c.price = document.querySelector('.css-10qq2x7')?.innerText.replace(/(\s)/g, '');
                c.price = Number.parseInt(c.price);
                console.log(c.price);
                let crumbs = document.querySelectorAll('.e2rnzmt0');
                c.brand = crumbs[2].innerText;
                console.log(c.brand);
                c.model = crumbs[3].innerText;
                console.log(c.model);
                c.generation = document.querySelector('[data-ga-stats-name="generation_link"]')?.innerText;
                if(c.generation === '') c.generation = null;
                console.log(c.generation);
                c.year = document.querySelector('h1 .css-ik080n')?.innerText;
                c.year = c.year.replace(/[^\d]/g, '');
                let year = Number.parseInt(c.year.toString().slice(-4));
                c.year = year;
                console.log(c.year);

                let props = document.querySelectorAll('.css-7whdrf');
                console.log('Пробег');
                c.mileage = Number.parseInt(props[6]?.innerText.replace(' ',''));
                if(c.mileage === '')  c.mileage = null;
                console.log(c.mileage);

                c.views = document.querySelector('.css-14wh0pm')?.innerText;
                c.views = Number.parseInt(c.views);
                console.log(c.views);
                let allnames = document.querySelectorAll('.ezjvm5n0');

                let pos = 0;
                allnames.forEach((element) => {
                    if(element){
                        console.log(element);
                        //c.vin = element.payload.frameNumber;
                        if(element?.innerHTML.indexOf('Двигатель') != -1){
                            console.log('Найден двигатель');
                            console.log(props[pos]?.innerText);
                            c.engine_fuel = props[pos]?.innerText.split(',')[0].trim();
                            c.engine_capacity = props[pos]?.innerText.split(',')[1].trim();
                            c.engine_capacity = Number.parseFloat(c.engine_capacity);
                        }
                        if(element?.innerHTML.indexOf('Мощность') != -1){
                            console.log('Найдена мощность');
                            console.log(props[pos]?.innerText);
                            c.engine_displacement = props[pos]?.innerText.split(',')[0].trim();
                            c.engine_displacement = Number.parseInt(c.engine_displacement);
                        }
                        if(element?.innerHTML.indexOf('Коробка передач') != -1){
                            c.transmission = props[pos]?.innerText;
                            console.log(c.transmission);
                        }
                        if(element?.innerHTML.indexOf('Тип кузова') != -1){
                            c.body = props[pos]?.innerText;
                            console.log(c.body);
                            console.log('Тип кузова');
                        }
                        if(element?.innerHTML.indexOf('Цвет') != -1){
                            c.color = props[pos]?.innerText;
                            console.log(c.color);
                        }
                        if(element?.innerHTML.indexOf('Пробег') != -1){
                            c.mileage = Number.parseInt(props[pos]?.innerText.replace(' ',''));
                            if(c.mileage === '')  c.mileage = null;
                            console.log(c.mileage);
                        }
                        if(element?.innerHTML.indexOf('Руль') != -1){
                            c.wheel = props[pos]?.innerText;
                            console.log('Руль');
                        }
                        if(element?.innerHTML.indexOf('Привод') != -1){
                            c.drive = props[pos]?.innerText;
                            console.log(c.drive);
                        }
                    }
                    pos++;
                    console.log(pos);
                })


                return c;
            });

            car.inner_id = id;
            console.log('Получили данные объявления ' + id + ', ' + car.brand + ', ' + car.model + ', ' + car.generation + ', ' + car.year);


            // todo: получаем данные для звонка
            try {
                await PAGE.waitForSelector('.OfferPhone_button');
                await PAGE.hover('.OfferPhone_button');
                await PAGE.click('.OfferPhone_button');
                await PAGE.waitForSelector('.SellerPopup__phonesContainer');
                let seller = await PAGE.evaluate(() => {
                    try {
                        return {
                            name: document.querySelector('.SellerPopupHeader__sellerName')?.innerText,
                            phone: document.querySelector('.SellerPopup__phoneNumber')?.innerText.replace(/[\s\-]/g, '')
                        };
                    } catch {
                        return {name: null, phone: null};
                    }
                });
                car.seller_name = seller.name;
                car.seller_phone = seller.phone;
            } catch {
                car.seller_name = null;
                car.seller_phone = null;
            }
            await PAGE.waitForTimeout(1000);
            await PAGE.mouse.click(50, 150);
            console.log('Получили данные владельца ' + car.seller_phone + ', ' + car.seller_name);

            // todo: получаем координаты
            try {
                await PAGE.waitForSelector('.Link.CardSellerNamePlace__place');
                await PAGE.hover('.Link.CardSellerNamePlace__place');
                await PAGE.waitForTimeout(500);
                await PAGE.click('.Link.CardSellerNamePlace__place');
                await PAGE.waitForSelector('.SellerPopupFooter__taxiButton');
                let coords = await PAGE.evaluate(() => {
                    try {
                        let coords = {latitude: 0, longitude: 0};
                        let href = document.querySelector('.SellerPopupFooter__taxiButton')?.getAttribute('href');
                        if(href){
                            let url = new URL(href);
                            coords.latitude = url.searchParams.get('end-lat');
                            coords.longitude = url.searchParams.get('end-lon');
                        }
                        return coords;
                    } catch {
                        return {latitude: 0, longitude: 0};
                    }
                });
                car.latitude = coords.latitude;
                car.longitude = coords.longitude;
            } catch {
                car.latitude = null;
                car.longitude = null;
            }
            await PAGE.waitForTimeout(1000);
            console.log('Получили координаты ' + car.latitude + ', ' + car.longitude);


            // todo: добавляем мета-данные
            car.url = links[i].href;
            car.resource = 'drom.ru';


            // todo: сохранем данные в коллекторе
            console.log(car);
            await this.sendToCollector(car);
            await PAGE.waitForTimeout(300);
            console.log('Сохранено объявление ' + car.inner_id);


            // todo: возвращаемся к списку объявлений
            await PAGE.waitForTimeout(5000);
            console.log('Возвращаемся к списку объявлений');
        }

        /*****************************************************************/


        // todo: сохраняем результат и перезапускаем сценарий
        console.log('Перезапускаем сценарий...');
        await this.cookie.save(pages[0]);
        return true;
    };
}
