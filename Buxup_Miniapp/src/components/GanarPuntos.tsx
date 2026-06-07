import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface GanarPuntosProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  telegramId: number | null;
}

// SOLUCIÓN PRO: Le decimos a TypeScript que 'Adsgram' existe en la ventana global del navegador
// para que no nos lance el error de "Unexpected any" o "Property does not exist".
// 1. Definimos qué hace el controlador del anuncio (mostrar el video)
interface AdsgramController {
  show: () => Promise<void>;
}

// 2. Definimos qué necesita la herramienta principal para inicializarse
interface AdsgramAPI {
  init: (params: { blockId: string }) => AdsgramController;
}

// 3. Lo inyectamos de forma estricta y segura en la ventana global (¡Adiós al 'any'!)
declare global {
  interface Window {
    Adsgram?: AdsgramAPI;
  }
}

export default function GanarPuntos({ balance, setBalance, telegramId }: GanarPuntosProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adsVistosHoy, setAdsVistosHoy] = useState(0);

  const LIMITE_DIARIO = 75; 
  const progresoAds = Math.min((adsVistosHoy / LIMITE_DIARIO) * 100, 100);

  // Consulta inicial a Supabase para saber cuántos videos ha visto HOY
  useEffect(() => {
    const contarAnunciosHoy = async () => {
      if (!telegramId) return;
      
      const { data: usuario } = await supabase.from('usuarios').select('id').eq('telegram_id', telegramId).single();
      
      if (usuario) {
        const hoy = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('transacciones')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', usuario.id)
          .eq('tipo', 'video_ad')
          .gte('fecha', `${hoy}T00:00:00Z`);

        setAdsVistosHoy(count || 0);
      }
    };
    contarAnunciosHoy();
  }, [telegramId]);

  // --- INTEGRACIÓN REAL DE ADSGRAM ---
  const handleWatchAd = async () => {
    if (!telegramId) return;
    if (adsVistosHoy >= LIMITE_DIARIO) {
      alert("¡Llegaste al límite diario! Vuelve mañana para seguir ganando.");
      return;
    }

    setIsWatchingAd(true);

    try {
      // 1. Verificamos que el script de index.html haya cargado correctamente
      if (!window.Adsgram) {
        throw new Error("El proveedor de anuncios no está disponible en este momento.");
      }

      // 2. Inicializamos el controlador (⚠️ AQUÍ DEBES PONER TU BLOCK ID REAL ⚠️)
      // Ejemplo: "2834" o el número que te dé Adsgram en su panel.
      const AdController = window.Adsgram.init({ blockId: "34362" }); 

      console.log("[Waterfall] Solicitando anuncio real a Adsgram...");
      
      // 3. Ejecutamos el anuncio. Esto pausará el código hasta que el usuario termine de verlo.
      await AdController.show();

      // 4. SI LLEGAMOS AQUÍ: Significa que el anuncio se vio completo. ¡Guardamos en Supabase!
      const proveedor = 'Adsgram';
      const recompensa = 5;

      const { data: nuevoBalance, error } = await supabase.rpc('registrar_vista_anuncio', {
        p_telegram_id: telegramId,
        p_limite_diario: LIMITE_DIARIO,
        p_proveedor: proveedor,
        p_recompensa: recompensa
      });

      if (error) {
        alert(`❌ Error del servidor: ${error.message}`);
      } else {
        setBalance(nuevoBalance);
        setAdsVistosHoy(prev => prev + 1);
        alert(`✅ ¡Ganaste ${recompensa} pts vía ${proveedor}!`);
      }

    } catch (err: unknown) {
      // Si el usuario cierra el anuncio antes de tiempo, o si Adsgram dice "No hay inventario", cae aquí.
      console.log("[Waterfall] Adsgram falló o se canceló:", err);
      
      // ⚠️ PRÓXIMO PASO: Aquí es exactamente donde inyectaremos a Monetag para salvar el anuncio.
      alert("No hay anuncios disponibles en Adsgram en este momento o cancelaste el video. (¡Aquí entrará Monetag muy pronto!)");
      
    } finally {
      setIsWatchingAd(false);
    }
  };

  return (
    <div className="t2e-container" style={{ minHeight: '80vh', padding: '15px' }}>
      
      <div className="t2e-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>📺 Zona de Ganancias</h2>
      </div>

      <div className="t2e-balance-section" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '25px' }}>
        <p style={{ margin: 0, color: '#8a8d9e', fontSize: '0.9rem' }}>Puntos Disponibles</p>
        <h2 style={{ margin: '5px 0', fontSize: '2.5rem', color: '#00c6ff' }}>{balance.toLocaleString()}</h2>
      </div>

      {/* --- SECCIÓN 1: VIDEOS (CASCADA) --- */}
      <div className="t2e-progress-wrapper" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '5px', fontSize: '1.1rem' }}>Ver Videos Cortos</h3>
        <p style={{ fontSize: '0.85rem', color: '#8a8d9e', marginBottom: '15px' }}>Gana puntos rápidos viendo anuncios publicitarios.</p>
        
        {/* Tracker del Límite Diario */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
          <span>Límite Diario:</span>
          <span style={{ fontWeight: 'bold', color: adsVistosHoy >= LIMITE_DIARIO ? '#ff5500' : 'white' }}>
            {adsVistosHoy} / {LIMITE_DIARIO}
          </span>
        </div>
        
        <div className="t2e-progress-track" style={{ marginBottom: '20px' }}>
          <div 
            className="t2e-progress-fill" 
            style={{ 
              width: `${progresoAds}%`, 
              background: adsVistosHoy >= LIMITE_DIARIO ? '#ff5500' : 'linear-gradient(90deg, #00c6ff, #0072ff)' 
            }}
          ></div>
        </div>

        <button 
          className="t2e-action-btn" 
          onClick={handleWatchAd}
          disabled={isWatchingAd || adsVistosHoy >= LIMITE_DIARIO}
          style={{ 
            width: '100%', 
            justifyContent: 'center',
            background: (isWatchingAd || adsVistosHoy >= LIMITE_DIARIO) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, #ff9900, #ff5500)',
            opacity: (isWatchingAd || adsVistosHoy >= LIMITE_DIARIO) ? 0.5 : 1
          }}
        >
          <div className="t2e-btn-text" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
              {isWatchingAd ? '⏳ Cargando anuncio...' : 
               adsVistosHoy >= LIMITE_DIARIO ? '🚫 Límite por hoy' : '▶ Ver Anuncio (+5 pts)'}
            </h3>
          </div>
        </button>
      </div>

      {/* --- SECCIÓN 2: MUROS DE OFERTAS GLOBALES --- */}
      <div className="t2e-progress-wrapper">
        <h3 style={{ marginTop: 0, marginBottom: '5px', fontSize: '1.1rem' }}>🚀 Tareas Premium</h3>
        <p style={{ fontSize: '0.85rem', color: '#8a8d9e', marginBottom: '15px' }}>Miles de puntos por jugar y hacer encuestas.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="t2e-action-btn" style={{ background: 'rgba(94, 92, 230, 0.2)', border: '1px solid rgba(94, 92, 230, 0.5)' }}>
            <div className="t2e-btn-icon" style={{ background: 'transparent' }}>📋</div>
            <div className="t2e-btn-text">
              <h3>Abrir TimeWall</h3>
              <p>Microtareas de alto valor</p>
            </div>
          </button>
          
          <button className="t2e-action-btn" style={{ background: 'rgba(255, 159, 10, 0.2)', border: '1px solid rgba(255, 159, 10, 0.5)' }}>
            <div className="t2e-btn-icon" style={{ background: 'transparent' }}>📊</div>
            <div className="t2e-btn-text">
              <h3>CPX Research</h3>
              <p>Encuestas pagadas</p>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}