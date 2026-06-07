import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Inicio from './components/Inicio';
import GanarPuntos from './components/GanarPuntos';
import Perfil from './components/Perfil';
import './App.css';

// ==========================================
// SOLUCIÓN PRO: Enseñar a TypeScript qué es 'window.Telegram'
// ==========================================
interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        initDataUnsafe?: {
          user?: TelegramWebAppUser;
          start_param?: string;
        };
      };
    };
  }
}

export default function App() {
  // Inicializamos el ID en NULL. ¡CERO NÚMEROS QUEMADOS O DE PRUEBA AQUÍ!
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'inicio' | 'ganar' | 'perfil'>('inicio');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const inicializarSistema = async () => {
      // 1. Invocamos a Telegram para que nos dé los datos del teléfono actual
      const tg = window.Telegram?.WebApp;
      
      // Le decimos a Telegram que la app ya cargó visualmente
      if (tg) tg.ready(); 

      // 2. Extraemos la identidad SECRETA del usuario que abrió la app
      const tgUser = tg?.initDataUnsafe?.user;

      // 🛑 CANDADO DE SEGURIDAD: Si no hay usuario, significa que lo abrieron fuera de Telegram
      if (!tgUser) {
        alert("⚠️ ACCESO DENEGADO: Debes abrir esta aplicación desde dentro de Telegram.");
        setIsLoading(false);
        return; 
      }

      // Extraemos el ID real, único e irrepetible de tu hermana (o de quien lo abra)
      const idReal = tgUser.id;
      setTelegramId(idReal);

      try {
        // 3. Buscamos a ESTE usuario en tu base de datos
        const { data: usuarioExistente, error: errorBusqueda } = await supabase
          .from('usuarios')
          .select('*')
          .eq('telegram_id', idReal)
          .single();

        if (errorBusqueda) {
          console.error('Error al buscar usuario:', errorBusqueda);
          throw errorBusqueda; // o manéjalo con un estado de error si prefieres
        }

        if (usuarioExistente) {
          // ...
        } else {
          // ...
        } {
          // ==========================================
          // 🚀 ¡ES UN USUARIO NUEVO! (SISTEMA DE REFERIDOS)
          // ==========================================
          
          // Telegram atrapa el "startapp=ref_ID" y lo guarda aquí automáticamente:
          const startParam = tg.initDataUnsafe?.start_param; 
          let padrinoUUID = null;

          if (startParam && startParam.startsWith('ref_')) {
            const idDelPadrino = startParam.replace('ref_', ''); // Extraemos tu ID
            
            // Buscamos cuál es tu código UUID secreto en la base de datos
            const { data: padrino } = await supabase
              .from('usuarios')
              .select('id')
              .eq('telegram_id', idDelPadrino)
              .single();
              
            if (padrino) {
              padrinoUUID = padrino.id;
            }
          }

          // Finalmente, insertamos a tu hermana con saldo 0 y la vinculamos a ti
          const { error: errorInsert } = await supabase.from('usuarios').insert({
            telegram_id: idReal,
            balance: 0,
            referidor_id: padrinoUUID
          });

          if (errorInsert) throw errorInsert;
          
          setBalance(0); // Tu hermana arranca con 0
          console.log("✅ Nuevo usuario registrado y vinculado correctamente.");
        }
      } catch (err) {
        console.error("Error crítico al inicializar base de datos:", err);
      } finally {
        setIsLoading(false);
      }
    };

    inicializarSistema();
  }, []);

  // Si está cargando o lo abrieron fuera de Telegram, bloqueamos la pantalla
  if (isLoading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>⏳ Cargando entorno seguro...</div>;
  }

  if (!telegramId) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>❌ Por favor, usa el Bot oficial en Telegram para jugar.</div>;
  }

  // --- RENDERIZADO DE LAS PESTAÑAS (Igual que lo tenías) ---
  return (
    <div className="app-container">
      <div className="tab-content">
        {activeTab === 'inicio' && <Inicio balance={balance} setBalance={setBalance} telegramId={telegramId} />}
        {activeTab === 'ganar' && <GanarPuntos balance={balance} setBalance={setBalance} telegramId={telegramId} />}
        {activeTab === 'perfil' && <Perfil balance={balance} setBalance={setBalance} telegramId={telegramId} />}
      </div>

      <nav className="bottom-nav">
        <button className={activeTab === 'inicio' ? 'active' : ''} onClick={() => setActiveTab('inicio')}>🏠<br/>Inicio</button>
        <button className={activeTab === 'ganar' ? 'active' : ''} onClick={() => setActiveTab('ganar')}>💰<br/>Ganar</button>
        <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}>👤<br/>Perfil</button>
      </nav>
    </div>
  );
}