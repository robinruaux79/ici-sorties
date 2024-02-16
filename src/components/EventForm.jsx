
import "./Button.scss"
import Button from "./Button.jsx";
//import { Map } from "./Map.jsx";
import {lazy, Suspense, useState} from "react";
import {Trans, useTranslation} from "react-i18next";
import DatePicker, {registerLocale} from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import fr from 'date-fns/locale/fr';
import en from 'date-fns/locale/en-GB';
import 'leaflet/dist/leaflet.css'

import {
    BtnBold,
    BtnItalic,
    BtnUnderline,
    BtnStrikeThrough,
    BtnBulletList,
    BtnNumberedList,
    BtnLink,
    BtnStyles,
    BtnClearFormatting,
    Editor,
    EditorProvider,
    Toolbar, useEditorState
} from 'react-simple-wysiwyg';
import {getCookie} from "../cookies.js";
import {useNavigate} from "react-router-dom";
import "./EventForm.scss"

const locales = {
    fr,
    en
};

Object.keys(locales).forEach(l => {
    registerLocale(l, locales[l]);
});
export function createButton(
    title,
    content,
    command,
) {
    ButtonFactory.displayName = title.replace(/\s/g, '');

    return ButtonFactory;

    function ButtonFactory(props) {
        const editorState = useEditorState();
        const { $el, $selection } = editorState;

        let active = false;
        if (typeof command === 'string') {
            active = !!$selection && document.queryCommandState(command);
        }

        function onAction(e) {
            e.preventDefault();

            if (document.activeElement !== $el) {
                $el?.focus();
            }

            if (typeof command === 'function') {
                command(editorState);
            } else {
                document.execCommand(command);
            }
        }

        if (editorState.htmlMode) {
            return null;
        }

        return (
            <button
                type="button"
                title={title}
                {...props}
                className="rsw-btn"
                onMouseDown={onAction}
                data-active={active}
            >
                {content}
            </button>
        );
    }
}

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

const BtnBetterLink = createButton('Link', '🔗', (args) => {
    if (args.$selection?.nodeName === 'A') {
        document.execCommand('unlink');
    } else {
        const txt = getSelectionText();
        // eslint-disable-next-line no-alert
        const url = prompt('URL', '');
        if( url.match(/^https?:\/\/(.*)/) ) {
            document.execCommand('insertHTML', false, '<a href="' + url + '" target="_blank">' + txt + '</a>');
        }else{
            alert('Invalid URL');
        }
    }
});

const Map = lazy(() => import('./Map.jsx'));

function EventForm({children, disabled, className, ...rest}) {

    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [eventDesc, setEventDesc] = useState('');

    const initialPos = { lat : 48.853239, lng : 2.3460111 };
    const [eventLoc, setEventLoc] = useState(initialPos);

    const lang = i18n.resolvedLanguage || i18n.language;

    const filterPassedTime = (time) => {
        const currentDate = new Date();
        const selectedDate = new Date(time);
        return currentDate.getTime() < selectedDate.getTime();
    };

    const handleAddEvent = () => {
        const event = {
            title: title,
            desc: eventDesc,
            startsAt: (startDate || undefined) && new Date(startDate).getTime(),
            endsAt: (endDate || undefined) && new Date(endDate).getTime(),
            loc: eventLoc,
            lang
        }
        if( title.length < 3 ){
            //setErrors(errs => [...errs, {field: 'title', err:'Title length too short');
        }
        fetch('/api/event', {method: 'POST', body: JSON.stringify(event), headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCookie('_csrf_token'),
        }}).then(e => e.json()).then(json => {
            if( json.success === false ){
                console.error("Impossible de créer l'événement");
            }else{
                console.log("Evenement créé !");
                console.log(json);
                navigate('/events/nearby');
            }
        });
    };

    return <div className="bg-default content event-form">
        <h2>Ajouter un événement</h2>
        <p><i>Tous les champs sont obligatoires.</i></p>
        <div className="field">
            <label htmlFor="event-title">Titre :</label>
            <input id={"event-title"} type="text" name="title" onChange={e => setTitle(e.target.value)} value={title} />
        </div>
        <EditorProvider>
        <div className="field">
            <label htmlFor="event-message">Détails de l'événement :</label>
            <Editor id={"event-message"} value={eventDesc} onChange={(e) => {
                setEventDesc(e.target.value);
            }}>
                <Toolbar>
                    <BtnBold />
                    <BtnItalic />
                    <BtnUnderline />,
                    <BtnStrikeThrough />,
                    <BtnBulletList />,
                    <BtnNumberedList />,i
                    <BtnBetterLink />,
                    <BtnStyles />,
                    <BtnClearFormatting />,
                </Toolbar>
            </Editor>
        </div>
        </EditorProvider>
        <div className="field">
            <label>
                <Trans i18nKey={'startsAt'} values={{startsAt: ''}} defaults={'Débute le {{startsAt}}'}></Trans> :</label><DatePicker
            selected={startDate}
            onChange={(date) => {
                if( date > endDate ){
                    setEndDate(null)
                }
                setStartDate(date)
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat={"dd/MM/yyyy HH:mm"}
            locale={'fr'}
            showTimeSelect
            filterTime={filterPassedTime}
        />
        </div>
        <div className="field">
            <label><Trans i18nKey='endsAt' values={{endsAt: ''}} defaults={'Termine le {{endsAt}}'}></Trans> :</label>
            <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat={"dd/MM/yyyy HH:mm"}
                locale={'fr'}
                showTimeSelect
                filterTime={filterPassedTime}
            />
        </div>
        <div className={"field field-block"}>
            <label>Lieu :</label>
            {<Suspense fallback={<></>}><Map draggable={true} position={initialPos} zoom={11} onPositionChanged={(event, pos) => {
                setEventLoc(p => pos);
            }} /></Suspense>}
        </div>
        <Button type={"submit"} onClick={handleAddEvent}>Ajouter</Button>
    </div>
}


export default EventForm
