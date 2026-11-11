# ORÁCULO FX PRO — prototipo Android

## Qué incluye esta entrega
- Interfaz móvil oscura en español con navegación.
- Panel de XAU/USD y lista inicial de mercados.
- Motor técnico local inicial: EMA, RSI, ATR, consenso M5–D1 y objetivos ATR TP1/TP2/TP3 con stop técnico ilustrativo.
- Accesos directos a Investing.com, FXStreet, Reuters y Trading Economics.
- Secciones preparadas para señales, noticias, cuenta MT5 y configuración.
- Workflow de GitHub Actions para compilar una APK Android de depuración.

## Limitaciones importantes de esta versión
Esta entrega NO es todavía una plataforma de trading lista para clientes ni ejecuta órdenes:
1. Las cotizaciones se intentan obtener de Yahoo Finance. El proveedor puede bloquear peticiones desde Android, limitar el acceso o entregar datos retrasados. Para producción hace falta contratar/configurar una API de mercado estable y autorizada.
2. Los objetivos son cálculos técnicos basados en ATR; no son predicciones de IA, no incorporan aún liquidez real, order flow, POC institucional ni análisis semántico de noticias. El porcentaje mostrado es una puntuación técnica heurística, no una probabilidad estadística calibrada.
3. Los enlaces de noticias abren las webs de origen. No se copian titulares ni contenido de Investing.com/Reuters dentro de la app. La integración embebida requiere APIs/licencias y respeto de sus condiciones.
4. La conexión MT5 está preparada a nivel de interfaz/arquitectura, pero NO existe aún backend de clientes ni EA conector operativo. No activar trading real. La ejecución requiere un servidor seguro autenticado, EA MT5 instalado en MT5 de escritorio/VPS, protocolo firmado, controles de riesgo y pruebas demo.
5. No se solicitan ni almacenan contraseñas de broker en la APK.

## Cómo obtener la APK
1. Crea un repositorio privado o público en GitHub y sube TODO el contenido de esta carpeta (incluida `.github`).
2. Abre la pestaña **Actions** y ejecuta **Build ORACULO FX PRO APK**.
3. Cuando termine correctamente, descarga el artefacto `ORACULO-FX-PRO-APK`.
4. Descomprime el artefacto y encontrarás `app-debug.apk`.
5. Pásalo al Android e instálalo permitiendo temporalmente instalaciones desde esa fuente.

La APK de depuración sirve para pruebas. Para distribuirla a clientes hace falta una compilación release firmada con una clave privada custodiada, política de privacidad, términos, soporte y pruebas en dispositivos reales.

## Arquitectura objetivo de producción
Android APK ⇄ API HTTPS autenticada ⇄ motor de análisis/datos/noticias ⇄ EA MT5 en VPS/terminal.
El servidor nunca debe aceptar órdenes sin validación de identidad, permisos, límites de riesgo, idempotencia, registro de auditoría y mecanismo de emergencia.
