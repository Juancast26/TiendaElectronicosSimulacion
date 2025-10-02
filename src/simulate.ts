// Simula carga de CPU
export function heavyCpuWork(iterations = 20000): number {
    let acc = 0;
    for (let i = 0; i < iterations; i++) {
      acc = (acc * 33 + i) % 999983;
    }
    return acc;
  }
  
  // Simula la creación de un pedido con latencia y posibles errores
  export async function fakePurchase<T>(
    payload: T,
    latencyMsRange: [number, number] = [50, 250]
  ) {
    const [min, max] = latencyMsRange;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(r => setTimeout(r, delay));
    heavyCpuWork();
  
    // 5% de probabilidad de fallo
    if (Math.random() < 0.05) throw new Error("Error en el servidor");
  
    return { ok: true, data: payload };
  }
  
  // Controla concurrencia
  export async function runWithConcurrency<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    let idx = 0;
    const workers = new Array(Math.min(concurrency, tasks.length)).fill(0).map(async () => {
      while (idx < tasks.length) {
        const myIndex = idx++;
        results[myIndex] = await tasks[myIndex]();
      }
    });
    await Promise.all(workers);
    return results;
  }
  