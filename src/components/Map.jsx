import React, {lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

const Map = ({position, draggable, zoom, onPositionChanged}) => {
    const [center, setCenter] = useState(position);
    const currentMap = useRef(null);
    const mapContainerRef = useRef(null);

    let map, marker;
    scrollWheelZoom: false

    useEffect(() => {
        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            osmAttribution = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
                ' <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            osmLayer = new L.TileLayer(osmUrl, {maxZoom: 18, attribution: osmAttribution});

        if( map ){
            map.off()
            map.remove();
        }
        map = new L.Map('map', { scrollWheelZoom: false });
        const latLng = new L.LatLng(center.lat, center.lng);
        map.setView(latLng, zoom);
        map.addLayer(osmLayer);

        map.on('click', () => {
            map.scrollWheelZoom.enable();
        });

        marker = new L.marker(latLng, {draggable:'true'});
        marker.on('dragend', function(event){
            var marker = event.target;
            var position = marker.getLatLng();
            marker.setLatLng(new L.LatLng(position.lat, position.lng),{draggable:'true'});
            map.panTo(new L.LatLng(position.lat, position.lng))
            onPositionChanged?.(position);
        });
        map.addLayer(marker);
    }, []);

    return <div id={"map"} className="map">

    </div>

};

export default Map;