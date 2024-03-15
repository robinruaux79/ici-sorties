import {cronOptions} from "./src/constants.js";
import https from "https";
import sha256 from "sha256";
import slug from "slug";
import {rand} from "./src/random.js";

import zmq from "zeromq";

const sock = new zmq.Publisher

await sock.bind("tcp://127.0.0.1:7601")

export const cronFestivals = (eventsCollection, timeout) => {

    const nbPerPage = 100;

    let count = null;
    let i = 0;
    const int = setInterval(() => {
        if( i >= (count ? count/nbPerPage : 1) ) {
            i = 0;
            count = null;
            return;
        }
        getFestivalsPage(i);
        ++i;
    }, timeout);

    const getFestivalsPage = (page) => {
        const offset = nbPerPage*page;
        https.get("https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/festivals-global-festivals-_-pl/records?limit=" + nbPerPage + "&offset=" + offset + "&lang=fr", (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', async () => {
                const d = JSON.parse(data);
                count = d.total_count;
                d.results.map(e => {
                    const p = e.periode_principale_de_deroulement_du_festival;
                    if( p === 'Saison (21 juin - 5 septembre)'){
                        e.season = 1;
                    }else if( p === 'Après-saison (6 septembre - 31 décembre)'){
                        e.season = 2;
                    }else{
                        e.season = 3;
                    }
                    return {
                        title: e.nom_du_festival,
                        desc: "<ul>"
                            +(e.site_internet_du_festival ? "<li>Site internet : <a target='_blank' href='"+e.site_internet_du_festival+"'>"+e.site_internet_du_festival+"</a></li>" : "") +
                        (e.adresse_e_mail ? "<li>Email : <a href='mailto:"+e.adresse_e_mail+"'>"+e.adresse_e_mail+"</a></li>" : "")+
                    "</ul>",
                        loc: e.geocodage_xy ? [e.geocodage_xy.lon, e.geocodage_xy.lat] : undefined,
                        hash: sha256(e.title?.fr && e.description?.fr ? e.title.fr + e.description.fr : new Date().getTime() + '' + rand(1, 10000)),
                        lang: 'fr',
                        address: e.adresse_postale  ,
                        postalCode: e.code_insee_commune,
                        city: e.commune_principale_de_deroulement,
                        department: e.departement_principal_de_deroulement,
                        region: e.region_principale_de_deroulement,
                        slug: slug(e.nom_du_festival+'-'+e.commune_principale_de_deroulement),
                        season: e.season
                    };
                }).forEach((e) => {
                    (async () => {
                        if (e.loc === undefined)
                            return;
                        const res = await eventsCollection.replaceOne({"slug": e.slug}, e,
                            {upsert: true});
                        if( res.modifiedCount )
                           await sock.send(["eventCreated", JSON.stringify({event})]);

                    })();
                });

            });
        });
    };
}
export const cronParis = (eventsCollection, timeout) => {

    const nbPerPage = 100;

    let count = null;
    let i = 0;
    const int = setInterval(() => {
        if( i >= (count ? count/nbPerPage : 1) ) {
            i = 0;
            count = null;
            return;
        }
        getParisPage(i);
        ++i;
    }, timeout);

    const getParisPage = (page) => {
        const offset = nbPerPage*page;
        https.get("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records?order_by=date_start%20ASC&limit=" + nbPerPage + "&offset=" + offset + "&lang=fr", (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', async () => {
                const d = JSON.parse(data);
                count = d.total_count;
                d.results.map(e => {
                    const start = new Date(e.date_start).getTime();
                    const end = new Date(e.date_end).getTime()
                    return {
                        title: e.title,
                        desc: e.description + (e.price_detail || ''),
                        loc: e.lat_lon ? [e.lat_lon.lon, e.lat_lon.lat] : undefined,
                        hash: sha256(e.title?.fr && e.description?.fr ? e.title.fr + e.description.fr : new Date().getTime() + '' + rand(1, 10000)),
                        lang: 'fr',
                        address: e.address_street,
                        postalCode: e.address_zipcode,
                        city: e.address_city,
                        department: '',
                        region: 'Île-de-France',
                        slug: slug(e.title),
                        startsAt: start > 0 ? start: undefined,
                        endsAt: end > 0 ? end : undefined,
                        season: 0
                    };
                }).forEach((e) => {
                   (async () => {
                        if (e.loc === undefined)
                            return;
                       const res = await eventsCollection.replaceOne({"slug": e.slug}, e,
                            {upsert: true});
                       if( res.modifiedCount )
                          await sock.send(["eventCreated", JSON.stringify({event})]);

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
        }, cronOptions.timeout);
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
                    const start = new Date(e.firstDate + ' ' + e.firstTimeStart).getTime();
                    const end = new Date(e.lastDate + ' ' + e.lastTimeStart).getTime();
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
                        startsAt: start > 0 ? start: undefined,
                        endsAt: end > 0 ? end : undefined,
                        season: 0
                    };
                }).forEach((e) => {
                    (async () => {
                        if(e.loc === undefined)
                            return;
                        const res = await eventsCollection.replaceOne({"slug": e.slug}, e,
                        { upsert: true });
                        if( res.modifiedCount )
                            await sock.send(["eventCreated", JSON.stringify({event})]);
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
                if( page > cronOptions.maxPages )
                    setTimeout(() => openNewPage(1), timeout )
                else
                    setTimeout(() => openNewPage(page + 1), timeout )
            });
        });
    }

    return openNewPage(1);
}