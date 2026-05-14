/**
 * Configuración de la aplicación
 */
const config = {
  api: {
    url: import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  }
}

export default config
