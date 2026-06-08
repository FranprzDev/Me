/**
 * Responde al warning: «Clock: This module has been deprecated. Please use
 * THREE.Timer instead.»
 *
 * Origen real: three.js r183 marcó `THREE.Clock` como deprecado en favor de
 * `THREE.Timer`, y `@react-three/fiber@9` todavía crea internamente
 * `new THREE.Clock()` para su render loop (ver `events-*.esm.js`). Es decir, el
 * warning NO sale de nuestro código —el nuestro mide tiempo con
 * `performance.now()`, no con Clock— sino de la librería, y no podemos
 * cambiarlo sin forkearla. Se dispara una sola vez al montar el `<Canvas>`.
 *
 * Hasta que R3F migre a `THREE.Timer`, filtramos ESE mensaje puntual (y nada
 * más) para mantener la consola limpia. El guard evita parchear `console.warn`
 * más de una vez aunque el módulo se evalúe varias veces.
 */
if (typeof window !== "undefined") {
  const flag = window as unknown as { __r3fClockWarnPatched?: boolean };
  if (!flag.__r3fClockWarnPatched) {
    flag.__r3fClockWarnPatched = true;
    const original = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Clock: This module has been deprecated")
      ) {
        return; // warning conocido de @react-three/fiber; ya documentado.
      }
      original(...args);
    };
  }
}
