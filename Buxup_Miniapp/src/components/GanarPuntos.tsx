import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface GanarPuntosProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  telegramId: number | null;
}

export default function GanarPuntos({ balance, setBalance, telegramId }: GanarPuntosProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adsVistosHoy, setAdsVistosHoy] = useState(0);

  // Variable maestra: ¡Puedes cambiar este 75 en cualquier momento!
  const LIMITE_DIARIO = 75; 
  const progresoAds = Math.min((adsVistosHoy / LIMITE_DIARIO) * 100, 100);

  // Al cargar la pantalla, leemos cuántos anuncios ha visto hoy desde Supabase
  useEffect(() => {
    const contarAnunciosHoy = async () => {
      if (!telegramId) return;
      
      const { data: usuario } = await supabase.from('usuarios').select('id').eq('telegram_id', telegramId).single();
      
      if (usuario) {
        // Buscamos en las transacciones de hoy que sean de tipo 'video_ad'
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

  // --- LÓGICA DE CASCADA (WATERFALL) ---
  const handleWatchAd = async () => {
    if (!telegramId) return;
    if (adsVistosHoy >= LIMITE_DIARIO) {
      alert("¡Llegaste al límite diario! Vuelve mañana para seguir ganando.");
      return;
    }

    setIsWatchingAd(true);

    try {
      let proveedor = '';
      let recompensa = 0;

      // 1. Intentamos con el Top Tier (Ej: Adsgram)
      const adsgramDisponible = await verificarDisponibilidadAPI('Adsgram');
      
      if (adsgramDisponible) {
        proveedor = 'Adsgram';
        recompensa = 5; // Paga más
        await mostrarVideoAPI(proveedor);
      } 
      // 2. Fallback: Si Adsgram falla, saltamos a Monetag sin que el usuario lo note
      else {
        const monetagDisponible = await verificarDisponibilidadAPI('Monetag');
        if (monetagDisponible) {
          proveedor = 'Monetag';
          recompensa = 3; // Paga un poco menos
          await mostrarVideoAPI(proveedor);
        } else {
          throw new Error('No hay inventario de anuncios en este momento.');
        }
      }

      // 3. Registrar de forma segura en el Backend
      const { data: nuevoBalance, error } = await supabase.rpc('registrar_vista_anuncio', {
        p_telegram_id: telegramId,
        p_limite_diario: LIMITE_DIARIO,
        p_proveedor: proveedor,
        p_recompensa: recompensa
      });

      // ... código anterior ...
      if (error) {
        alert(`❌ Error del servidor: ${error.message}`);
      } else {
        setBalance(nuevoBalance);
        setAdsVistosHoy(prev => prev + 1);
        alert(`✅ ¡Ganaste ${recompensa} pts vía ${proveedor}!`);
      }

    } catch (err: unknown) { // <-- SOLUCIÓN PRO: Usamos 'unknown' en vez de 'any'
      if (err instanceof Error) {
        // Ahora TypeScript sabe con 100% de seguridad que esto es un Error y tiene un .message
        alert(`Lo sentimos: ${err.message}`);
      } else {
        alert('Ocurrió un error inesperado.');
      }
    } finally {
      setIsWatchingAd(false);
    }
  };

  // --- FUNCIONES SIMULADORAS DE LAS REDES DE ANUNCIOS ---
  const verificarDisponibilidadAPI = (red: string) => {
    return new Promise((resolve) => {
      // SOLUCIÓN PRO: Usamos la variable 'red' para registrar el proceso en la consola
      console.log(`[Waterfall] Verificando inventario en: ${red}...`); 
      
      const tieneInventario = Math.random() > 0.3; 
      setTimeout(() => resolve(tieneInventario), 400);
    });
  };

  const mostrarVideoAPI = (red: string) => {
    return new Promise((resolve) => {
      // SOLUCIÓN PRO: Usamos la variable 'red' para saber qué anuncio estamos viendo
      console.log(`[Waterfall] Reproduciendo anuncio desde: ${red}...`); 
      
      setTimeout(() => resolve(true), 2000); 
    });
  };

  return (
    <div className="earn-container">
      <h2>Zona de Ganancias</h2>

      <div className="balance-card" style={{ marginBottom: '20px', padding: '15px' }}>
        <p>Saldo Disponible</p>
        <h2 style={{ color: 'var(--color-exito)', margin: '5px 0' }}>{balance.toLocaleString()} pts</h2>
      </div>

      {/* --- SECCIÓN 1: VIDEOS (CASCADA) --- */}
      <div className="earn-section">
        <h3>📺 Ver Videos Cortos</h3>
        <p>Gana puntos rápidos viendo anuncios publicitarios.</p>
        
        {/* Tracker del Límite Diario */}
        <div className="limit-tracker" style={{ marginBottom: '15px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--texto-secundario)', marginBottom: '5px' }}>
            <span>Límite Diario:</span>
            <strong>{adsVistosHoy} / {LIMITE_DIARIO}</strong>
          </div>
          <div className="progress-container" style={{ margin: 0, height: '8px' }}>
            <div className="progress-bar" style={{ width: `${progresoAds}%`, backgroundColor: adsVistosHoy >= LIMITE_DIARIO ? '#ff3b30' : 'var(--color-primario)' }}></div>
          </div>
        </div>

        <button 
          className="btn-watch-ad" 
          onClick={handleWatchAd}
          disabled={isWatchingAd || adsVistosHoy >= LIMITE_DIARIO}
          style={{ 
            width: '100%', 
            backgroundColor: (isWatchingAd || adsVistosHoy >= LIMITE_DIARIO) ? 'var(--color-borde)' : '#ff3b30',
            color: (isWatchingAd || adsVistosHoy >= LIMITE_DIARIO) ? 'var(--texto-secundario)' : 'white',
            padding: '15px',
            fontSize: '1.1rem'
          }}
        >
          {isWatchingAd ? '📺 Cargando anuncio...' : 
           adsVistosHoy >= LIMITE_DIARIO ? '🚫 Límite alcanzado por hoy' : '▶ Ver Anuncio'}
        </button>
      </div>

      {/* --- SECCIÓN 2: MUROS DE OFERTAS GLOBALES --- */}
      <div className="earn-section">
        <h3>🚀 Tareas Premium</h3>
        <p>Gana miles de puntos completando encuestas, jugando juegos y más.</p>
        
        <div className="offerwall-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            className="btn-offerwall" 
            style={{ backgroundColor: '#5e5ce6', color: 'white' }}
            onClick={() => alert('Abriendo el muro de TimeWall...')}
          >
            📋 Abrir TimeWall
          </button>
          
          <button 
            className="btn-offerwall" 
            style={{ backgroundColor: '#ff9f0a', color: 'white' }}
            onClick={() => alert('Abriendo encuestas de CPX Research...')}
          >
            📊 Encuestas CPX Research
          </button>
        </div>
      </div>

    </div>
  );
}