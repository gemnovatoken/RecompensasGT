import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface PerfilProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  telegramId: number | null; // Necesario para crear tu link único
}

interface HistorialCanje {
  id: string;
  puntos_canjeados: number;
  fecha: string;
}

export default function Perfil({ balance, setBalance, telegramId }: PerfilProps) {
  // Bóvedas
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [selectedVault, setSelectedVault] = useState<string>('');
  
  // Referidos y Link
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [puntosPendientes, setPuntosPendientes] = useState<number>(0);
  const [totalReferidos, setTotalReferidos] = useState<number>(0);
  const [historial, setHistorial] = useState<HistorialCanje[]>([]);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  const vaultTypes = ['Familiar', 'Gamer', 'Amigos', 'Colegas'];

  // Cargar datos de la base de datos al abrir el perfil
  useEffect(() => {
    const cargarDatosReferidos = async () => {
      if (!telegramId) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, puntos_ref_pendientes')
        .eq('telegram_id', telegramId)
        .single();

      if (usuario) {
        setPuntosPendientes(usuario.puntos_ref_pendientes || 0);

        // Contar cuántos ahijados tiene este usuario
        const { count } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('referidor_id', usuario.id);
        
        setTotalReferidos(count || 0);

        // Obtener historial de canjes
        const { data: canjes } = await supabase
          .from('historial_canjes_referidos')
          .select('*')
          .eq('usuario_id', usuario.id)
          .order('fecha', { ascending: false })
          .limit(5); // Traemos los últimos 5

        if (canjes) setHistorial(canjes);
      }
    };
    cargarDatosReferidos();
  }, [telegramId]);

  // Generador de Link de Telegram
  const handleCopyLink = () => {
    if (!telegramId) {
      alert("Cargando tu ID, espera un momento...");
      return;
    }
    // Tu Link Directo de Telegram con el parámetro startapp (Específico para Mini Apps)
    const referralLink = `https://t.me/RecompensasGT_bot/Jugar?startapp=ref_${telegramId}`;
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Función para cobrar los puntos
  const handleRedimir = async () => {
    if (!telegramId) return;
    
    // Le mostramos al usuario solo la parte entera
    const puntosEnteros = Math.floor(puntosPendientes);
    
    if (puntosEnteros < 1) {
      alert('Aún no tienes puntos enteros. ¡Tus amigos necesitan ver más videos!');
      return;
    }

    setIsRedeeming(true);
    try {
      const { data: puntosGanados, error } = await supabase.rpc('redimir_puntos_referidos', {
        p_telegram_id: telegramId
      });

      if (error) throw error;

      // Actualizamos pantalla
      setBalance(prev => prev + puntosGanados);
      setPuntosPendientes(prev => prev - puntosGanados); // Le restamos lo que cobró
      
      // Añadimos el nuevo cobro al principio del historial visual
      const nuevoCanje: HistorialCanje = {
        id: Date.now().toString(),
        puntos_canjeados: puntosGanados,
        fecha: new Date().toISOString(),
      };
      setHistorial(prev => [nuevoCanje, ...prev]);

      alert(`🎉 ¡Éxito! Transferiste ${puntosGanados} pts de comisiones a tu balance general.`);
    } catch (error: unknown) {
      if (error instanceof Error) alert(`Error: ${error.message}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleOpenVault = (type: string) => {
    setSelectedVault(type);
    setIsVaultModalOpen(true);
  };

  const handleCreateVault = () => {
    if (balance >= 100) {
      setBalance(prev => prev - 100);
      alert(`¡Éxito! Has creado la Bóveda ${selectedVault}. Se han descontado 100 pts.`);
      setIsVaultModalOpen(false);
    } else {
      alert('Saldo insuficiente. Necesitas 100 pts para crear una bóveda.');
    }
  };

  return (
    <div className="t2e-container" style={{ minHeight: '80vh', padding: '15px' }}>
      
      <div className="t2e-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>👤 Mi Imperio</h2>
      </div>

      {/* --- BALANCE --- */}
      <div className="t2e-balance-section" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '25px' }}>
        <p style={{ margin: 0, color: '#8a8d9e', fontSize: '0.9rem' }}>Puntos Personales</p>
        <h2 style={{ margin: '5px 0', fontSize: '2.5rem', color: '#00c6ff' }}>{balance.toLocaleString()}</h2>
      </div>

      {/* --- EL SISTEMA DE REFERIDOS NIVEL DIOS --- */}
      <div className="t2e-progress-wrapper" style={{ marginBottom: '25px', background: 'linear-gradient(135deg, rgba(255,153,0,0.1) 0%, rgba(255,85,0,0.1) 100%)', border: '1px solid rgba(255,153,0,0.3)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '5px', fontSize: '1.2rem', color: '#ff9900' }}>👑 Conviértete en un Rey del Networking</h3>
        <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '15px', lineHeight: '1.4' }}>
          Sé parte de la comunidad más grande de Guatemala. Por cada amigo que invites, ganarás el <strong>5% de sus puntos de por vida</strong> sin quitarles a ellos. ¡Tu imperio trabaja para ti!
        </p>

        {/* Cajas de Estadísticas */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#8a8d9e' }}>Mi Red (Amigos)</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: 'white' }}>{totalReferidos}</h3>
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#8a8d9e' }}>Puntos a Cobrar</p>
            {/* AQUÍ ESTÁ LA MAGIA DEL REDONDEO: Math.floor() */}
            <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#00d2ff' }}>{Math.floor(puntosPendientes)}</h3>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleCopyLink}
            style={{ padding: '12px', borderRadius: '12px', background: '#ffffff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          >
            {linkCopied ? '✅ ¡Enlace Copiado!' : '🔗 Copiar Enlace de Invitación'}
          </button>
          
          <button 
            onClick={handleRedimir}
            disabled={isRedeeming || Math.floor(puntosPendientes) < 1}
            style={{ 
              padding: '12px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: Math.floor(puntosPendientes) < 1 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #00c6ff, #0072ff)',
              color: Math.floor(puntosPendientes) < 1 ? '#888' : '#fff'
            }}
          >
            {isRedeeming ? 'Procesando...' : '💰 Redimir Puntos Enteros'}
          </button>
        </div>
      </div>

      {/* --- HISTORIAL DE CANJES DE REFERIDOS --- */}
      {historial.length > 0 && (
        <div className="t2e-progress-wrapper" style={{ marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1rem' }}>📜 Historial de Cobros</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historial.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 15px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: '#a0a5ba' }}>
                  {new Date(item.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontWeight: 'bold', color: '#00d2ff' }}>+{item.puntos_canjeados} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SECCIÓN DE BÓVEDAS (Mantenida intacta pero gamificada) --- */}
      <div className="t2e-progress-wrapper">
        <h3 style={{ marginTop: 0, marginBottom: '5px', fontSize: '1.1rem' }}>🛡️ Bóvedas de Puntos</h3>
        <p style={{ fontSize: '0.85rem', color: '#8a8d9e', marginBottom: '15px' }}>Crea un espacio exclusivo para ti y tu círculo.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {vaultTypes.map((type) => (
            <button 
              key={type} 
              onClick={() => handleOpenVault(type)}
              style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Bóveda<br/><span style={{ color: '#00c6ff' }}>{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- VENTANA EMERGENTE BÓVEDA --- */}
      {isVaultModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#00c6ff', margin: '0 0 15px 0' }}>Bóveda {selectedVault}</h3>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0' }}>⚠️ <strong>Condiciones:</strong></p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
                <li>Creación: <strong>100 pts</strong></li>
                <li>Ingreso: <strong>100 pts</strong> / persona</li>
                <li>Reingreso: <strong>100 pts</strong></li>
              </ul>
            </div>

            <p style={{ margin: '0 0 15px 0' }}>Tu balance: <strong style={{ color: '#00c6ff' }}>{balance} pts</strong></p>

            <button onClick={handleCreateVault} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(90deg, #00c6ff, #0072ff)', border: 'none', color: 'white', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}>
              Crear (-100 pts)
            </button>
            <button onClick={() => setIsVaultModalOpen(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}