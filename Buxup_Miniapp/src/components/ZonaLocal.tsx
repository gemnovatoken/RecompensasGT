import { useState } from 'react';

export default function ZonaLocal() {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [empresa, setEmpresa] = useState<string>('');
  const [impresiones, setImpresiones] = useState<number | ''>('');
  
  // Fórmula de ejemplo: Q0.05 por cada impresión publicitaria
  const costoPorImpresion = 0.05;
  const valorEstimado = typeof impresiones === 'number' ? (impresiones * costoPorImpresion).toFixed(2) : '0.00';

  // Función para generar y descargar el documento de cotización
  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empresa || !impresiones) {
      alert('Por favor llena todos los campos.');
      return;
    }

    // Creamos el contenido del documento
    const contenidoDocumento = `
    --- COTIZACIÓN PUBLICITARIA: CENTRO DE RECOMPENSAS GT ---
    Fecha: ${new Date().toLocaleDateString()}
    Empresa: ${empresa}
    
    Servicio: Campaña de Anuncios Locales
    Impresiones solicitadas: ${impresiones}
    Costo por impresión: Q${costoPorImpresion}
    
    TOTAL ESTIMADO A PAGAR: Q${valorEstimado}
    
    * Este documento es un comprobante de solicitud y no puede ser modificado.
    --------------------------------------------------------
    `;

    // Lógica para crear un archivo y forzar la descarga en el navegador
    const blob = new Blob([contenidoDocumento], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cotizacion_${empresa.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('¡Solicitud enviada! Tu documento ha sido descargado.');
    setIsFormOpen(false); // Cerramos el formulario
    setEmpresa('');
    setImpresiones('');
  };

  return (
    <div className="local-container">
      <h2>🇬🇹 Anunciantes Locales</h2>
      
      {/* --- SECCIÓN SUPERIOR: FORMULARIO --- */}
      <div className="earn-section">
        <h3>Crear Campaña Publicitaria</h3>
        <p>Llega a miles de usuarios guatemaltecos hoy mismo.</p>
        
        {!isFormOpen ? (
          <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
            📢 Crear
          </button>
        ) : (
          <form className="campaign-form" onSubmit={handleDownloadSubmit}>
            <div className="form-group">
              <label>Nombre de tu Empresa / Negocio:</label>
              <input 
                type="text" 
                value={empresa} 
                onChange={(e) => setEmpresa(e.target.value)} 
                placeholder="Ej. Pollo Campero"
                required
              />
            </div>

            <div className="form-group">
              <label>Cantidad de Impresiones Deseadas:</label>
              <input 
                type="number" 
                value={impresiones} 
                onChange={(e) => setImpresiones(Number(e.target.value))} 
                placeholder="Ej. 10000"
                required
                min="100"
              />
            </div>

            <div className="estimate-box">
              <p>Valor Estimado de la Campaña:</p>
              <h2>Q{valorEstimado}</h2>
            </div>

            <button type="submit" className="btn-secondary">
              📄 Submit y Descargar Doc
            </button>
            <button type="button" className="btn-close" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </button>
          </form>
        )}
      </div>

      {/* --- SECCIÓN INFERIOR: BLOQUEADA --- */}
      <div className="earn-section locked-section">
        <h3>🔒 Encuestas Chapinas</h3>
        <p>Bloqueado. Se habilitará muy pronto.</p>
      </div>

    </div>
  );
}