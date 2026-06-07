import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface GanarPuntosProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  telegramId: number | null;
}

interface AdsgramController {
  show: () => Promise<void>;
}
interface AdsgramAPI {
  init: (params: { blockId: string }) => AdsgramController;
}

declare global {
  interface Window {
    Adsgram?: AdsgramAPI;
    showMonetagAd?: () => Promise<void>; 
    showAdsterraAd?: () => Promise<void>;
  }
}

export default function GanarPuntos({ balance, setBalance, telegramId }: GanarPuntosProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adsVistosHoy, setAdsVistosHoy] = useState(0);

  const LIMITE_DIARIO = 75; 
  const progresoAds = Math.min((adsVistosHoy / LIMITE_DIARIO) * 100, 100);

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

  const handleWatchAd = async () => {
    if (!telegramId) return;
    if (adsVistosHoy >= LIMITE_DIARIO) {
      alert(`¡Llegaste al límite diario de ${LIMITE_DIARIO} anuncios! Vuelve mañana.`);
      return;
    }

    setIsWatchingAd(true);

    const proveedoresDeAnuncios = [
      {
        nombre: 'Adsgram',
        recompensa: 5,
        reproducir: async () => {
          if (!window.Adsgram) throw new Error("API de Adsgram no inyectada.");
          const AdController = window.Adsgram.init({ blockId: "32495" }); 
          await AdController.show();
        }
      },
      {
        nombre: 'Monetag',
        recompensa: 3,
        reproducir: async () => {
          if (!window.showMonetagAd) throw new Error("3362482");
          await window.showMonetagAd(); 
        }
      },
      {
        nombre: 'Adsterra',
        recompensa: 2,
        reproducir: async () => {
          if (!window.showAdsterraAd) throw new Error("API de Adsterra no inyectada.");
          await window.showAdsterraAd();
        }
      }
    ];

    let proveedorExitoso: string | null = null;
    let recompensaFinal: number | null = null;

    for (const proveedor of proveedoresDeAnuncios) {
      try {
        console.log(`[Waterfall] Intentando conectar con ${proveedor.nombre}...`);
        await proveedor.reproducir();
        proveedorExitoso = proveedor.nombre;
        recompensaFinal = proveedor.recompensa;
        break; 
        
      // SOLUCIÓN PRO: Quitamos los paréntesis y la variable. Solo usamos 'catch {'
      } catch { 
        console.log(`[Waterfall] ${proveedor.nombre} falló. Saltando al siguiente...`);
      }
    }

    if (!proveedorExitoso || recompensaFinal === null) {
      alert("No hay anuncios disponibles en este momento.");
      setIsWatchingAd(false);
      return; 
    }

    try {
      const { data: nuevoBalance, error } = await supabase.rpc('registrar_vista_anuncio', {
        p_telegram_id: telegramId,
        p_limite_diario: LIMITE_DIARIO,
        p_proveedor: proveedorExitoso,
        p_recompensa: recompensaFinal
      });

      if (error) throw error;
      setBalance(nuevoBalance);
      setAdsVistosHoy(prev => prev + 1);
      alert(`✅ ¡Ganaste ${recompensaFinal} pts vía ${proveedorExitoso}!`);
    } catch (err: unknown) {
      if (err instanceof Error) console.error("Error BD:", err.message);
      alert("Error al guardar puntos.");
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
              {isWatchingAd ? '⏳ Buscando anuncio...' : 
               adsVistosHoy >= LIMITE_DIARIO ? '🚫 Límite por hoy' : '▶ Ver Anuncio'}
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