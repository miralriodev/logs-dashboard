// Configuración de URLs de API según el entorno
const API_URL = {
  development: 'http://localhost:10000',
  production: 'https://winston-omae.onrender.com', // Reemplaza con la URL de tu backend en Render
};

// Determinar el entorno actual
const environment = import.meta.env.MODE || 'development';

// Exportar la URL base de la API
export const BASE_URL = API_URL[environment];

console.log(`Using API URL: ${BASE_URL} (${environment} environment)`);