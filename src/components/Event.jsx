
import "./Event.scss"
import {Trans, useTranslation} from "react-i18next";
import {lazy, Suspense, useState} from "react";
import Button from "./Button.jsx";
//import {Map} from "./Map.jsx";
import {useNavigate} from "react-router-dom";
import {getCookie} from "../cookies.js";
import { getUrlBase } from "../url.js";

import {
    EmailShareButton,
    FacebookShareButton,
    GabShareButton,
    HatenaShareButton,
    InstapaperShareButton,
    LineShareButton,
    LinkedinShareButton,
    LivejournalShareButton,
    MailruShareButton,
    OKShareButton,
    PinterestShareButton,
    PocketShareButton,
    RedditShareButton,
    TelegramShareButton,
    TumblrShareButton,
    TwitterShareButton,
    ViberShareButton,
    VKShareButton,
    WhatsappShareButton,
    WorkplaceShareButton,
    EmailIcon,
    FacebookIcon,
    GabIcon,
    HatenaIcon,
    LineIcon,
    LinkedinIcon,
    LivejournalIcon,
    MailruIcon,
    OKIcon,
    PinterestIcon,
    PocketIcon,
    RedditIcon,
    TelegramIcon,
    TumblrIcon,
    TwitterIcon,
    ViberIcon,
    VKIcon,
    WeiboIcon,
    WhatsappIcon,
    XIcon,
} from "react-share";

import {BiLink, BiShare} from "react-icons/bi";
import {FaMagnifyingGlass} from "react-icons/fa6";
function Event({data, children, full, onShowInfo, ...rest}) {

    const Map = lazy(() => import('./Map.jsx'));

    const {i18n, t} = useTranslation();
    const [showSocialNetworks, setSocialNetworkVisible] = useState(false);

    const startsAt = new Date();
    startsAt.setTime(data.startsAt);
    const endsAt = new Date();
    endsAt.setTime(data.endsAt);

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

    const [hasReported, setHasReported] = useState(data.hasReported);

    const handleReportEvent = async () => {
        fetch('/api/event/'+data.hash+'/report', {
            method: 'POST',
            body: '',
            headers: {
                'X-CSRF-Token': getCookie('_csrf_token'),
            },
        }).then(e => e.json()).then(json => {
            if( json.success === false ){
                console.error(json);
            }else{
                setHasReported(true);
                console.log(json);
            }
        });
    }

    const url = getUrlBase() + '/event/'+data.slug;

    return (
        <div className={"bg-default event"} {...rest}>
            <div className={"head"} onClick={() => onShowInfo(data)}>
                <h3>{data.title}</h3>
                <div className="start">{availableStart}</div>
                {data.distance && (<span className="dist">{`à ${Math.round(data.distance/1000)} km`}</span>)}
                {!full && (<Button><FaMagnifyingGlass /></Button>)}
            </div>
            {full && (
                <div className={"body"}>
                    <div className="desc" dangerouslySetInnerHTML={{ __html: data.desc }}></div>
                    {availableStart && <div className="start">Débute le {availableStart}</div>}
                    {availableEnd && <div className="end">Se termine le {availableEnd}</div>}
                    {<Suspense fallback={<div className="loc-spinner"></div>}>
                        <Map position={data.loc} zoom={11} draggable={false}/>
                    </Suspense>}
                    <div className="actions">
                        <Button className={"btn"} onClick={() => {
                            window.open(
                                "https://www.google.com/maps/search/?api=1&query="+data.loc.lat+"%2C"+data.loc.lng+"&hl="+lang,
                                '_blank' // <- This is what makes it open in a new window.
                            );
                        }}>Calcul d'itinéraire</Button>
                       <div className="share-view" onClick={() => setSocialNetworkVisible(!showSocialNetworks)} onMouseOver={() => setSocialNetworkVisible(true)}
                             onMouseOut={() => setSocialNetworkVisible(false)}>
                            <Button title={t('share_on_social_networks', 'Partager sur les réseaux')}
                                    className={"btn btn-link"}><BiShare /></Button>
                        {showSocialNetworks && (
                            <div className="social-networks">
                                <EmailShareButton url={url} subject={data.label} body={data.desc}>
                                    <EmailIcon />
                                </EmailShareButton>
                                <FacebookShareButton url={url}>
                                    <FacebookIcon />
                                </FacebookShareButton>
                                <RedditShareButton title={data.label} url={url}>
                                    <RedditIcon />
                                </RedditShareButton>
                                <TumblrShareButton url={url} title={data.label} caption={data.desc}>
                                    <TumblrIcon />
                                </TumblrShareButton>
                                <TelegramShareButton title={data.label + " " + data.desc} url={url}>
                                    <TelegramIcon />
                                </TelegramShareButton>
                                <TwitterShareButton title={data.label + " " + data.desc} url={url}>
                                    <XIcon />
                                </TwitterShareButton>
                                <ViberShareButton title={data.label + " " + data.desc} url={url}>
                                    <ViberIcon />
                                </ViberShareButton>
                                <VKShareButton title={data.label + " " + data.desc} url={url}>
                                    <VKIcon />
                                </VKShareButton>
                                <WhatsappShareButton title={data.label + " " + data.desc} url={url}>
                                    <WhatsappIcon />
                                </WhatsappShareButton>
                            </div>
                        )}
                        </div>
                        {!hasReported && <Button className={"btn"} onClick={() => {
                            handleReportEvent()
                        }}>Signaler</Button>}
                    </div>
                    {children}
                </div>
            )}
        </div>
    )
}


export default Event
