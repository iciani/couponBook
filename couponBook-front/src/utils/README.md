# Utilidades de Formateo

Este directorio contiene funciones de utilidad para formatear números y otros datos en toda la aplicación.

## Funciones Disponibles

### formatNumber(value, locale, options)
Formatea un número con separadores de miles.

```javascript
import { formatNumber } from '@/@core/utils/formatters'

// Ejemplos de uso:
formatNumber(1000)           // "1.000"
formatNumber(1000000)        // "1.000.000"
formatNumber(1234.56)        // "1.235"
formatNumber(null)           // "N/A"
formatNumber(undefined)      // "N/A"
```

### formatCurrency(value, currency, locale)
Formatea un número como moneda.

```javascript
import { formatCurrency } from '@/@core/utils/formatters'

// Ejemplos de uso:
formatCurrency(1000)                    // "$1.000,00"
formatCurrency(1000, 'EUR')            // "1.000,00 €"
formatCurrency(1000, 'USD', 'en-US')   // "$1,000.00"
```

### formatPercentage(value, locale, decimals)
Formatea un número como porcentaje.

```javascript
import { formatPercentage } from '@/@core/utils/formatters'

// Ejemplos de uso:
formatPercentage(50)        // "50,0%"
formatPercentage(75.5)      // "75,5%"
formatPercentage(100, 'es-ES', 2)  // "100,00%"
```

### formatNumberWithDecimals(value, decimals, locale)
Formatea un número con separadores de miles y decimales específicos.

```javascript
import { formatNumberWithDecimals } from '@/@core/utils/formatters'

// Ejemplos de uso:
formatNumberWithDecimals(1234.56, 2)   // "1.234,56"
formatNumberWithDecimals(1000, 0)      // "1.000"
formatNumberWithDecimals(1234.567, 3)  // "1.234,567"
```

### formatCompactNumber(value, locale)
Formatea un número de manera compacta (K, M, B).

```javascript
import { formatCompactNumber } from '@/@core/utils/formatters'

// Ejemplos de uso:
formatCompactNumber(1000)      // "1K"
formatCompactNumber(1000000)   // "1M"
formatCompactNumber(1500000)   // "1,5M"
formatCompactNumber(1000000000) // "1B"
```

## Uso en Componentes Vue

```vue
<template>
  <div>
    <p>Cantidad: {{ formatNumber(quantity) }}</p>
    <p>Precio: {{ formatCurrency(price) }}</p>
    <p>Progreso: {{ formatPercentage(progress) }}</p>
  </div>
</template>

<script setup>
import { formatNumber, formatCurrency, formatPercentage } from '@/@core/utils/formatters'

const quantity = 1000000
const price = 1500.50
const progress = 75.5
</script>
```

## Configuración de Locale

Por defecto, todas las funciones usan el locale 'es-ES' (español de España). Puedes cambiar esto pasando un locale diferente:

```javascript
formatNumber(1000, 'en-US')  // "1,000"
formatNumber(1000, 'fr-FR')  // "1 000"
formatNumber(1000, 'de-DE')  // "1.000"
```

## Manejo de Valores Nulos

Todas las funciones manejan automáticamente valores nulos, undefined o vacíos, devolviendo 'N/A' en esos casos.
