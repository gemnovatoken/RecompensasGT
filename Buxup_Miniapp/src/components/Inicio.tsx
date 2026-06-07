import { useState } from 'react';
import Racha from './Modales/Racha'; // Importamos la nueva ventana emergente

interface InicioProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  telegramId: number | null;
}

export default function Inicio({ balance, setBalance, telegramId }: InicioProps) {
  // Estado para controlar si la ventana emergente está abierta o cerrada
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

  const nextLevel = 10000;
  const progressPercentage = Math.min((balance / nextLevel) * 100, 100);

  return (
    <div className="inicio-container">
      <h2>Centro de Recompensas GT</h2>

      <div className="balance-card">
        <p>Saldo Actual</p>
        <h1>{balance.toLocaleString()} pts</h1>
        
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="level-text">Faltan {(nextLevel - balance).toLocaleString()} pts para el Nivel 1</p>
      </div>

      <div className="earn-section checkin-card">
        <h3>📅 Recompensas Diarias</h3>
        <p>Abre tu ventana de check-in, revisa tu racha actual y completa el combo del día para ganar más.</p>
        
        <button 
          className="btn-primary" 
          onClick={() => setIsCheckinModalOpen(true)} // Esto abre el modal
        >
          🔥 Abrir Check-in y Tareas
        </button>
      </div>

      <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
        🏆 Ver Catálogo de Premios
      </button>

      {/* AQUÍ INYECTAMOS EL MODAL (Solo se mostrará si isCheckinModalOpen es true) */}
      <Racha 
        isOpen={isCheckinModalOpen} 
        onClose={() => setIsCheckinModalOpen(false)} 
        telegramId={telegramId}
        setBalance={setBalance}
      />

    </div>
  );
}