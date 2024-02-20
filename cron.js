import {openAgenda} from "./src/constants.js";
import https from "https";
import sha256 from "sha256";
import slug from "slug";
import {rand} from "./src/random.js";

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