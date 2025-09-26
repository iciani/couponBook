// TODO: Try to implement this: https://twitter.com/fireship_dev/status/1565424801216311297
export const kFormatter = num => {
  const regex = /\B(?=(\d{3})+(?!\d))/g
  
  return Math.abs(num) > 9999 ? `${Math.sign(num) * +((Math.abs(num) / 1000).toFixed(1))}k` : Math.abs(num).toFixed(0).replace(regex, ',')
}

/**
 * Formatea un número con separadores de miles
 * @param {number|string} value - El valor a formatear
 * @param {string} locale - El locale para el formateo (por defecto 'es-ES')
 * @param {object} options - Opciones adicionales para Intl.NumberFormat
 * @returns {string} El número formateado
 */
export const formatNumber = (value, locale = 'es-ES', options = {}) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return 'N/A'
  }

  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }

  return new Intl.NumberFormat(locale, defaultOptions).format(numValue)
}

/**
 * Formatea un número como moneda
 * @param {number|string} value - El valor a formatear
 * @param {string} currency - La moneda (por defecto 'USD')
 * @param {string} locale - El locale para el formateo (por defecto 'es-ES')
 * @returns {string} El número formateado como moneda
 */
export const formatCurrency = (value, currency = 'USD', locale = 'es-ES') => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return 'N/A'
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(numValue)
}

/**
 * Formatea un número como porcentaje
 * @param {number|string} value - El valor a formatear (0-100)
 * @param {string} locale - El locale para el formateo (por defecto 'es-ES')
 * @param {number} decimals - Número de decimales (por defecto 1)
 * @returns {string} El número formateado como porcentaje
 */
export const formatPercentage = (value, locale = 'es-ES', decimals = 1) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return 'N/A'
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue / 100)
}

/**
 * Formatea un número con separadores de miles y opcionalmente con decimales
 * @param {number|string} value - El valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 0)
 * @param {string} locale - El locale para el formateo (por defecto 'es-ES')
 * @returns {string} El número formateado
 */
export const formatNumberWithDecimals = (value, decimals = 0, locale = 'es-ES') => {
  return formatNumber(value, locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formatea un número de manera compacta (ej: 1K, 1M, 1B)
 * @param {number|string} value - El valor a formatear
 * @param {string} locale - El locale para el formateo (por defecto 'es-ES')
 * @returns {string} El número formateado de manera compacta
 */
export const formatCompactNumber = (value, locale = 'es-ES') => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return 'N/A'
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(numValue)
}
