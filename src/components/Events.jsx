
import "./Events.scss"
import {useQuery} from "react-query";
import Event from "./Event.jsx";

import "./Spinner.scss"
import {useRef, useState} from "react";
import {InfiniteScroll} from "./InfiniteScroll.jsx";
import {eventsPerPage} from "../constants.js";

function Events({children, disabled, className, loc, ...rest}) {

    const [currentEvent, setCurrentEvent] = useState('');
    const [isPending, setIsPending] = useState(false);

    const queryFnInfinite = (page) => {
        setIsPending(true);
        return fetch('/api/events/nearby?page='+page+(loc?'&lat='+loc.lat+'&lng'+loc.lng: '')).then(e => {
            setIsPending(false);
            return e.json()
        }).catch(e=> setIsPending(false))
    }

    const infiniteScrollRef = useRef(null)

    return (<>
        <InfiniteScroll className={"content events"} spinner={<div className={"loc-spinner"}></div>} count={eventsPerPage} refreshTime={0} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
            return <Event data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                setCurrentEvent(event.hash);
            }} />
        }} />
            {isPending && <div className="loc-spinner white"></div>}
        </>
    )
}


export default Events
