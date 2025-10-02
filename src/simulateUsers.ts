// src/simulateUsers.ts
export interface User {
    id: number;
    name: string;
    email: string;
  }
  
  // 🔹 Genera un solo usuario con latencia, CPU y chance de error
  export async function fakeUser(
    id: number,
    latencyMsRange: [number, number] = [20, 100],
    errorRate = 0.05
  ): Promise<User> {
    const [min, max] = latencyMsRange;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  
    // Latencia simulada
    await new Promise((res) => setTimeout(res, delay));
  
    // Simulación simple de CPU (cálculo arbitrario)
    let acc = 0;
    for (let i = 0; i < 5000; i++) {
      acc = (acc * 33 + i) % 999983;
    }
  
    // Error aleatorio
    if (Math.random() < errorRate) {
      throw new Error("❌ Error creando usuario");
    }
  
    return {
      id,
      name: `Usuario_${id}`,
      email: `usuario${id}@correo.com`,
    };
  }
  