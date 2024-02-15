import fs from 'node:fs'
import express from 'express'
import {MongoClient} from 'mongodb'
import csrf from "csurf";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser"
import expressSession from "express-session"
import cluster from "node:cluster";
import process from "node:process";
import os from "node:os";
import {fileURLToPath} from 'url';

import MongoStore from 'connect-mongo';
import { readFile } from 'fs/promises';
import * as path from "path";

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
    const dbUrl = 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(dbUrl);

    // Database Name
    const dbName = 'articho';

    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const eventsCollection = db.collection("events");

    // Use connect method to connect to the server
    await client.connect();

    // Cached production assets
    const templateHtml = isProduction
        ? await fs.readFile('./dist/client/index.html', 'utf-8')
        : ''
    const ssrManifest = isProduction
        ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
        : undefined

    // Create http server
    const app = express()
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(cookieParser(isProduction ? 'ergRRà_546bbfg345fer45tyhtbmlke990eref' : 'secret'));
    app.use(expressSession({
        store: MongoStore.create({ mongoUrl: dbUrl })
    }));

    const csrfProtection = csrf({
        cookie: true
    });
    app.use(csrfProtection);

    console.log("ok");
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

    console.log(isProduction);

    // Serve HTML
    app.use('*', async (req, res, next) => {
        next();
        /*try {
            const url = req.originalUrl.replace(base, '')

            let template
            let render
            if (!isProduction) {
                // Always read fresh template in development
                template = await fs.readFile('./index.html', 'utf-8')
                template = await vite.transformIndexHtml(url, template)
                render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
            } else {
                template = templateHtml
                render = (await import('./dist/server/entry-server.js')).render
            }

            const rendered = await render(url, ssrManifest)

            const html = template
                .replace(`<!--app-head-->`, rendered.head ?? '')
                .replace(`<!--app-html-->`, rendered.html ?? '')

            res.status(200).set({'Content-Type': 'text/html'}).end(html)
        } catch (e) {
            vite?.ssrFixStacktrace(e)
            console.log(e.stack)
            res.status(500).end(e.stack)
        }*/
    })

    app.get('*',  (req, res) => {
        console.log(path.join(__dirname, 'index.html'));
        const url = req.originalUrl
        // 1. Read index.html
        fs.readFile(path.resolve(__dirname, 'index.html'),
            'utf-8', async (err, data) => {
                if( err )
                    console.error(err);
                else console.log("ok")
                const template = await vite.transformIndexHtml(url, data)
                console.log(template)
                res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
            });
    })

    // Start http server
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })
}

process.on('uncaughtException', function (exception) {

    fs.appendFile('bugs.txt', JSON.stringify({ code: exception.code, message: exception.message, stack: exception.stack }), function (err) {
        if (err) throw err;
    });
});