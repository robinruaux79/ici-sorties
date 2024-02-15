
import "./Events.scss"
import {useQuery} from "react-query";
import Event from "./Event.jsx";

import "./Spinner.scss"

function Events({children, disabled, className, loc, ...rest}) {

    const { data: events, isFetching, isFetched, isError } = useQuery('eventSource', () => {
        return fetch('/api/events/nearby'+(loc?'&lat='+loc.lat+'&lng'+loc.lng: ''), {

        }).then(e => e.json());
    });

    return (
        <div className="events">
            {isError && <>Aucun événement trouvé</>}
            {isFetching && <div className={"loc-spinner"}></div>}
            {events?.map(e => <Event data={e} />)}
        </div>
    )
}


export default Events
