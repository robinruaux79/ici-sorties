
import "./Events.scss"
import {useQuery} from "react-query";
import Event from "./Event.jsx";

import "./Spinner.scss"
import {useCallback, useRef, useState} from "react";
import {InfiniteScroll} from "./InfiniteScroll.jsx";
import {eventsPerPage} from "../constants.js";
import { useGeolocated } from "react-geolocated";

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

            }
        });

    const queryFnInfinite = useCallback((page) => {
        abortController.abort();
        abortController = new AbortController();
        return fetch('/api/events/nearby?page='+page+(coords || geolocatedMode?'&lat='+(coords?.latitude)+'&lng='+(coords?.longitude): ''),
            {
                signal: abortController.signal
            })
            .then(e => {
            return e.json()
        })
    }, [coords]);

    return (<div className="events-wrapper">
        <InfiniteScroll className={"content events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} refreshTime={refreshTime} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
            return <Event data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(event.hash);
            }} />
        }} />
        </div>
    )
}


export default Events
