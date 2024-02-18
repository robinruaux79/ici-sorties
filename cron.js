import {openAgenda} from "./src/constants.js";
import https from "https";
import sha256 from "sha256";
import slug from "slug";

export const cronOpenAgenda = (eventsCollection) => {

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
                    return { ...e,
                        title: e.title.fr,
                        desc: e.description.fr,
                        loc: [e.latitude, e.longitude],
                        hash: sha256(e.title.fr + e.description.fr),
                        createdAt: new Date(e.createdAt).getTime(),
                        lang: 'fr',
                        slug: e.slug || slug(e.title.fr),
                        startsAt: new Date(e.firstDate + ' ' + e.firstTimeStart).getTime(),
                        endsAt: new Date(e.lastDate + ' ' + e.lastTimeStart).getTime()
                    };
                }).forEach((e) => {
                    (async () => {
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
                    setTimeout(() => openNewPage(1), openAgenda.timeout )
                else
                    setTimeout(() => openNewPage(page + 1), openAgenda.timeout )
            });
        });
    }

    return openNewPage(1);
}