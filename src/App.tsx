import { useMemo, useState } from "react";
import { fakerES as faker } from "@faker-js/faker"; // Faker en español
import type { Product, Order } from "./types";
import { fakePurchase, runWithConcurrency } from "./simulate";

export default function App() {
  const [pedidosCount, setPedidosCount] = useState(500);
  const [concurrencia, setConcurrencia] = useState(20);
  const [procesando, setProcesando] = useState(false);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [errores, setErrores] = useState<number>(0);
  const [duracionMs, setDuracionMs] = useState<number | null>(null);

  // Catálogo de electrónicos en español
  const productos: Product[] = useMemo(() => {
    const catalogo = [
      "Teléfono inteligente",
      "Computador portátil",
      "Audífonos inalámbricos",
      "Televisor LED 55''",
      "Consola de videojuegos",
      "Tablet Android",
      "Cámara digital",
      "Smartwatch",
      "Barra de sonido",
      "Disco duro externo"
    ];

    return catalogo.map(nombre => ({
      id: faker.string.uuid(),
      name: nombre,
      price: faker.number.int({ min: 150000, max: 5000000 }) // precios en COP
    }));
  }, []);

  // Generación de pedidos
  const tareas = useMemo(() => {
    return new Array(pedidosCount).fill(0).map(() => {
      const producto = productos[Math.floor(Math.random() * productos.length)];
      const pedido: Order = {
        id: faker.string.uuid(),
        productId: producto.id,
        productName: producto.name,
        price: producto.price,
        createdAt: new Date().toISOString(),
      };
      return async () => {
        const res = await fakePurchase(pedido);
        return res.data as Order;
      };
    });
  }, [pedidosCount, productos]);

  // Ejecutar simulación
  async function run() {
    setProcesando(true);
    setErrores(0);
    setPedidos([]);
    setDuracionMs(null);
    const inicio = performance.now();
    try {
      const resultados = await runWithConcurrency(
        tareas.map(fn => async () => {
          try {
            return await fn();
          } catch {
            setErrores(prev => prev + 1);
            return null;
          }
        }),
        concurrencia
      );
      const ok = resultados.filter(Boolean) as Order[];
      setPedidos(ok);
    } finally {
      const fin = performance.now();
      setDuracionMs(Math.round(fin - inicio));
      setProcesando(false);
    }
  }

  const throughput = duracionMs
    ? (pedidos.length / (duracionMs / 1000)).toFixed(1)
    : "-";

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", color: "#2c3e50" }}>🛒 Tienda de Electrónicos – Simulación de Sobrecarga</h1>

      {/* Catálogo */}
      <h2 style={{ marginTop: "30px" }}>Catálogo de Productos</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "30px" }}>
        {productos.map(p => (
          <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", background: "#f9f9f9" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#2980b9" }}>{p.name}</h3>
            <p style={{ margin: 0 }}>
              Precio: <b>{p.price.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</b>
            </p>
          </div>
        ))}
      </div>

      {/* Configuración */}
      <h2>Configuración de la Simulación</h2>
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <label>
          Pedidos a simular:
          <input
            type="number"
            value={pedidosCount}
            onChange={e => setPedidosCount(parseInt(e.target.value || "0"))}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>

        <label>
          Concurrencia:
          <input
            type="number"
            value={concurrencia}
            onChange={e => setConcurrencia(parseInt(e.target.value || "1"))}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>
      </div>

      {/* Botón */}
      <button
        onClick={run}
        disabled={procesando}
        style={{
          padding: "12px 20px",
          backgroundColor: procesando ? "#95a5a6" : "#27ae60",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: procesando ? "not-allowed" : "pointer",
          fontWeight: "bold",
          marginBottom: "30px"
        }}
      >
        {procesando ? "Procesando compras..." : "Simular Compras Masivas"}
      </button>

      {/* Resultados */}
      <h2>Resultados</h2>
      <ul style={{ lineHeight: "1.8" }}>
        <li>✅ Pedidos procesados: <b>{pedidos.length}</b></li>
        <li>❌ Errores: <b>{errores}</b></li>
        <li>⏱️ Tiempo total: <b>{duracionMs ? duracionMs + " ms" : "-"}</b></li>
        <li>⚡ Throughput: <b>{throughput} pedidos/seg</b></li>
      </ul>
    </div>
  );
}
