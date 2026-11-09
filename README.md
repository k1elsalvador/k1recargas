# K1 Recargas (demo)

Demo de recarga de saldo celular para el kiosco K1 Mini, basada en
[k1elsalvador/k1demoweb](https://github.com/k1elsalvador/k1demoweb). Las compañías son ficticias
y no hay backend: lo único real es el aceptador de monedas y billetes, a través de `kiosk.js`.

**Flujo:** Compañía → número (teclado en pantalla) → paquete → pago en efectivo → procesando → comprobante.

## Archivos

- `index.html`: la página.
- `recargas.js`: pantallas, compañías, paquetes y textos ES/EN. Todo lo configurable está arriba
  (`CONFIG` y `CARRIERS`).
- `styles.css`: estilos (pensados para la tablet vertical de 800×1280).
- `kiosk.js`, `kiosk.css`: copiados **sin cambios** del repo de ejemplo. No los modifique aquí;
  su fuente es el repo de la app K1DemoKiosk.

## Probar sin el kiosco

Abra `index.html` en cualquier navegador (o sírvalo con `python3 -m http.server`). `kiosk.js`
entra en modo simulado y muestra un panel abajo a la derecha con "+$1 coin", "+$20 bill", etc.
Los botones solo funcionan en la pantalla de pago, igual que el hardware real. En modo simulado
aparece además un botón "Número demo". Tecla `` ` `` oculta el panel.

## Publicar en el kiosco

El app solo da acceso al hardware a páginas en `https://k1elsalvador.github.io/...`, a la copia
incluida en el APK o a una URL que el operador escriba en la configuración del app (botón Atrás →
configuración). Por ejemplo: cree el repo `k1elsalvador/k1recargas`, suba estos archivos a `main`
y active GitHub Pages en la raíz.

## Decisiones del demo

- Los aceptadores se encienden **solo** en la pantalla de pago y se apagan al completar el pago,
  al salir, al cancelar y con el evento `reset`.
- El kiosco no da cambio (no hay API del dispensador): si se paga de más, el excedente aparece
  como "Saldo a favor" en el comprobante. Si se cancela con dinero insertado, se muestra un aviso.
- Una vez insertado dinero, ya no se puede regresar a cambiar el paquete (solo cancelar).
- Inactividad: regresa al inicio a los 90 s (180 s en la pantalla de pago).
- Números válidos: 8 dígitos que empiezan con 6 o 7.
