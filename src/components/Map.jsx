import React, {lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import L from 'leaflet';
import {MapContainer, Marker, TileLayer, useMap} from "react-leaflet";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

function DraggableMarker({position, map, draggable, children, onDragEnd}) {
    const [_position, setPosition] = useState(position)
    useEffect(()=>{
        setPosition(position)
    }, [position])
    const markerRef = useRef(null)

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const pos = marker.getLatLng();
                    setPosition(pos)
                    map.current.setView(pos, map.current.getZoom())
                    onDragEnd?.(pos);
                }
            },
        }),
        [],
    )

    return (
        <Marker
            draggable={draggable}
            eventHandlers={eventHandlers}
            position={_position}
            ref={markerRef}>
            {children}
        </Marker>
    )
}

const Map = ({position, draggable, zoom, onPositionChanged}) => {
    const [center, setCenter] = useState(position);
    const currentMap = useRef(null);

    return <div className="map">
        <Suspense>
            <MapContainer ref={currentMap} center={center} zoom={zoom} scrollWheelZoom={true}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker map={currentMap} draggable={draggable} position={[center.lat, center.lng]} onDragEnd={(pos)=>{
                    setCenter(pos);
                    onPositionChanged?.(pos);
                }}>

                </DraggableMarker>
            </MapContainer>
        </Suspense></div>

};

export default Map;