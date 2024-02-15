import React, {useEffect, useState} from "react";
import Button from "./Button.jsx";
import {useQuery} from "react-query";
import {NavLink, useNavigate} from "react-router-dom";
import {getUrlBase} from "../url.js";

const LoginButton = ({children, to, onClick, ...rest}) => {


    const { data: oauthData } = useQuery('oauthUrl', () =>
        fetch('/oauth/google').then(res =>
            res.json()
        )
    )

    const login = () => {
        const width = 450;
        const height = 600;
        const left = (screen.width/2)-(width/2);
        const top = (screen.height/2)-(height/2);
        const popup = window.open(oauthData.authUrl, "popup", "popup=true,height="+height+",width="+width+",top="+top+",left="+left);
        const checkPopup = setInterval(() => {
            try {
                if (popup.window.location.href.includes(getUrlBase() + "/oauth/google/callback")) { //
                    popup.close()
                    localStorage.setItem('sub', 'true');
                    navigate(to);
                    onClick?.()
                }
                if (!popup || !popup.closed) return;
                clearInterval(checkPopup);
            } catch (e){

            }
        }, 1000);
    }
    /*
        const login = useGoogleLogin({
            onSuccess: async tokenResponse => {
                const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                    headers: {
                        'Authorization': 'Bearer ' + tokenResponse.access_token
                    },
                    method: 'GET',
                })
                const user= await res.json()
                localStorage.setItem('sub', user.id);
                console.log(tokenResponse)
                onClick?.()
            },
        });
    */
    const navigate = useNavigate();
    const [refreshTime, setRefreshTime] = useState(null);

    useEffect(() => {
        if( refreshTime )
            navigate(to, { replace : true});
    }, [refreshTime]);

    return <NavLink {...rest} onClick={(e) => {
        if( !oauthData.loggedIn )
            login();
        else{
            setRefreshTime(new Date().getTime());
            onClick?.()
        }
    }} >{children}</NavLink>
}

export default LoginButton