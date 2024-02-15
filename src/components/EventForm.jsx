
import "./Button.scss"
import Button from "./Button.jsx";
import { Map } from "./Map.jsx";
import {useState} from "react";
import {Trans} from "react-i18next";
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
        document.execCommand('insertHTML', false, '<a href="' + url + '" target="_blank">' + txt + '</a>');
    }
});

function EventForm({children, disabled, className, ...rest}) {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [eventDesc, setEventDesc] = useState('');

    const filterPassedTime = (time) => {
        const currentDate = new Date();
        const selectedDate = new Date(time);
        return currentDate.getTime() < selectedDate.getTime();
    };

    return <div className="event-form">
        <h2>Ajouter un événement</h2>
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
                    <BtnNumberedList />,
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
            <Map position={[48.853239,2.3460111]} zoom={11} />
        </div>
        <Button type={"submit"}>Ajouter</Button>
    </div>
}


export default EventForm
