import {Trans, useTranslation} from "react-i18next";


const CGU = () => {

    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || i18n.language;

    return <div className="content cgu">

        <h2><Trans i18nKey='links.cgu'>Conditions générales d'utilisation</Trans></h2>

    </div>
}

export default CGU