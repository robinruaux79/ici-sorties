import {MapContainer, Marker, Popup, TileLayer, useMap, useMapEvent} from 'react-leaflet'
import {useCallback, useEffect, useMemo, useRef, useState} from "react";


function DraggableMarker({position, draggable, children, onDragEnd}) {
    const [_position, setPosition] = useState(position)
    useEffect(()=>{
        setPosition(position)
    }, [position])
    const markerRef = useRef(null)
    const map = useMap()
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const pos = marker.getLatLng();
                    setPosition(pos)
                    map.setView(pos, map.getZoom())
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

export const Map = ({position, draggable, zoom, onPositionChanged}) => {
    const [center, setCenter] = useState(position);
    return <div className="map">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker draggable={draggable} position={[center.lat, center.lng]} onDragEnd={(pos)=>{
            setCenter(pos);
            onPositionChanged?.(pos);
        }}>

        </DraggableMarker>
    </MapContainer></div>;

};

