import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from './supabaseClient';
import './App.css';

import Inicio from './components/Inicio';
import GanarPuntos from './components/GanarPuntos';
import ZonaLocal from './components/ZonaLocal';
import Perfil from './components/Perfil';

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
        expand: () => void;
        initDataUnsafe?: {
          user?: TelegramWebAppUser;
          start_param?: string;
        };
        initData?: string;
      };
    };
  }
}

// ==========================================
// 1. CREAMOS LA INTERFAZ PARA EL RADAR (Nivel PRO)
// ==========================================
interface RadarDiagnostico {
  sdkCargado: boolean;
  datosRecibidos: boolean;
  usuarioDetectado: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'earn' | 'local' | 'profile'>('home');
  const [balance, setBalance] = useState<number>(0); 
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 
  
  // ==========================================
  // 2. REEMPLAZAMOS <any> POR NUESTRA NUEVA INTERFAZ
  // ==========================================
  const [debugInfo, setDebugInfo] = useState<RadarDiagnostico | null>(null);

  useEffect(() => {
    const inicializarUsuario = async () => {
      try {
        WebApp.ready();
        WebApp.expand(); // Nivel PRO: Hace que la app ocupe toda la pantalla de Telegram

        const tgUser = WebApp.initDataUnsafe?.user;

        // Guardamos el diagnóstico para mostrarlo si falla
        setDebugInfo({
          sdkCargado: !!WebApp,
          datosRecibidos: !!WebApp.initData,
          usuarioDetectado: !!tgUser
        });

        // 🛑 CANDADO: Si no hay usuario de Telegram, bloqueamos y mostramos el radar
        if (!tgUser) {
          console.warn("Fallo de identidad: Telegram no envió los datos.");
          setLoading(false);
          return; 
        }

        const tId = tgUser.id; 
        const username = tgUser.username || "Usuario_Telegram";
        
        setTelegramId(tId);

        const { data: usuarioExistente, error: fetchError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('telegram_id', tId)
          .single(); 

        if (usuarioExistente) {
          setBalance(usuarioExistente.balance);
        } else if (fetchError && fetchError.code === 'PGRST116') {
          console.log("Registrando nuevo usuario...");
          
          let padrinoUUID = null;
          const startParam = WebApp.initDataUnsafe?.start_param;

          if (startParam && startParam.startsWith('ref_')) {
            const telegramIdPadrino = startParam.replace('ref_', '');

            const { data: padrino } = await supabase
              .from('usuarios')
              .select('id')
              .eq('telegram_id', telegramIdPadrino)
              .single();

            if (padrino) {
              padrinoUUID = padrino.id;
            }
          }

          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([{ 
              telegram_id: tId, 
              username: username, 
              balance: 0,
              referidor_id: padrinoUUID 
            }])
            .select()
            .single();
          
          if (insertError) throw insertError;
          setBalance(newUser.balance);
        } else {
          throw fetchError;
        }

      } catch (error) {
        console.error("Error fatal:", error);
      } finally {
        setLoading(false); 
      }
    };

    inicializarUsuario();
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-primario)' }}>Conectando al servidor... 🔒</h2>
      </div>
    );
  }

  // ==========================================
  // 🛡️ PANTALLA DE ACCESO DENEGADO (CON RADAR DIAGNÓSTICO)
  // ==========================================
  if (!telegramId) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', overflowY: 'auto' }}>
        <h2 style={{ color: '#ff5500', marginBottom: '10px' }}>⚠️ Acceso Protegido</h2>
        <p style={{ color: 'white', fontSize: '0.9rem' }}>El sistema bloqueó el acceso porque no pudo leer tu "Pasaporte de Telegram".</p>
        
        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #ff5500', padding: '15px', borderRadius: '10px', textAlign: 'left', width: '100%', fontSize: '0.85rem', marginTop: '20px', color: '#ccc' }}>
          <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 10px 0' }}>🔍 DIAGNÓSTICO DEL SISTEMA:</p>
          <p>1. SDK Detectado: {debugInfo?.sdkCargado ? '✅ Sí' : '❌ No (Falta script en index.html)'}</p>
          <p>2. Datos Encriptados: {debugInfo?.datosRecibidos ? '✅ Sí' : '❌ Vacíos (No estás usando el link correcto)'}</p>
          <p>3. Perfil Detectado: {debugInfo?.usuarioDetectado ? '✅ Sí' : '❌ No'}</p>
        </div>

        <div style={{ marginTop: '25px', color: '#8a8d9e', fontSize: '0.85rem', textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
          <p style={{ margin: '0 0 10px 0', color: 'white' }}><strong>💡 CÓMO SOLUCIONARLO:</strong></p>
          <ol style={{ margin: 0, paddingLeft: '15px', lineHeight: '1.6' }}>
            <li>Asegúrate de NO abrir el link de Vercel directamente en el chat.</li>
            <li>Abre la app tocando el botón oficial de "Menú" de tu Bot.</li>
            <li>O bien, usa el enlace inteligente: <br/><strong style={{color: '#00c6ff'}}>https://t.me/RecompensasGT_bot/Jugar</strong></li>
          </ol>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO NORMAL ---
  return (
    <div className="app-container">
      <div className="tab-content">
        {activeTab === 'home' && <Inicio balance={balance} setBalance={setBalance} telegramId={telegramId} />}
        {activeTab === 'earn' && <GanarPuntos balance={balance} setBalance={setBalance} telegramId={telegramId} />}
        {activeTab === 'local' && <ZonaLocal />}
        {activeTab === 'profile' && <Perfil balance={balance} setBalance={setBalance} telegramId={telegramId}/>}
      </div>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>🏠 Inicio</button>
        <button className={`nav-item ${activeTab === 'earn' ? 'active' : ''}`} onClick={() => setActiveTab('earn')}>💰 Ganar</button>
        <button className={`nav-item ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>🇬🇹 Local</button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 Perfil</button>
      </nav>
    </div>
  );
}