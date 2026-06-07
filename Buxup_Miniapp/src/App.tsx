import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from './supabaseClient';
import './App.css';

import Inicio from './components/Inicio';
import GanarPuntos from './components/GanarPuntos';
import ZonaLocal from './components/ZonaLocal';
import Perfil from './components/Perfil';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'earn' | 'local' | 'profile'>('home');
  const [balance, setBalance] = useState<number>(0); 
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  useEffect(() => {
    const inicializarUsuario = async () => {
      try {
        // Le decimos a Telegram que la Mini App ya está lista para mostrarse
        WebApp.ready();

        // 1. Extraemos los datos seguros usando tu SDK oficial
        const tgUser = WebApp.initDataUnsafe?.user;

        // 🛑 CANDADO ANTI-CLONES: Si no hay usuario de Telegram, detenemos todo.
        if (!tgUser) {
          console.warn("Se intentó abrir fuera de Telegram o falló la carga.");
          setLoading(false);
          return; 
        }

        const tId = tgUser.id; 
        const username = tgUser.username || "Usuario_Telegram";
        
        setTelegramId(tId);

        // 2. Buscamos si el usuario ya existe
        const { data: usuarioExistente, error: fetchError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('telegram_id', tId)
          .single(); 

        if (usuarioExistente) {
          // Si ya existe, simplemente cargamos su balance
          setBalance(usuarioExistente.balance);
        } 
        // 3. LÓGICA DE USUARIO NUEVO Y REFERIDOS
        else if (fetchError && fetchError.code === 'PGRST116') {
          console.log("Registrando nuevo usuario...");
          
          let padrinoUUID = null;

          // Extraemos el parámetro de referido (ej: "ref_1234567")
          const startParam = WebApp.initDataUnsafe?.start_param;

          if (startParam && startParam.startsWith('ref_')) {
            const telegramIdPadrino = startParam.replace('ref_', '');

            // Buscamos el ID interno (UUID) del padrino en Supabase
            const { data: padrino } = await supabase
              .from('usuarios')
              .select('id')
              .eq('telegram_id', telegramIdPadrino)
              .single();

            if (padrino) {
              padrinoUUID = padrino.id;
            }
          }

          // Insertamos al nuevo usuario (Tu hermana) y la vinculamos a su padrino (Tú)
          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([{ 
              telegram_id: tId, 
              username: username, 
              balance: 0,
              referidor_id: padrinoUUID // 🔗 ¡AQUÍ ESTÁ LA MAGIA DEL VÍNCULO!
            }])
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          setBalance(newUser.balance);
        } else {
          // Si hay otro tipo de error de base de datos, lo lanzamos
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

  // Pantalla de carga
  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-primario)' }}>Conectando al servidor... 🔒</h2>
      </div>
    );
  }

  // 🛑 Bloqueo si lo abren fuera de Telegram (Mata al clon 123456789)
  if (!telegramId) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' }}>
        <h2>⚠️ Acceso Denegado</h2>
        <p>Debes abrir esta aplicación desde el Bot oficial dentro de Telegram.</p>
      </div>
    );
  }

  // Renderizado Normal de la App
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

export default App;