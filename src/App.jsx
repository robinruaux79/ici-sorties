import {QueryClient, QueryClientProvider} from 'react-query'
import './App.scss'
import {NavLink, Outlet, Route, Routes} from "react-router-dom";
import Legals from "./components/Legals.jsx";
import CGU from "./components/CGU.jsx";
import {Credits} from "./components/Credits.jsx";
import {Trans} from "react-i18next";
import ReactGA from "react-ga";

import "./i18n.js"

const queryClient = new QueryClient()

import Summer from "./icons/beach-303326.svg?react";
import Spring from "./icons/garden-6097539.svg?react";
import NewYear from "./icons/new-year-3004243.svg?react";

import EventForm from "./components/EventForm.jsx";
import Events from "./components/Events.jsx";


function App() {
    const date = new Date();

    const backgrounds = [
        {
            bg: <NewYear />,
            //filter: (date => date.getMonth() > 11 || date.getMonth() < 2)
        },
        {
            bg: <Spring />,
            //filter: (date => date.getMonth() > 2 || date.getMonth() < 6)
        },
        {
            bg: <Summer />,
            //filter: (date => date.getMonth() > 11 || date.getMonth() < 2)//filter: (date => date.getMonth() > 5 && date.getMonth() < 8)
        },
    ];

    let bg = null;
    for(let i = 0; i < backgrounds.length; ++i){
        const cbg = backgrounds[i];
        if( cbg.filter?.(date) ){
            bg = cbg.bg;
            break;
        }
    }
    return <QueryClientProvider client={queryClient}>
        <div className={`background${bg?' filled': ''}`}>
            {bg}
        </div>

        <div className="foreground">
            <header id={"header"}>
                <h1 className={`${bg ? ' bg-default' : ''}`}>ici !<sup>®</sup></h1>
                <p className="bg-default slogan">Des sorties et événements à proximité !</p>
                <nav role={"navigation"}>
                    <ul className="menu menu-main">
                        <li><NavLink to={"/events/nearby"} className="btn">Près d&apos;ici</NavLink></li>
                        <li><NavLink to={"/event/new"} className="btn">Publier un événement</NavLink></li>
                    </ul>
                </nav>
            </header>

            <main>
                <div className={"bg-default content"}>
                    <Routes>
                        <Route path="/" element={<Outlet />}>
                            <Route path="events/nearby" element={<Events />} />
                            <Route path="event/new" element={<EventForm />} />
                            <Route path="legals" element={<Legals />} />
                            <Route path="cgu" element={<CGU />} />
                            <Route path="credits" element={<Credits />} />
                        </Route>
                    </Routes>
                </div>
            </main>

            <footer className={"bg-default"}>
                <ul>
                    <li><NavLink onClick={() => {
                        ReactGA.event({
                            category: 'navigation',
                            action: 'clicked',
                            label: 'Mentions légales (footer)',
                        });
                    }} to={"/legals"}><Trans i18nKey={"links.legals"}>Mentions légales</Trans></NavLink></li>
                    <li><NavLink onClick={() => {
                        ReactGA.event({
                            category: 'navigation',
                            action: 'clicked',
                            label: 'CGU (footer)',
                        });
                    }} to={"/cgu"}><Trans i18nKey={"links.cgu"}>CGU</Trans></NavLink></li>
                </ul>
            </footer>
        </div>
    </QueryClientProvider>;
}


export default App
