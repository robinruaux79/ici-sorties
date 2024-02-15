import {Trans} from "react-i18next";


const Legals = () => {
    const hosting = 'OVH';
    const editor = 'anonympins (@gmail.com)';
    return <div className="bg-default content legals">

        <h2><Trans i18nKey='links.legals'>Mentions légales</Trans></h2>

        <ul>
            <li><Trans i18nKey='hosting'>Hébergement</Trans> : {hosting}</li>
            <li><Trans i18nKey='publisher'>Editeur</Trans> : {editor}</li>
        </ul>
    </div>
}

export default Legals