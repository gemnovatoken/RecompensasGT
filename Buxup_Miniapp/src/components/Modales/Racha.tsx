import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface ModalCheckinProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: number | null;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

export default function ModalCheckin({ isOpen, onClose, telegramId, setBalance }: ModalCheckinProps) {
  const [racha, setRacha] = useState<number>(1);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // --- ESTADOS DE RASTREO AUTOMÁTICO ---
  const [anunciosVistos, setAnunciosVistos] = useState<number>(0);
  const [tareasTimeWall, setTareasTimeWall] = useState<number>(0);

  const metaAnuncios = 50;
  const metaTimeWall = 2;

  // Cálculos dinámicos de progreso (Porcentajes para las barras)
  const progresoAnuncios = Math.min((anunciosVistos / metaAnuncios) * 100, 100);
  const progresoTimeWall = Math.min((tareasTimeWall / metaTimeWall) * 100, 100);

  // El sistema detecta automáticamente si todo está completado
  const isComboCompletado = anunciosVistos >= metaAnuncios && tareasTimeWall >= metaTimeWall;

  useEffect(() => {
    const obtenerRacha = async () => {
      if (isOpen && telegramId) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('racha')
          .eq('telegram_id', telegramId)
          .single();
        
        if (data && !error) setRacha(data.racha || 1);
      }
    };
    obtenerRacha();
  }, [isOpen, telegramId]);

  if (!isOpen) return null;

  // --- LÓGICA ULTRA SEGURA AL BACKEND ---
  const handleSecureCheckIn = async () => {
    if (!telegramId) return;
    setIsClaiming(true);

    try {
      // Enviamos el valor dinámico calculado por el sistema, no lo que el usuario escriba
      const { data, error } = await supabase.rpc('procesar_check_in_y_tareas', {
        p_telegram_id: telegramId,
        p_completar_tareas: isComboCompletado 
      });

      if (error) {
        alert(`❌ ${error.message}`);
      } else if (data && data.length > 0) {
        setBalance(data[0].nuevo_balance);
        setRacha(data[0].nueva_racha);
        alert(`✅ ¡Éxito! Has ganado ${isComboCompletado ? '35' : '10'} puntos. Tu racha es de ${data[0].nueva_racha} días.`);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="racha-title">🔥 Racha: {racha} {racha === 1 ? 'día' : 'días'}</h2>
          <p>Reclama tu bono base o completa el combo para multiplicar tus puntos.</p>
        </div>

        {/* --- SECCIÓN DINÁMICA DE TAREAS --- */}
        <div className="task-tracker-container">
          <h4>🚀 Combo del Día (+25 pts)</h4>
          
          {/* TAREA 1: ANUNCIOS */}
          <div className="task-item">
            <div className="task-info">
              <span>📺 Ver {metaAnuncios} Anuncios</span>
              <span className="task-count">{anunciosVistos} / {metaAnuncios}</span>
            </div>
            <div className="task-progress-bg">
              <div className="task-progress-fill" style={{ width: `${progresoAnuncios}%` }}></div>
            </div>
            {/* Botón temporal para que pruebes cómo se llena */}
            {anunciosVistos < metaAnuncios && (
              <button className="btn-simulate" onClick={() => setAnunciosVistos(prev => prev + 10)}>
                + Simular ver 10 anuncios
              </button>
            )}
          </div>

          {/* TAREA 2: TIMEWALL */}
          <div className="task-item">
            <div className="task-info">
              <span>📋 Tareas TimeWall</span>
              <span className="task-count">{tareasTimeWall} / {metaTimeWall}</span>
            </div>
            <div className="task-progress-bg">
              <div className="task-progress-fill" style={{ width: `${progresoTimeWall}%` }}></div>
            </div>
             {/* Botón temporal para que pruebes cómo se llena */}
             {tareasTimeWall < metaTimeWall && (
              <button className="btn-simulate" onClick={() => setTareasTimeWall(prev => prev + 1)}>
                + Simular 1 tarea
              </button>
            )}
          </div>

          {/* INDICADOR AUTOMÁTICO DE ESTADO */}
          <div className={`combo-status ${isComboCompletado ? 'success' : 'pending'}`}>
            {isComboCompletado 
              ? '✅ ¡Combo Completado! Bono desbloqueado.' 
              : '⏳ Completa ambas barras para el bono.'}
          </div>
        </div>

        {/* --- BOTÓN DE ACCIÓN DINÁMICO --- */}
        <button 
          className={`btn-claim ${isComboCompletado ? 'btn-claim-max' : 'btn-claim-base'}`} 
          onClick={handleSecureCheckIn}
          disabled={isClaiming}
        >
          {isClaiming 
            ? 'Procesando...' 
            : `🎁 Reclamar ${isComboCompletado ? '35 Puntos (¡Bono Máximo!)' : '10 Puntos (Solo Check-in)'}`
          }
        </button>
        
        <button className="btn-close" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}