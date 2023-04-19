import fetch from "node-fetch";
import Scenario from "../../app/Scenario.js";

export default class Autoru extends Scenario {

    async run(){
        const url = 'https://auto.ru/';
        let pages = await this.browser.pages();
        let PAGE = pages[0];

        let cookies = await this.cookie.get(url);
        await PAGE.setCookie(...cookies);
        await PAGE.setDefaultTimeout(10000);

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
        await PAGE.waitForTimeout(2000);
        await this.cookie.save(pages[0]);
        await PAGE.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36');

        /*****************************************************************/

        // todo: выбираем регион
        await PAGE.waitForSelector('.GeoSelect__title-shrinker');
        await PAGE.click('.GeoSelect__title-shrinker');
        await PAGE.click('.GeoSelectPopup .TextInput__control');
        await this.toPrint('Россия', PAGE);
        await PAGE.click('.GeoSelectPopup .Button_color_whiteHoverBlue');
        await PAGE.waitForTimeout(2000);


        // todo: применяем фильтр
        await PAGE.waitForSelector('button.Button_width_full');
        await PAGE.evaluate(() => document.querySelector('button.Button_width_full').scrollIntoView());
        await PAGE.click('button.Button_width_full');
        await PAGE.waitForTimeout(2000);


        // todo: сортируем выдачу
        await PAGE.goto('https://auto.ru/cars/used/?sort=cr_date-desc&top_days=1', { referer: "https://auto.ru/cars/used/?sort=cr_date-desc", waitUntil: "domcontentloaded" });
        await PAGE.waitForTimeout(2000);
        await PAGE.waitForTimeout(2000);


        // todo: собираем все ссылки с объявлениями
        await PAGE.waitForSelector('.ListingCars_outputType_list .ListingItemTitle__link');
        let links = await PAGE.$$eval('.ListingCars_outputType_list .ListingItemPrice__link', el => el.map(x => {
            return {
                href: x.getAttribute('href'),
                price: Number.parseInt(x.innerText?.replace(/(\s)/g, ''))
            };
        }));

        for (let i = 0; i < 10; i++) {


            // todo: проверяем ссылку, если авто новый, то пропускаем
            if(links[i].href.indexOf('cars/new') !== -1) {
                continue;
            }


            // todo: получаем ID объявления
            let link_array = links[i].href.split('/');
            let last_element_array = link_array[link_array.length - 2].split('-');
            let id = last_element_array[0];


            // todo: проверяем наличие объявления в БД
            let exists = await this.existsInnerId(id, links[i].href, 5);
            if(exists !== false){
                const link = links[i].href;
                console.log('Объявление ' + id + ' уже есть в коллекторе (' + exists.id + ')');
                await this.sendUpdateToCollector(exists.id, { price: links[i].price });
                console.log('Обновили данные объявления ' + exists.id + ', ' + links[i].price);
                continue;
            }


            // todo: открываем объявление по ссылке
            console.log('Переходим ' + id);
            await PAGE.goto(links[i].href, { waitUntil: "domcontentloaded" });
            await PAGE.waitForTimeout(2000);


            // todo: получаем данные автомобиля
            await PAGE.waitForSelector('.ButtonReport');
            let car = await PAGE.evaluate(() => {
                const lastChildText = (selector) => {
                    try {
                        let collection = document.querySelectorAll(selector);
                        return collection[collection.length - 1]?.innerText;
                    }catch(e){
                        return '';
                    }
                };

                let c = {};
                c.inner_id = document.querySelector('.CardHead__id')?.innerText.replace(/№ /i, '');
                c.name = document.querySelector('.CardHead__title')?.innerText;
                c.description = document.querySelector('.CardDescriptionHTML')?.innerText;

                c.price = document.querySelector('.OfferPriceCaption__price')?.innerText.replace(/(\s)/g, '');
                c.price = Number.parseInt(c.price);

                let crumbs = document.querySelectorAll('.CardBreadcrumbs__item');
                c.brand = crumbs[2].innerText;
                c.model = crumbs[3].innerText;

                c.generation = document.querySelector('h1.CardHead__title')?.innerText;
                c.generation = c.generation.replace(c.brand, "")?.trim();
                c.generation = c.generation.replace(c.model, "")?.trim();
                if(c.generation === '') c.generation = null;

                c.year = lastChildText('.CardInfoRow_year span');
                c.year = Number.parseInt(c.year);

                c.mileage = lastChildText('.CardInfoRow_kmAge span').replace(/(\s)/g, '');
                c.mileage = Number.parseInt(c.mileage);

                c.views = document.querySelector('.CardHead__views')?.innerText;
                c.views = Number.parseInt(c.views);

                c.body = lastChildText('.CardInfoRow_bodytype span');
                c.color = lastChildText('.CardInfoRow_color span');

                let engine = lastChildText('.CardInfoRow_engine span').split('/');
                engine = { displacement: engine[0].trim(), capacity: engine[1].trim(), fuel: engine[2].trim() };
                c.engine_fuel = engine.fuel;
                c.engine_capacity = Number.parseInt(engine.capacity);
                c.engine_displacement = Number.parseFloat(engine.displacement);

                c.equip_count = lastChildText('.CardInfoRow_complectationOrEquipmentCount span');
                c.equip_count = Number.parseInt(c.equip_count);

                c.tax = lastChildText('.CardInfoRow_transportTax span')?.replace(/(\s)/g, '').trim();
                c.tax = Number.parseInt(c.tax);

                c.transmission = lastChildText('.CardInfoRow_transmission span');
                c.drive = lastChildText('.CardInfoRow_drive span');
                c.wheel = lastChildText('.CardInfoRow_wheel span');
                c.state = lastChildText('.CardInfoRow_state span');

                c.owners = lastChildText('.CardInfoRow_ownersCount span');
                c.owners = Number.parseInt(c.owners);

                c.pts = lastChildText('.CardInfoRow_pts span');
                c.custom = lastChildText('.CardInfoRow_customs span');
                c.vin = lastChildText('.CardInfoRow_vin span');
                c.gnumber = lastChildText('.CardInfoRow_licensePlate span');

                c.rating = document.querySelector('.ReviewRating__number')?.innerText.replace(',', '.');
                c.rating = Number.parseFloat(c.rating);

                c.city = document.querySelector('.MetroListPlace__regionName.MetroListPlace_nbsp')?.innerText;
                c.address = document.querySelector('.MetroListPlace__address.MetroListPlace_nbsp')?.innerText;

                return c;
            });
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
                car.latitude = '';
                car.longitude = '';
            }
            await PAGE.waitForTimeout(1000);
            await PAGE.mouse.click(50, 150);
            console.log('Получили координаты ' + car.latitude + ', ' + car.longitude);


            // todo: добавляем мета-данные
            car.url = links[i].href;
            car.resource = 'auto.ru';


            // todo: сохранем данные в коллекторе
            await this.sendToCollector(car);
            await PAGE.waitForTimeout(300);
            console.log('Сохранено объявление ' + car.inner_id);


            // todo: возвращаемся к списку объявлений
            await PAGE.goBack();
            await PAGE.waitForTimeout(2000);
            console.log('Возвращаемся к списку объявлений');
        }

        /*****************************************************************/


        // todo: сохраняем результат и перезапускаем сценарий
        console.log('Перезапускаем сценарий...');
        await this.cookie.save(pages[0]);
        return true;
    };
}
