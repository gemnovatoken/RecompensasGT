import { useState } from 'react';
import Racha from './Modales/Racha';

interface InicioProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  telegramId: number | null;
}

export default function Inicio({ balance, setBalance, telegramId }: InicioProps) {
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

  const nextLevel = 10000;
  const progressPercentage = Math.min((balance / nextLevel) * 100, 100);

  return (
    <div className="t2e-container">
      
      {/* 1. ENCABEZADO GAMIFICADO */}
      <div className="t2e-header">
        <div className="t2e-user">
          <div className="t2e-avatar">👤</div>
          <span className="t2e-username">Chapín</span>
        </div>
        <div className="t2e-level-badge">
          ⭐ Nivel 1
        </div>
      </div>

      {/* 2. ZONA CENTRAL: EL BALANCE (Estilo Tap to Earn) */}
      <div className="t2e-balance-section">
        <div className="t2e-coin-glow">
          {/* Puedes cambiar este emoji por el logo de tu moneda luego */}
          <div className="t2e-main-coin">🪙</div> 
        </div>
        <h1 className="t2e-balance-amount">{balance.toLocaleString()}</h1>
        <p className="t2e-balance-label">PUNTOS TOTALES</p>
      </div>

      {/* 3. BARRA DE PROGRESO GAMIFICADA */}
      <div className="t2e-progress-wrapper">
        <div className="t2e-progress-info">
          <span>Camino al Canje</span>
          <span className="t2e-progress-numbers">{balance.toLocaleString()} / {nextLevel.toLocaleString()}</span>
        </div>
        <div className="t2e-progress-track">
          <div 
            className="t2e-progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 4. BOTONES DE ACCIÓN (Tarjetas modernas) */}
      <div className="t2e-actions-grid">
        {/* BOTÓN QUE ABRE EL POP-UP DE RACHA */}
        <button 
          className="t2e-action-btn" 
          onClick={() => setIsCheckinModalOpen(true)}
        >
          <div className="t2e-btn-icon fire-icon">🔥</div>
          <div className="t2e-btn-text">
            <h3>Racha Diaria</h3>
            <p>Reclamar Bono</p>
          </div>
        </button>

        {/* BOTÓN DE PREMIOS */}
        <button className="t2e-action-btn">
          <div className="t2e-btn-icon gift-icon">🎁</div>
          <div className="t2e-btn-text">
            <h3>Premios</h3>
            <p>Ver Catálogo</p>
          </div>
        </button>
      </div>

      {/* AQUÍ ESTÁ EL POP-UP (Se abrirá sobre toda la pantalla) */}
      <Racha 
        isOpen={isCheckinModalOpen} 
        onClose={() => setIsCheckinModalOpen(false)} 
        telegramId={telegramId}
        setBalance={setBalance}
      />

    </div>
  );
}