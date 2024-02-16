
import "./Events.scss"
import {useQuery} from "react-query";
import Event from "./Event.jsx";

import "./Spinner.scss"
import {useRef, useState} from "react";
import {InfiniteScroll} from "./InfiniteScroll.jsx";
import {eventsPerPage} from "../constants.js";

function Events({children, disabled, className, loc, ...rest}) {

    const [currentEvent, setCurrentEvent] = useState('');

    const queryFnInfinite = (page) => {
        return fetch('/api/events/nearby?page='+page+(loc?'&lat='+loc.lat+'&lng'+loc.lng: '')).then(e => {
            return e.json()
        })
    }

    const infiniteScrollRef = useRef(null)

    return (<div className="events-wrapper">
        <InfiniteScroll className={"content events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} refreshTime={0} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
            return <Event data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(event.hash);
            }} />
        }} />
        </div>
    )
}


export default Events
