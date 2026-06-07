import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from './supabaseClient';
import './App.css';

import Inicio from './components/Inicio';
import GanarPuntos from './components/GanarPuntos';
import ZonaLocal from './components/ZonaLocal';
import Perfil from './components/Perfil';

function App() {
  // Aquí definimos el estado. ESLint solo se quejará si NO usas setActiveTab abajo.
  const [activeTab, setActiveTab] = useState<'home' | 'earn' | 'local' | 'profile'>('home');
  const [balance, setBalance] = useState<number>(0); 
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  useEffect(() => {
    const inicializarUsuario = async () => {
      try {
        let tId = 123456789; 
        let username = "Usuario_Prueba";

        if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
          tId = WebApp.initDataUnsafe.user.id;
          username = WebApp.initDataUnsafe.user.username || "Usuario_Telegram";
        }
        
        setTelegramId(tId);

        const { data: usuarioExistente, error: fetchError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('telegram_id', tId)
          .single(); 

        let usuario = usuarioExistente;

        if (!usuario && fetchError && fetchError.code === 'PGRST116') {
          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([{ telegram_id: tId, username: username, balance: 0 }])
            .select()
            .single();
          
          if (insertError) throw insertError;
          usuario = newUser;
        } else if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (usuario) {
          setBalance(usuario.balance);
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

  return (
    <div className="app-container">
      <div className="tab-content">
        {activeTab === 'home' && <Inicio balance={balance} setBalance={setBalance} telegramId={telegramId} />}
        {activeTab === 'earn' && <GanarPuntos balance={balance} setBalance={setBalance} telegramId={telegramId} />}
        {activeTab === 'local' && <ZonaLocal />}
        {activeTab === 'profile' && <Perfil balance={balance} setBalance={setBalance} />}
      </div>

      <nav className="bottom-nav">
        {/* Aquí estamos usando setActiveTab, por eso ESLint no debería dar error */}
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>🏠 Inicio</button>
        <button className={`nav-item ${activeTab === 'earn' ? 'active' : ''}`} onClick={() => setActiveTab('earn')}>💰 Ganar</button>
        <button className={`nav-item ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>🇬🇹 Local</button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 Perfil</button>
      </nav>
    </div>
  );
}

export default App;