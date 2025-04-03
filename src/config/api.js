
const API_URL = {
  development: 'http://localhost:3002',
  production: 'https://winston-omae.onrender.com',
};

// Determinar el entorno actual
const environment = import.meta.env.MODE || 'development';

// Exportar la URL base de la API
export const BASE_URL = API_URL[environment];

console.log(`Using API URL: ${BASE_URL} (${environment} environment)`);