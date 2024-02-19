import "./Events.scss"
import {useQuery as useQueryParams} from "../hooks.js"
import Event from "./Event.jsx";

import "./Spinner.scss"
import {useCallback, useEffect, useRef, useState} from "react";
import {InfiniteScroll} from "./InfiniteScroll.jsx";
import {eventsPerPage, minQueryChars} from "../constants.js";
import { useGeolocated } from "react-geolocated";
import Button from "./Button.jsx";
import {navigate} from "vite-plugin-ssr/client/router";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {debounce} from "../util.js";

let abortController = new AbortController();


function Events({children, disabled, className, resetTime, loc, ...rest}) {


    const navigate = useNavigate();
    const [currentPos, setCurrentPos] = useState(loc);
    const [searchValue, setSearchValue] = useState('');
    const [currentEvent, setCurrentEvent] = useState('');
    const [geolocatedMode, setGeolocatedMode] = useState(false);
    const [refreshTime, setRefreshTime] = useState(0);

    const infiniteScrollRef = useRef(null)

    const { coords, isGeolocationAvailable, isGeolocationEnabled } =
        useGeolocated({
            positionOptions: {
                enableHighAccuracy: true,
            },
            userDecisionTimeout: 5000,
            onSuccess: (data)=>{
                setGeolocatedMode(true)
            }
        });

    const query = useQueryParams();

    const queryFnInfinite = useCallback((page) => {
        abortController.abort();
        abortController = new AbortController();
        if( searchValue !== '' && searchValue.length < minQueryChars ){
            return Promise.reject();
        }
        return fetch('/api/events/nearby?'+
            (searchValue !== '' ?'query='+encodeURIComponent(searchValue):'')+
            '&sort='+(query.get("sort") || (geolocatedMode?'loc':'start'))+
            '&page='+page+(coords?'&lat='+(coords?.latitude)+'&lng='+(coords?.longitude): ''),
            {
                signal: abortController.signal
            })
            .then(e => {
            return e.json()
        })
    }, [coords, geolocatedMode, query, searchValue]);

    const itemsRefs = useRef({});

    return (<div className="events-wrapper">
            <div className="events-header">
                <div className="first-part">
                    <input type="text" placeholder="Rechercher une sortie" value={searchValue} onChange={e => {
                        setSearchValue(e.target.value);
                        infiniteScrollRef.current.reset();
                    }} />
                </div>
                {coords && <div className="second-part">
                <><Button onClick={() => {
                    setGeolocatedMode(false);
                    navigate('/events/nearby?sort=start');
                    infiniteScrollRef.current.reset();
                }}>Par date</Button><Button onClick={() => {
                    setGeolocatedMode(true);
                    navigate('/events/nearby?sort=loc');
                    infiniteScrollRef.current.reset();
                }}>Par distance</Button></>
                </div>}
            </div>
            {coords && <InfiniteScroll refreshTime={resetTime} localKey={'is'} className={"events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
                const getRef = (el) => itemsRefs.current[e.hash] = el;
                return <Event ref={getRef} data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(() => {
                    return event.hash;
                });
                itemsRefs.current[event.hash].scrollIntoView();
            }} />
        }} />}
        {!coords && <InfiniteScroll refreshTime={resetTime} localKey={'is'} className={"events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
            return <Event data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(event.hash);
            }} />
        }} />}
        </div>
    )
}


export default Events
