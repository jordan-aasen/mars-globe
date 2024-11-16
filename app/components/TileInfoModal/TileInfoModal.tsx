import React from 'react';

import './styles.css';

interface InfoModalProps {
  data: any;
  onClose: () => void;
}

export const TileInfoModal: React.FC<InfoModalProps> = ({ data, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Tile Information</h2>
        <p>Latitude: {data.lat}</p>
        <p>Longitude: {data.lng}</p>
        {/* Add more data as needed */}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
