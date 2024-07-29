import fs from 'node:fs'
import express from 'express'
import ExpressSitemap from 'express-sitemap-xml';
import {MongoClient} from 'mongodb'
import { RateLimiterMongo } from 'rate-limiter-flexible';
import {OAuth2Client} from 'google-auth-library';
import nodemailer from "nodemailer";
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
import zmq from "zeromq";

import {
    contactEmail,
    eventsPerPage,
    maxEventsPerUser,
    maxReportsBeforeStateChange, minQueryChars,
    cronOptions, pointsPerUserPerSecond, isHttps
} from "./src/constants.js";
import {createServer} from "vite";
import http from "http";
import {cronFestivals, cronOpenAgenda, cronParis} from "./cron.js";
import https from "https";
import util from "util";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretsDir = process.env.SECRETS_DIR || './';
const googleAuthFilepath = secretsDir + 'googleAuth.json';

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
    },
});

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
const domain = process.env.DOMAIN || 'localhost';
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const baseUrl = (isHttps ? "https://":"http://") + domain;

// check if the process is the master process
if(cluster.isMaster && isProduction){

    const sock = new zmq.Publisher

    await sock.bind("tcp://127.0.0.1:7602")

    // get the number of available cpu cores
    const nCPUs = os.cpus().length;
    // fork worker processes for each available CPU core
    for(let i = 0; i< nCPUs; i++){
        const p = cluster.fork()
        p.on('message', async function (d) {
//            console.log(d);
            await sock.send([d.group, d.msg]);
        });
    }
}else {

    const keys = await readJSON(googleAuthFilepath);
    const oAuth2Client = new OAuth2Client(
        keys.web.client_id,
        keys.web.client_secret,
        domain+"/oauth/google/callback");

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile',
    });


    // Connection URL
    const dbUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(dbUrl, { maxPoolSize: 20 });

    // Database Name
    const dbName = 'ici';

    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const eventsCollection = db.collection("events");

    const opts = {
        storeClient: Promise.resolve(client),
        dbName: dbName,
        points: isProduction ? pointsPerUserPerSecond : 250, // Number of points
        duration: 1, // Per second(s)
    };

    const rateLimiterMongo = new RateLimiterMongo(opts);

    const rateLimiterMiddleware = (req, res, next) => {
        rateLimiterMongo.consume(req.sessionID || req.ip)
            .then(() => {
                next();
            })
            .catch(() => {
                res.status(429).send('Too Many Requests');
            });
    };

    // Use connect method to connect to the server
    await client.connect();

    // Create http server
    const app = express()
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(cookieParser(isProduction ? 'ergRRà_546bbfg345fer45tyhtbmlke990eref' : 'secret'));
    app.use(expressSession({
        store: MongoStore.create({ mongoUrl: dbUrl })
    }));
    app.use(rateLimiterMiddleware);

    const csrfProtection = csrfDSC();
    app.use(csrfProtection)
    app.disable('etag');

    const allEvents = await eventsCollection.find().toArray();
    const sitemapMap = [];
    allEvents.map(m => m.slug).forEach(u => {
        sitemapMap.push('/event/'+u);
    });

    app.use(ExpressSitemap(async () => {
        return ["/",'/events/nearby',
            '/events/nearby?sort=start',
            '/legals',
            '/credits', ...sitemapMap ];
    }, "https://ici.primals.net"))

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

    app.get('/sitemap.xml', function(req, res) {
        res.header('Content-Type', 'application/xml');
        sitemap.XMLtoWeb(res);
    });


    app.get('/oauth/google', (req,res) => {
        res.json({loggedIn: !!req.session.user, authUrl: authorizeUrl });
    });

    app.get('/oauth/google/callback',async (req,res) => {
        const code = req.query.code;
        res.set('Content-Type', 'text/html');
        if( code ){
            // Now that we have the code, use that to acquire tokens.
            const r = await oAuth2Client.getToken(code);
            // Make sure to set the credentials on the OAuth2 client.
            oAuth2Client.setCredentials(r.tokens);

            const dataGoogle = await oAuth2Client.request({url: "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"});
            const { data } = dataGoogle;

            req.session.user = data.id;
            req.session.save();

            res.send(Buffer.from('Vous êtes bien authentifié ! Redirection...'));
        }else{
            console.log(req.query);
            res.send(Buffer.from('Authentification en erreur.'));
        }
    });


    app.get('/api/events/nearby', (req, res) => {
        const owner = req.query.owner;
        const dnow = new Date().getTime();

        const p = (req.query.page || 1)-1;
        let wheres = [];
        if( req.query.start || req.query.end ) {

            const now = new Date();
            /*const start = new Date();
            if( req.query.start ){
                start.setTime(parseInt(req.query.start, 10) || 0);
            }else{
                start.setMonth(0);
                start.setDate(1);
            }
            const end = new Date();
            if( req.query.end)
                end.setTime(parseInt(req.query.end, 10));
            else{
                end.setMonth(11);
                end.setDate(31);
            }
            const saison = new Date();
            saison.setMonth(5);
            saison.setDate(21);
            saison.setFullYear(now.getFullYear())
            const apresSaison = new Date();
            apresSaison.setMonth(8);
            apresSaison.setDate(5);
            apresSaison.setFullYear(now.getFullYear());
            const as =
                ((start.getMonth() === saison.getMonth() && start.getDate() < saison.getDate()) || start.getMonth() < saison.getMonth());
            const s = !as && ((start.getMonth() === apresSaison.getMonth() && start.getDate() <= apresSaison.getDate()) || start.getMonth() < apresSaison.getMonth());
            const sa = !as && !s;
            const seasons = [{"season": { "$eq": 0 }}];
            if( as )
                seasons.push({"season": {"$eq": 1}})
            if( s )
                seasons.push({"season": {"$eq": 2}})
            if( sa )
                seasons.push({"season": {"$eq": 3}})*/
            const startEnd = [];
            if( req.query.start)
                startEnd.push({"$or": [{"startsAt": { "$exists" : false}},{"startsAt": {"$gte": parseInt(req.query.start, 10)}}]});
            if( req.query.end )
                startEnd.push({"$or": [{"endsAt": { "$exists" : false}},{"endsAt": {"$lte": parseInt(req.query.end, 10)}}]});
            wheres.push({
                    "$and": [
                        {"season": {"$eq": 0}},
                        ...startEnd
                    ]
            });
            console.log(util.inspect(wheres, false, 10));
        }
        else {
            wheres.push({
                "$or" : [{
                    "startsAt": {"$gte": dnow},
                    "$or": [{"endsAt": {"$gte": dnow}}, {"endsAt": {"$eq": null}}]
                }]
            });
        }
        let match = {};
        if(owner)
            match = { "owner": { "$eq": owner } };
        else {
            match = {
                "lang": {"$eq": 'fr'},
                "isReported": {"$ne": true},
                "$and": wheres,
            };
        };

        if( req.query.query && req.query.query.length >= minQueryChars ) {
            const regex = new RegExp(req.query.query, 'ui');
            match = {
                ...match, "$and": [...match["$and"], { "$or": [
                    {city: regex}, {title: regex}, {desc: regex}, {address: regex},
                    {department: regex}, {region: regex}] }]
            };
            console.log(match);
        }
        const agg = [];
        const srt = {};
        if (typeof(req.query.lat) !== 'undefined' &&
            typeof(req.query.lng) !== 'undefined') {
            if( req.query.sort === 'loc' ){
                srt.distance = 1;
            }
            agg.push({
                "$geoNear": {
                    near: {type: "Point", coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)]},
                    distanceField: "distance",
                    spherical: true,
                    query: match
                },
//                loc: {"$geoWithin": {"$centerSphere": [[parseFloat(req.query.lat), parseFloat(req.query.lng)], 5/6731]}}
            });
        }else{
            agg.push({"$match": match});
        }
        srt.startsAt = 1;
        srt.createdAt = -1;
        agg.push({ "$sort": srt});
        eventsCollection.aggregate(agg).skip(p * eventsPerPage).limit(eventsPerPage).toArray().then((events) => {
            res.json(events.map(e => {
                updateEventSummary(e, req.session.user || req.ip);
                return e;
            }));
        });
    });

    app.get('/api/event/:id', async (req, res) => {
        const r = await eventsCollection.findOne({"slug": {"$eq": req.params.id}}) || await eventsCollection.findOne({"hash": {"$eq": req.params.id}})
        return res.json(r);
    })
    app.post('/api/event/:id/report', async (req, res) => {
        if( req.session.user ) {
            eventsCollection.findOneAndUpdate({"hash": {"$eq": req.params.id}}, {
                "$addToSet": {reports: req.session.user}
            }, {returnDocument: 'after'}).then(event => {

                if( event.reports.length > maxReportsBeforeStateChange){
                    eventsCollection.updateOne({"hash": {"$eq": req.params.id}}, {
                        "$set": { "isReported": true }
                    }).then(async (e) => {

                        const eventToDisplay = Object.assign({}, event);
                        updateEventSummary(eventToDisplay, null);

                        const info = await transporter.sendMail({
                            from: process.env.MAIL_USER || contactEmail,
                            to: contactEmail,
                            subject: "[Modération] [Report] " + event.title,
                            html: "Cet événement a été signalé par des utilisateurs :<br />" + event.desc +
                                '<dl>'+Object.keys(eventToDisplay).map(e => {
                                    let v = eventToDisplay[e];
                                    if( Array.isArray(v) ){
                                        v = v.join(", ");
                                    }
                                    return '<dt>' + e + '</dt><dd>' + v + '</dd>';
                                }).join('')+'</dl>'
                        });

                        console.log("Message sent: %s", info.messageId);
                    });
                }
                updateEventSummary(event, req.session.user);
                res.json({success: true, event});

            }).catch(() => {
                res.status(404).json({success: false});
            });
        }else{
            res.json({success: false});
        }
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
            const max = isProduction ? maxEventsPerUser : 200;
            console.log(req.session.events + "events deja créés !", event);
            const canCreate = (req.session.events || 0) < max || req.session.ts < dnow - 86400000;
            if (canCreate &&
                !tagError &&
                typeof(event.startsAt) === 'number' &&
                typeof(event.endsAt) === 'number' &&
                typeof(event.title) === 'string' && event.title?.length > 3 &&
                typeof(event.desc) === 'string' && event.desc.length <= 512 &&
                typeof(event.loc) === 'object' && typeof(event.loc.lat) === 'number' && typeof(event.loc.lng) === 'number' ) {

                event.loc = [event.loc.lng, event.loc.lat];
                event.season = 0;

                const element = await eventsCollection.insertOne(event);
                event._id = element.insertedId;
                req.session.events = req.session.events ? req.session.events + 1 : 1;
                req.session.ts = new Date().getTime();
                req.session.save();

                process.send({group:"eventCreated", msg:JSON.stringify({event})})

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

    const port = process.env?.PORT || 7631;

    http.createServer(app).listen(port);

    if (cronOptions.enabled ){
        cronOpenAgenda(eventsCollection, process, cronOptions.timeout);
        cronParis(eventsCollection, process, cronOptions.timeout);
        cronFestivals(eventsCollection, process, cronOptions.timeout);
    }
}

const updateEventSummary = (event, user) => {
    event.hasReported = event.reports?.includes(user);
    event.reports = undefined;
    event._id = undefined;
    event.owner = undefined;
}
process.on('uncaughtException', function (exception) {
    console.error(exception);
    fs.appendFile('bugs.txt', JSON.stringify({ code: exception.code, message: exception.message, stack: exception.stack }), function (err) {
        if (err){
            throw err;
        }
    });
});