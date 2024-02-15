import React from 'react'
import ReactDOMServer from 'react-dom/server'
import App from './App'
import {BrowserRouter, createBrowserRouter, RouterProvider} from "react-router-dom";
import {StaticRouter} from "react-router-dom/server.js";

export function render() {
    const loc = "/";
    const html = ReactDOMServer.renderToString(
        <React.StrictMode>
            <StaticRouter location={loc}>
                <App />
            </StaticRouter>
        </React.StrictMode>
    )
    return { html }
}