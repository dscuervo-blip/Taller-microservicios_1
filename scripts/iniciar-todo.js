/**
 * Inicia en paralelo todos los procesos marcados como "implementado" en
 * servicios.json (cada microservicio en su propio proceso y puerto).
 *
 * Ejecutar con:  npm start   (o  node scripts/iniciar-todo.js)
 * Detener con:   Ctrl + C
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const { servicios } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'servicios.json'), 'utf8'));

const procesos = [];

servicios
  .filter((s) => s.implementado)
  .forEach((servicio) => {
    const archivo = path.join(RAIZ, servicio.archivo);
    if (!fs.existsSync(archivo)) {
      console.warn(`[inicio] Se omite ${servicio.nombre}: no existe ${servicio.archivo}`);
      return;
    }

    const proceso = spawn(process.execPath, [archivo], { cwd: RAIZ, stdio: 'inherit' });
    proceso.on('exit', (codigo) => {
      if (codigo !== 0 && codigo !== null) {
        console.error(`[inicio] ${servicio.nombre} se detuvo con código ${codigo}`);
      }
    });
    procesos.push(proceso);
  });

console.log(`[inicio] ${procesos.length} procesos iniciados. Presione Ctrl + C para detenerlos.`);

function detenerTodo() {
  procesos.forEach((proceso) => proceso.kill());
  process.exit(0);
}

process.on('SIGINT', detenerTodo);
process.on('SIGTERM', detenerTodo);
