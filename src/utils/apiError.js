// Extrae el mensaje de error que envía el backend; si no viene, usa el de reserva
export function getErrorMessage(error, fallback) {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error;
  }
  return fallback;
}