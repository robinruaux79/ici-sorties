
import "./Events.scss"
import {useQuery} from "react-query";
import Event from "./Event.jsx";

import "./Spinner.scss"
import {useCallback, useRef, useState} from "react";
import {InfiniteScroll} from "./InfiniteScroll.jsx";
import {eventsPerPage} from "../constants.js";
import { useGeolocated } from "react-geolocated";
import Button from "./Button.jsx";

let abortController = new AbortController();

function Events({children, disabled, className, loc, ...rest}) {

    const [currentPos, setCurrentPos] = useState(loc);
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

    const queryFnInfinite = useCallback((page) => {
        abortController.abort();
        abortController = new AbortController();
        return fetch('/api/events/nearby?sort='+(geolocatedMode?'loc':'starts')+
            '&page='+page+(coords?'&lat='+(coords?.latitude)+'&lng='+(coords?.longitude): ''),
            {
                signal: abortController.signal
            })
            .then(e => {
            return e.json()
        })
    }, [coords, geolocatedMode]);

    return (<div className="events-wrapper">
            {coords && <div className="events-header">
                <div className="first-part"></div>
                <Button onClick={() => {
                    setGeolocatedMode(false);
                    infiniteScrollRef.current.reset();
                }}>Par date</Button>
                {<Button onClick={() => {
                    setGeolocatedMode(true);
                    infiniteScrollRef.current.reset();
                }}>Par km</Button>}
            </div>}
            {coords && <InfiniteScroll localKey={'is'} className={"content events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
            return <Event data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(event.hash);
            }} />
        }} />}
        {!coords && <InfiniteScroll localKey={'is'} className={"content events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
            return <Event data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(event.hash);
            }} />
        }} />}
        </div>
    )
}


export default Events
