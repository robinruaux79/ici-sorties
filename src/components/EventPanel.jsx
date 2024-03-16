
import {forwardRef, lazy, Suspense, useCallback, useEffect, useRef, useState} from "react";
import Event from "./Event.jsx";
import {minQueryChars} from "../constants.js";
import {useParams} from "react-router-dom";
import {useQuery} from "react-query";

const EventPanel = forwardRef(({children}, ref) => {

    const params = useParams();

    const { data: event, isError, isLoadingError } =    useQuery('pollSource'+params.id, () =>
            fetch('/api/event/'+params.id).then(res => {
                if (!res.ok) {
                    // make the promise be rejected if we didn't get a 2xx response
                    throw new Error("Not 2xx response", {cause: res});
                }
                return res.json();
            }),
        {
            retry: false
        }
    )
    return event && <Event data={event} full />;
});


export default EventPanel
