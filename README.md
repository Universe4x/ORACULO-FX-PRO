# ORÁCULO FX PRO - conector MT5 local v0.3

Esta versión añade un puente local de Windows y un EA MT5 de SOLO LECTURA.

## Qué transmite
- Símbolo, Bid, Ask, spread y hora del servidor.
- Balance, equity, beneficio flotante, divisa y número de posiciones abiertas.

## Qué NO hace
- No abre, modifica ni cierra operaciones.
- No almacena contraseñas MT5.
- No expone el puente a Internet ni sustituye un servidor HTTPS de producción.

## Instalación
Consulta `bridge/LEEME.txt`. Requiere PC Windows y móvil en la misma Wi-Fi, Python 3 y MT5 de escritorio.

El EA debe añadirse a la lista de WebRequest permitidas de MT5: `http://127.0.0.1:8765`.
La APK debe configurarse con la URL LAN que muestra el puente y el token generado.

Esta es una primera integración local de prueba. Antes de añadir ejecución automática o usar dinero real, habrá que implementar autenticación de producción, cifrado extremo a extremo, permisos, límites de riesgo, auditoría y pruebas en demo.
