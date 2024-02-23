import {openAgenda} from "./src/constants.js";
import https from "https";
import sha256 from "sha256";
import slug from "slug";
import {rand} from "./src/random.js";

export const cronParis = (eventsCollection, timeout, maxPages) => {

    let i = 0;
    const int = setInterval(() => {
        if( i >= maxPages ) {
            clearInterval(int);
            return;
        }
        getParisPage(i);
        ++i;
    }, timeout);

    const getParisPage = (page) => {
        const limit = 100;
        const offset = limit*page;

        https.get("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records?order_by=date_start%20ASC&limit=" + limit + "&offset=" + offset + "&lang=fr", (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', async () => {
                const d = JSON.parse(data);
                d.results.map(e => {
                    return {
                        title: e.title,
                        desc: e.description + (e.price_detail || ''),
                        loc: e.lat_lon ? [e.lat_lon.lat, e.lat_lon.lon] : undefined,
                        hash: sha256(e.title?.fr && e.description?.fr ? e.title.fr + e.description.fr : new Date().getTime() + '' + rand(1, 10000)),
                        lang: 'fr',
                        address: e.address_street,
                        postalCode: e.address_zipcode,
                        city: e.address_city,
                        department: '',
                        region: 'Île-de-France',
                        slug: slug(e.title),
                        startsAt: new Date(e.date_start).getTime(),
                        endsAt: new Date(e.date_end).getTime()
                    };
                }).forEach((e) => {
                    (async () => {
                        if (e.loc === undefined)
                            return;
                        await eventsCollection.replaceOne({"slug": e.slug}, e,
                            {upsert: true});
                    })();
                });

            });
        });
    };
}
export const cronOpenAgenda = (eventsCollection, timeout) => {

    const openAgendas = (agendas) => {
        let i = 0;
        const int = setInterval(() => {
            if( i === agendas.length ) {
                clearInterval(int);
                return;
            }
            getEvents(agendas[i].uid);
            ++i;
        }, openAgenda.timeout);
    }
    const getEvents = (uid) => {
        https.get("https://openagenda.com/agendas/"+uid+"/events.json?lang=fr", (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', async () => {
                const d = JSON.parse(data);
                d.events.map(e => {
                    return {
                        title: e.title.fr,
                        desc: e.html.fr,
                        loc: e.latitude && e.longitude ? [e.longitude, e.latitude] : undefined,
                        hash: sha256(e.title?.fr && e.description?.fr ? e.title.fr + e.description.fr : new Date().getTime()+''+rand(1,10000)),
                        createdAt: new Date(e.createdAt).getTime(),
                        lang: 'fr',
                        address: e.address,
                        postalCode: e.postalCode,
                        city: e.city,
                        department: e.department,
                        region: e.region,
                        slug: e.slug || slug(e.title.fr),
                        startsAt: new Date(e.firstDate + ' ' + e.firstTimeStart).getTime(),
                        endsAt: new Date(e.lastDate + ' ' + e.lastTimeStart).getTime()
                    };
                }).forEach((e) => {
                    (async () => {
                        if(e.loc === undefined)
                            return;
                        await eventsCollection.replaceOne({"slug": e.slug}, e,
                        { upsert: true });
                    })();
                });
            });
        });
    };
    const openNewPage = (page) => {
        https.get("https://openagenda.com/agendas.json?page="+page, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                const events = JSON.parse(data);
                openAgendas(events?.agendas);
                if( page > openAgenda.maxPages )
                    setTimeout(() => openNewPage(1), timeout )
                else
                    setTimeout(() => openNewPage(page + 1), timeout )
            });
        });
    }

    return openNewPage(1);
}