import { Modal, Tooltip } from 'antd';
import React, { useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';

const fingerNames = {
  L_THUMB: 'Pulgar Izq.',
  L_INDEX: 'Índice Izq.',
  L_MIDDLE: 'Medio Izq.',
  L_RING: 'Anular Izq.',
  L_PINKY: 'Meñique Izq.',
  R_THUMB: 'Pulgar Der.',
  R_INDEX: 'Índice Der.',
  R_MIDDLE: 'Medio Der.',
  R_RING: 'Anular Der.',
  R_PINKY: 'Meñique Der.',
};

const FingerIcon = ({ finger, registered }) => {
  const isLeft = finger.startsWith('L_');
  const fingerType = finger.split('_')[1];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-12 rounded-t-full border-2 flex items-center justify-center text-xs font-bold ${
          registered
            ? 'bg-green-100 border-green-500 text-green-700'
            : 'bg-gray-100 border-gray-300 text-gray-400'
        }`}
      >
        {fingerType.charAt(0)}
      </div>
      <span className="text-xs text-center">{fingerNames[finger]}</span>
    </div>
  );
};

export default function ModalViewFingerprints({ data }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  let fingerprintsData = [];
  let totalCount = 0;

  // Procesar fingerprints según el tipo que llegue
  if (data?.fingerprints) {
    try {
      if (typeof data.fingerprints === 'string') {
        // Si es string, parsearlo
        const parsed = JSON.parse(data.fingerprints);
        // Puede ser { fingerprints: [...] } o directamente [...]
        fingerprintsData = Array.isArray(parsed) ? parsed : parsed?.fingerprints || [];
      } else if (Array.isArray(data.fingerprints)) {
        // Si ya es array, usarlo directamente
        fingerprintsData = data.fingerprints;
      } else if (typeof data.fingerprints === 'object') {
        // Si es objeto, buscar la propiedad fingerprints
        fingerprintsData = data.fingerprints?.fingerprints || [];
      }

      totalCount = fingerprintsData.length;
    } catch (error) {
      console.error('Error parsing fingerprints:', error, data.fingerprints);
      totalCount = 0;
    }
  }

  // Si no hay datos válidos, no mostrar
  if (totalCount === 0) {
    return null;
  }

  const registeredFingers = fingerprintsData.map((fp) => fp.finger);
  const uniqueFingers = [...new Set(registeredFingers)];

  const allFingers = [
    'L_THUMB',
    'L_INDEX',
    'L_MIDDLE',
    'L_RING',
    'L_PINKY',
    'R_THUMB',
    'R_INDEX',
    'R_MIDDLE',
    'R_RING',
    'R_PINKY',
  ];

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  return (
    <>
      <Tooltip title="Ver huellas registradas">
        <button
          onClick={showModal}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <EyeOutlined />
          <span className="text-sm">({totalCount})</span>
        </button>
      </Tooltip>

      <Modal
        title={`Huellas Registradas - ${data.first_name || data.username}`}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-gray-700">
              <strong>Total de huellas:</strong> {totalCount}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Dedos únicos:</strong> {uniqueFingers.length}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Mano Izquierda</h4>
            <div className="flex justify-around gap-2">
              {allFingers.slice(0, 5).map((finger) => (
                <FingerIcon
                  key={finger}
                  finger={finger}
                  registered={registeredFingers.includes(finger)}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Mano Derecha</h4>
            <div className="flex justify-around gap-2">
              {allFingers.slice(5, 10).map((finger) => (
                <FingerIcon
                  key={finger}
                  finger={finger}
                  registered={registeredFingers.includes(finger)}
                />
              ))}
            </div>
          </div>

          {registeredFingers.length > uniqueFingers.length && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Nota:</strong> Hay dedos con múltiples registros (duplicados).
              </p>
            </div>
          )}

          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2">Detalle de registros:</h4>
            <ul className="space-y-1">
              {fingerprintsData.map((fp, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {fingerNames[fp.finger] || fp.finger}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}
