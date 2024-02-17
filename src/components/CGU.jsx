import {Trans, useTranslation} from "react-i18next";
import {maxReportsBeforeStateChange} from "../constants.js";


const CGU = () => {

    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage || i18n.language;

    const linkCGU = <a href={`https://policies.google.com/terms?hl=${lang}#toc-content`} target={"_blank"}>conditions d'utilisation</a>;

    return <div className="bg-default content cgu">

        <h2><Trans i18nKey='links.cgu'>Conditions générales d'utilisation</Trans></h2>

        <p><Trans i18nKey='cgu.nom_site'>Ci après nommé le Site le site internet <b>ici !<sup>®</sup></b>, son moteur et son contenu.</Trans></p>
        <p><Trans i18nKey='cgu.nom_editor'>Ci après nommé l'Editeur la personne physique ou morale qui est indiquée sur la page des Mentions légales.</Trans></p>
        <p><Trans i18nKey='cgu.nom_services'>Ci après nommé les Services l'ensemble des services qui sont proposés par le site web <strong>ici !<sup>®</sup></strong> et l'Editeur.</Trans></p>

        <p><Trans i18nKey='cgu.servic-show-events'>Le Service de gélocalisation affiche les événements par ordre de création, ou par proximité avec l'utilisateur du Site,
            s'il a préalablement activé la géolocalisation du navigateur.</Trans></p>
        <p><Trans i18nKey='cgu.service-new-event'>Le Service de création d'événement permet de publier un événement géolocalisé et horodaté.
            </Trans></p>

        <p><Trans i18nKey='cgu.editor_implication'>Les Services fonctionnent grâce à l'implication de l'Editeur. Il se réserve le droit de désactiver les Services comme bon lui semblera selon la situation (financière, juridique...)</Trans></p>
        <p><Trans i18nKey='cgu.user_responsibility'>Votre responsabilité personnelle est engagée lorsque vous rédigez du contenu (nouvel événement) sur le Site.</Trans></p>
        <p><Trans i18nKey="" values={{ reports: maxReportsBeforeStateChange }}
                  defaults="Tout contenu frauduleux ou malveillant peut faire l'objet d'un signalement de la part des utilisateurs du Site. Au bout de {{reports}} signalements, la publication est désactivée. Puis une modération à posteriori est appliquée pour réafficher l'événement si la situation est adaptée ou le laisser inactif.">
        </Trans></p>

        <p><Trans i18nKey=""></Trans></p>
        <p><Trans i18nKey=""></Trans></p>
        <p><Trans i18nKey=""></Trans></p>

        <p>
            <Trans i18nKey='cgu.google_services'
                   defaults={'Merci également de respecter les <0>conditions d\'utilisation</0> des services d\'authentification de Google Accounts'}
                   components={[linkCGU]}>
                {linkCGU}
            </Trans>
        </p>
    </div>
}

export default CGU