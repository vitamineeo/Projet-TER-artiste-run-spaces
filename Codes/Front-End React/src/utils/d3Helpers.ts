
/**
 * Utilitaires pour les visualisations D3
 */

// Fonction pour charger des scripts externes
export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Fonction pour ajouter des styles CSS
export const loadStyles = (): void => {
  const style = document.createElement('style');
  style.textContent = `
    .tooltip {
      position: absolute;
      padding: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      pointer-events: none;
      font-size: 14px;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }
    .tooltip-title {
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
    }
    .tooltip-info {
      color: #666;
      font-size: 12px;
      text-align: left;
      line-height: 1.4;
    }
    .tooltip-info div {
      margin: 2px 0;
    }
    .location-point {
      fill: #e41a1c;
      opacity: 0.7;
    }
    .location-point:hover {
      opacity: 1;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
};

// Initialisation des scripts nécessaires
export const initScripts = async (): Promise<void> => {
  try {
    loadStyles();
    await Promise.all([
      loadScript('https://code.jquery.com/jquery-3.6.0.min.js'),
      loadScript('https://d3js.org/d3.v7.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js')
    ]);
    console.log('Scripts loaded successfully');
  } catch (error) {
    console.error('Script loading error:', error);
  }
};
