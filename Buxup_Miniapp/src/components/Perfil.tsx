import { useState } from 'react';

interface PerfilProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

export default function Perfil({ balance, setBalance }: PerfilProps) {
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  const vaultTypes = ['Familiar', 'Gamer', 'Amigos', 'Colegas'];

  // Función para copiar el link de referido al portapapeles
  const handleCopyLink = () => {
    // Aquí iría el link real generado por tu Bot de Telegram
    navigator.clipboard.writeText('https://t.me/TuBotRecompensas?start=ref_12345');
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000); // El mensaje vuelve a la normalidad después de 2 segundos
  };

  // Abre la ventana de confirmación de la bóveda
  const handleOpenVault = (type: string) => {
    setSelectedVault(type);
    setIsVaultModalOpen(true);
  };

  // Lógica para crear la bóveda y descontar los puntos
  const handleCreateVault = () => {
    if (balance >= 100) {
      setBalance(prev => prev - 100);
      alert(`¡Éxito! Has creado la Bóveda ${selectedVault}. Se han descontado 100 pts.`);
      setIsVaultModalOpen(false);
    } else {
      alert('Saldo insuficiente. Necesitas al menos 100 pts para crear una bóveda.');
    }
  };

  return (
    <div className="profile-container">
      <h2>👤 Mi Perfil</h2>

      {/* --- REPETIMOS EL BALANCE PARA QUE ESTÉ VISIBLE --- */}
      <div className="balance-card profile-balance">
        <p>Balance Total</p>
        <h1>{balance.toLocaleString()} pts</h1>
      </div>

      {/* --- SECCIÓN DE REFERIDOS --- */}
      <div className="earn-section">
        <h3>🤝 Invita y Gana</h3>
        <p>Gana el <strong>5% de fee</strong> de todos los puntos que generen tus referidos de por vida.</p>
        <button className="btn-secondary" onClick={handleCopyLink}>
          {linkCopied ? '¡Enlace Copiado! ✅' : '🔗 Copiar Link de Referido'}
        </button>
      </div>

      {/* --- SECCIÓN DE BÓVEDAS --- */}
      <div className="earn-section">
        <h3>🛡️ Bóvedas de Puntos</h3>
        <p>Crea un espacio exclusivo para ti y tu círculo.</p>
        
        <div className="vaults-grid">
          {vaultTypes.map((type) => (
            <button key={type} className="btn-vault" onClick={() => handleOpenVault(type)}>
              Bóveda<br/>{type}
            </button>
          ))}
        </div>
      </div>

      {/* --- VENTANA EMERGENTE DE LA BÓVEDA --- */}
      {isVaultModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#0a84ff' }}>Crear Bóveda {selectedVault}</h3>
            
            <div className="vault-rules">
              <p>⚠️ <strong>Condiciones de la Bóveda:</strong></p>
              <ul>
                <li>Costo de creación: <strong>100 pts</strong></li>
                <li>Costo de ingreso por persona: <strong>100 pts</strong></li>
                <li>Si alguien sale y vuelve a entrar, paga <strong>100 pts</strong> de nuevo.</li>
              </ul>
            </div>

            <p style={{ textAlign: 'center', margin: '15px 0' }}>
              Tu balance actual: <strong>{balance} pts</strong>
            </p>

            <button className="btn-primary" onClick={handleCreateVault}>
              Crear Bóveda (-100 pts)
            </button>
            <button className="btn-close" onClick={() => setIsVaultModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}