import React, {useState} from "react";
import {QueryClient, QueryClientProvider} from 'react-query'
import './App.scss'
import {NavLink, Outlet, Route, Routes, useNavigate} from "react-router-dom";
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
import Button from "./components/Button.jsx";
import {FaLocationDot, FaNoteSticky} from "react-icons/fa6";
import EventPanel from "./components/EventPanel.jsx";

function App() {
    const date = new Date();
    const navigate = useNavigate();
    const backgrounds = [
        {
            bg: <NewYear />,
            filter: (date => date.getMonth() > 10 || (date.getDate() < 10 && date.getMonth() < 1) )
        },
        {
            bg: <Spring />,
            filter: (date => date.getMonth() > 3 && date.getMonth() < 4)
        },
        {
            bg: <Summer />,
            filter: (date => date.getMonth() > 4 && date.getMonth() < 7)
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

    const [resetTime, setResetTime] = useState(0);

    return <QueryClientProvider client={queryClient}>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NS94ZLLZ" height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
        <div className={`background${bg?' filled': ''}`}>
            {bg}
        </div>
        <div className="foreground">
            <div className="website-content">
                <header id={"header"}>
                    <h1 className={`${bg ? ' bg-default' : ''}`}>ici ! <sup>®</sup></h1>
                    <p className="bg-default slogan">Des sorties et des événements à proximité !</p>
                    <nav role={"navigation"}>
                        <ul className="menu menu-main">
                            <li><Button onClick={() => {
                                navigate("/events/nearby?sort=loc", { replace : true});
                                setResetTime(new Date().getTime());
                            }} className="btn-big"><FaLocationDot />Sorties
                            </Button></li>
                            <li><NavLink to={"/event/new"} className="btn btn-big">
                                <FaNoteSticky />Publier un événement</NavLink></li>
                        </ul>
                    </nav>
                </header>

                <main>

                    <Routes>
                        <Route path="/" element={<Outlet />}>
                            <Route path="" element={<Events resetTime={resetTime} />} />
                            <Route path="events/nearby" element={<Events resetTime={resetTime} />} />
                            <Route path="event/new" element={<EventForm />} />
                            <Route path="event/:id" element={<EventPanel />} />
                            <Route path="legals" element={<Legals />} />
                            <Route path="cgu" element={<CGU />} />
                            <Route path="credits" element={<Credits />} />
                        </Route>
                    </Routes>
                </main>

                <footer>
                    <ul className={"bg-default"}>
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
                    <a href="http://www.w3-annuaire.com/vote-w3-annuaire.php?id_site_vote=16816" target="_blank"><img src="http://www.w3-annuaire.com/images/logo-w3-annuaire.gif" width="120" height="35" border="0" alt="W3 Annuaire" />&nbsp;</a>
                    <noscript><a href="http://www.w3-annuaire.com/annuaire-divers.php">Annuaire Divers</a> <a href="http://www.w3-annuaire.com">Référencement Web</a></noscript>
                    <a href="https://www.meilleurduweb.com" target="_blank"><img src="https://www.meilleurduweb.com/images/pub/banniere_88.31.gif" border="0" alt="Meilleur du Web : Annuaire des meilleurs sites Web." />&nbsp;</a>
                </footer>
            </div>
        </div>
    </QueryClientProvider>
}


export default App
