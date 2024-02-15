import React from "react";
import {Trans} from "react-i18next";

import "./Credits.scss"

export const Credits = () => {
    return <div className='bg-default content credits'>
        <h2><Trans i18nKey='links.credits'>Remerciements</Trans></h2>
        Edité par anonympins.
    </div>
}