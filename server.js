import fs from 'node:fs'
import express from 'express'
import {MongoClient} from 'mongodb'
import csrf from "csurf";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser"
import expressSession from "express-session"
import csrfDSC from 'express-csrf-double-submit-cookie'
import cluster from "node:cluster";
import process from "node:process";
import os from "node:os";
import {fileURLToPath} from 'url';

import MongoStore from 'connect-mongo';
import { readFile } from 'fs/promises';
import * as path from "path";
import {rand} from "./src/random.js";
import slug from "slug";
import sha256 from "sha256";
import {eventsPerPage} from "./src/constants.js";
import {createServer} from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readJSON = async (path) => {
    const json = JSON.parse(
        await readFile(
            new URL(path, import.meta.url)
        )
    );
    return json;
}

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

// check if the process is the master process
if(cluster.isMaster && isProduction){
    // get the number of available cpu cores
    const nCPUs = os.cpus().length;
    // fork worker processes for each available CPU core
    for(let i = 0; i< nCPUs; i++){
        cluster.fork()
    }
}else {

    // Connection URL
    const dbUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(dbUrl);

    // Database Name
    const dbName = 'ici';

    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const eventsCollection = db.collection("events");

    // Use connect method to connect to the server
    await client.connect();

    // Create http server
    const app = express()
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(cookieParser(isProduction ? 'ergRRà_546bbfg345fer45tyhtbmlke990eref' : 'secret'));
    app.use(expressSession({
        store: MongoStore.create({ mongoUrl: dbUrl })
    }));

    const csrfProtection = csrfDSC();
    app.use(csrfProtection)
    app.disable('etag');

    const templateHtml = isProduction
        ? fs.readFileSync('./dist/client/index.html', {encoding:'utf-8'})
        : fs.readFileSync('./index.html', {encoding:'utf-8'})

    const ssrManifest = isProduction
        ? fs.readFileSync('./dist/client/.vite/ssr-manifest.json', {encoding:'utf-8'})
        : undefined

    // Add Vite or respective production middlewares
    let vite
    if (!isProduction) {
        const {createServer} = await import('vite')
        vite = await createServer({
            server: {middlewareMode: true},
            appType: 'custom',
            base
        })
        app.use(vite.middlewares)
    } else {
        const compression = (await import('compression')).default
        const sirv = (await import('sirv')).default
        app.use(compression())
        app.use(base, sirv('./dist/client', {extensions: []}))
    }

    app.get('/api/events/nearby', (req, res) => {
        const owner = req.query.owner;
        console.log(owner, "owner");
        const l = req.query.lng?.split("-");
        const dnow = new Date().getTime();
        console.log(req.query.page);
        const p = (req.query.page || 1)-1;
        const match = owner ? { "owner": { "$eq": owner } } : {
            "lang": {"$eq": 'fr'},
            "$or" : [{"endsAt": {"$gte":dnow}}, {"endsAt": {"$eq": null}}]
//            "$or" : [{"startsAt": {"$lte":dnow}}, {"startsAt": {"$eq": null}}]
/*            "$and": [
                {,
] */
        };
        console.log(match);
        var MAX_TIMESTAMP = 8640000000000000;
        eventsCollection.aggregate([
            { "$match": match},
            { $sort: {"startsAt": 1, "createdAt":-1}} ]).skip(p * eventsPerPage).limit(eventsPerPage).toArray().then((events) => {
                console.log(events);
            res.json(events.map(e => {
                updateEventSummary(e, req.session.user || req.ip);
                return e;
            }));
        });
    });

    app.post('/api/event/:id/report', async (req, res) => {
        eventsCollection.findOneAndUpdate({"hash": {"$eq": req.params.id}}, {
            "$push": {reports: req.session.user || req.ip}
        }, { returnDocument: 'after' }).then(event => {
            updateEventSummary(event, req.session.user || req.ip);
            res.json({success: true, event});
        }).catch(e => {
            res.status(404).json({success: false});
        });
    });
    app.post('/api/event', (req, res) => {
        var bodyStr = '';
        req.on("data", function (chunk) {
            bodyStr += chunk.toString();
        });
        req.on("end", async function () {
            const event = JSON.parse(bodyStr);
            event.hash = sha256(event.title + event.description);
            event.slug = slug(event.title);
            event.owner = req.session.user;
            event.createdAt = new Date().getTime();
            if (typeof (event.lang) === 'string') {
                const l = event.lang.split("-");
                event.lang = l[0];
            } else {
                event.lang = 'fr';
            }
            await eventsCollection.findOne({'slug': {'$eq': event.slug}}).then(async duplicated => {
                if (duplicated) {
                    event.slug += rand(0, 9) + '';
                }
            })
            var tagError = false;
            event.desc.replace(/<([a-zA-Z][a-zA-Z0-9_-]*)\b[^>]*>(.*?)<\/\1>/g, function(m,m1,m2){
                // write data to result objcect
                if( !['p', 'div', 'h1', 'h2', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'img', 'b', 'i', 'u', 'blockquote'].includes(m1)){
                    tagError = true;
                }
                // replace with original = do nothing with string
                return m;
            });
            const dnow = new Date().getTime();
            const max = 10;
            console.log(req.session.events + "events deja créés !", event);
            const canCreate = (req.session.events || 0) < max || req.session.ts < dnow - 86400000;
            if (canCreate &&
                !tagError &&
                typeof(event.startsAt) === 'number' &&
                typeof(event.endsAt) === 'number' &&
                typeof(event.title) === 'string' && event.title?.length > 3 &&
                typeof(event.desc) === 'string' && event.desc.length <= 512 &&
                typeof(event.loc) === 'object' && typeof(event.loc.lat) === 'number' && typeof(event.loc.lng) === 'number' ) {
                const element = await eventsCollection.insertOne(event);
                event._id = element.insertedId;
                req.session.events = req.session.events ? req.session.events + 1 : 1;
                req.session.ts = new Date().getTime();
                req.session.save();
                updateEventSummary(event, req.session.user || req.ip);
                res.json({success: true, event: event})
            } else {
                res.json({success: false})
            }
        });

    });

    app.get('/issues', (req, res) => {
        fs.readFile('bugs.txt', (err, data) => {
            try {
                res.json({data: data});
            }catch (e){
                res.json({success: false});
            }
        });
    });

    app.use('*', async (req, res) => {
        const url = req.originalUrl.replace(base, '')
        let template
        let rendered
        if( !isProduction ) {
            template = await vite.transformIndexHtml(url, templateHtml)
            const ssrRender = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
            rendered = await ssrRender(url, ssrManifest)
        }else{
            template = templateHtml
            rendered = (await import('./dist/server/entry-server.js')).render
        }
        const html = template
            .replace(`<!--app-head-->`, rendered.head ?? '')
            .replace(`<!--app-html-->`, rendered.html ?? '')

        res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
    })

    // Start http server
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })

}

const updateEventSummary = (event, user) => {
    event.hasReported = event.reports?.includes(user);
    event.reports = undefined;
    event._id = undefined;
}
process.on('uncaughtException', function (exception) {
    console.error(exception);
    fs.appendFile('bugs.txt', JSON.stringify({ code: exception.code, message: exception.message, stack: exception.stack }), function (err) {
        if (err){
            throw err;
        }
    });
});