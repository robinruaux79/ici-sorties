import React, {lazy, Suspense, useCallback, useEffect, useRef, useState} from "react";
import { registerLocale } from "react-datepicker";

const DatePicker = lazy(() => import("react-datepicker"))
import "./Events.scss"
import {useQuery as useQueryParams} from "../hooks.js"
import Event from "./Event.jsx";

import "./Spinner.scss"

import {InfiniteScroll} from "./InfiniteScroll.jsx";
import {eventsPerPage, minQueryChars} from "../constants.js";
import { useGeolocated } from "react-geolocated";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Trans} from "react-i18next";

import "react-datepicker/dist/react-datepicker.css";
let abortController = new AbortController();

import fr from 'date-fns/locale/fr';
import en from 'date-fns/locale/en-GB';

const locales = {
    fr,
    en
};

Object.keys(locales).forEach(l => {
    registerLocale(l, locales[l]);
});


function Events({children, disabled, className, resetTime, loc, ...rest}) {

    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);

    const navigate = useNavigate();
    const [currentPos, setCurrentPos] = useState(loc);
    const [searchValue, setSearchValue] = useState('');
    const [currentEvent, setCurrentEvent] = useState('');
    const [geolocatedMode, setGeolocatedMode] = useState(false);
    const [refreshTime, setRefreshTime] = useState(0);

    const infiniteScrollRef = useRef(null)

    const filterPassedTime = (time) => {
        const selectedDate = new Date(time);
        return startDateFilter?.getTime() < selectedDate?.getTime();
    };

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
        if( searchValue && searchValue.length < minQueryChars ){
            return Promise.reject();
        }
        return fetch('/api/events/nearby?'+
            (searchValue !== '' ?'query='+encodeURIComponent(searchValue):'')+
            '&sort='+(query.get("sort") || (geolocatedMode?'loc':'start'))+
            '&page='+page+(coords?'&lat='+(coords?.latitude)+'&lng='+(coords?.longitude): '')+
            (startDateFilter ? '&start='+startDateFilter.getTime() : '')+
            (endDateFilter ? '&end='+endDateFilter?.getTime() : ''),
            {
                signal: abortController.signal
            })
            .then(e => {
            return e.json()
        })
    }, [coords, geolocatedMode, query, searchValue, startDateFilter, endDateFilter]);

    const itemsRefs = useRef({});

    return (<div className="events-wrapper">
            <div className="events-header">
                <div className="fields-inline">
                    <div className="field field-max">
                        <label>
                            <Trans i18nKey={'searchLabel'} defaults={'Rechercher une sortie'}></Trans> :</label>
                        <input type="text" placeholder="Concert, festival..." value={searchValue} onChange={e => {
                            setSearchValue(e.target.value);
                            infiniteScrollRef.current.reset();
                        }} />
                    </div>
                    <div className="field">
                        <label>
                            <Trans i18nKey={'startsAt'} values={{startsAt: ''}}
                                   defaults={'Débute le {{startsAt}}'}></Trans> :</label>
                        {<Suspense><DatePicker
                        selected={startDateFilter}
                        onChange={(date) => {
                            if (date > endDateFilter) {
                                setEndDateFilter(null)
                            }
                            setStartDateFilter(date)
                            infiniteScrollRef.current.reset();
                        }}
                        selectsStart
                        endDate={endDateFilter}
                        dateFormat={"dd/MM/yyyy HH:mm"}
                        locale={'fr'}
                        showTimeSelect /></Suspense>}
                    </div>
                    <div className="field">
                        <label><Trans i18nKey='endsAt' values={{endsAt: ''}}
                                      defaults={'Termine le {{endsAt}}'}></Trans> :</label>
                        {<Suspense><DatePicker
                            selected={endDateFilter}
                            onChange={(date) => {
                                infiniteScrollRef.current.reset();
                                setEndDateFilter(date);
                            }}
                            selectsEnd
                            startDate={startDateFilter}
                            endDate={endDateFilter}
                            minDate={startDateFilter}
                            dateFormat={"dd/MM/yyyy HH:mm"}
                            locale={'fr'}
                            showTimeSelect
                            filterTime={filterPassedTime}
                        /></Suspense>}
                    </div>
                    </div>
            </div>
            {coords && <InfiniteScroll refreshTime={resetTime} localKey={'is'} className={"events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
                const getRef = (el) => itemsRefs.current[e.hash] = el;
                return <Event ref={getRef} data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                    setCurrentEvent(event.hash);
                    itemsRefs.current[event.hash].scrollIntoView();
                }} />
            }} />}
            {!coords && <InfiniteScroll refreshTime={resetTime} localKey={'is'} className={"events"} spinner={<div className={"loc-spinner white"}></div>} count={eventsPerPage} ref={infiniteScrollRef} fetch={queryFnInfinite} renderItem={(e) => {
                const getRef = (el) => itemsRefs.current[e.hash] = el;
                return <Event ref={getRef} data={e} full={e.hash === currentEvent} onShowInfo={(event) => {
                    setCurrentEvent(event.hash);
                    itemsRefs.current[event.hash].scrollIntoView();
                }} />
            }} />}
        </div>
    )
}


export default Events
