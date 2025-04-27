import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapWithAddressProps {
  setCoordinates: (coords: Coordinates) => void;
}

const MapWithAddress: React.FC<MapWithAddressProps> = ({ setCoordinates }) => {
  const [position, setPosition] = useState<[number, number]>([10.762622, 106.660172]);

  useMapEvents({
    click(e: any) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setCoordinates({ latitude: lat, longitude: lng });
    },
  });

  return (
    <MapContainer center={position} zoom={15} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} />
    </MapContainer>
  );
};

export default MapWithAddress;
