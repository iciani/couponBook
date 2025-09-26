# Instrucciones para Limpiar el Caché del Navegador

## Problema
El logo de Qurable puede no actualizarse debido al caché del navegador.

## Solución

### 1. Hard Refresh (Recomendado)
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`

### 2. Limpiar Caché del Navegador
- **Chrome**: 
  - F12 → Network → Disable cache (marcar checkbox)
  - O ir a Settings → Privacy → Clear browsing data
- **Firefox**: 
  - F12 → Network → Settings → Disable cache
  - O ir a Settings → Privacy → Clear Data
- **Safari**: 
  - Develop → Empty Caches
  - O Safari → Preferences → Privacy → Manage Website Data

### 3. Modo Incógnito/Privado
- Abrir una ventana de incógnito/privado para verificar que el logo se carga correctamente

### 4. Verificar Archivos
- El logo transparente está en: `/public/logo-transparent.png`
- Se eliminaron los logos viejos: `logo-dark.png`, `logo-light.png`, `logo.png`

## Estado Actual
- ✅ Logo transparente descargado
- ✅ Componentes actualizados con parámetro de versión
- ✅ Logos viejos eliminados
- ✅ Servidor de desarrollo reiniciado

El logo debería aparecer ahora con fondo transparente en todos los componentes.
