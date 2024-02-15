
import "./Event.scss"
import {Trans, useTranslation} from "react-i18next";
import {useState} from "react";
import Button from "./Button.jsx";
import {Map} from "./Map.jsx";
import {useNavigate} from "react-router-dom";

function Event({data, children, full, onShowInfo, ...rest}) {

    const startsAt = new Date();
    startsAt.setTime(data.startsAt);
    const endsAt = new Date();
    endsAt.setTime(data.endsAt);

    const {i18n} = useTranslation();
    const lang = i18n.resolvedLanguage || i18n.language;
    const availableStart =
        data.startsAt > 0 && <Trans i18nKey={'startsAt'} values={{startsAt: startsAt.toLocaleString(i18n.resolvedLanguage, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
            })}} defaults={'{{startsAt}}'}></Trans>;

    const availableEnd = data.endsAt > 0 && <Trans i18nKey='endsAt' values={{endsAt: endsAt.toLocaleString(i18n.resolvedLanguage, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
            })}} defaults={'{{endsAt}}'}></Trans>;

    return (
        <div className={"bg-default event"} {...rest}>
            <div className={"head"} onClick={() => onShowInfo(data)}>
                <h3>{data.title}</h3>
                <div className="start">{availableStart}</div>
                {!full && (<Button className={"btn"}>+</Button>)}
            </div>
            {full && (
                <div className={"body"}>
                    <div className="desc" dangerouslySetInnerHTML={{ __html: data.desc }}></div>
                    {availableStart && <div className="start">Débute le {availableStart}</div>}
                    {availableEnd && <div className="end">Se termine le {availableEnd}</div>}
                    <Map position={data.loc} zoom={11} draggable={false} />
                    <div className="actions">
                        <Button className={"btn"} onClick={() => {
                            window.open(
                                "https://www.google.com/maps/search/?api=1&query="+data.loc.lat+"%2C"+data.loc.lng+"&hl="+lang,
                                '_blank' // <- This is what makes it open in a new window.
                            );
                        }}>Calcul d'itinéraire</Button>
                    </div>
                    {children}
                </div>
            )}
        </div>
    )
}


export default Event
