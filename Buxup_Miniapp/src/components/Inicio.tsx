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
      
      {/* 1. ENCABEZADO AMIGABLE */}
      <div className="header-section">
        <div className="header-greeting">
          <h2>¡Hola, Chapín! 👋</h2>
          <p>Centro de Recompensas GT</p>
        </div>
        <div className="header-avatar">
          👤
        </div>
      </div>

      {/* 2. TARJETA DE BALANCE (Diseño Institucional / Bancario) */}
      <div className="balance-card-pro">
        <div className="balance-header">
          <p>Saldo Disponible</p>
          <span className="currency-badge">GTQ</span>
        </div>
        
        <h1 className="balance-amount">{balance.toLocaleString()} <span>pts</span></h1>
        
        <div className="progress-section">
          <div className="progress-info">
            <span>Progreso Actual</span>
            <span>Nivel 1 ({nextLevel.toLocaleString()} pts)</span>
          </div>
          
          <div className="progress-container-pro">
            <div 
              className="progress-bar-pro" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <p className="level-text-pro">
            Faltan {(nextLevel - balance).toLocaleString()} pts para tu primer canje 🎁
          </p>
        </div>
      </div>

      {/* 3. MENÚ DE ACCIONES RÁPIDAS (Tarjetas Modernas) */}
      <div className="quick-actions-grid">
        
        {/* Tarjeta de Racha / Check-in */}
        <div 
          className="action-card" 
          onClick={() => setIsCheckinModalOpen(true)}
        >
          <div className="action-icon bg-orange">🔥</div>
          <div className="action-content">
            <h3>Racha Diaria</h3>
            <p>Gana hasta 35 pts hoy</p>
          </div>
          <div className="action-arrow">➔</div>
        </div>

        {/* Tarjeta de Catálogo de Premios */}
        <div className="action-card">
          <div className="action-icon bg-blue">🎁</div>
          <div className="action-content">
            <h3>Catálogo de Premios</h3>
            <p>Ver recompensas disponibles</p>
          </div>
          <div className="action-arrow">➔</div>
        </div>

      </div>

      {/* AQUÍ INYECTAMOS EL MODAL (La lógica se mantiene intacta) */}
      <Racha 
        isOpen={isCheckinModalOpen} 
        onClose={() => setIsCheckinModalOpen(false)} 
        telegramId={telegramId}
        setBalance={setBalance}
      />

    </div>
  );
}