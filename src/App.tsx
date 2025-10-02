import { useState } from "react";
import "./App.css";
import { runWithConcurrency, fakePurchase } from "./simulate";

import { fakeUser } from "./simulateUsers";



import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [mode, setMode] = useState<"usuarios" | "pedidos">("usuarios");

  // --- Estado usuarios ---
  const [cantidad, setCantidad] = useState<string>("");
  const [usuarios, setUsuarios] = useState(0);
  const [errorUsuarios, setErrorUsuarios] = useState(0);
  const [tiempoUsuarios, setTiempoUsuarios] = useState(0);
  const [labelsUsuarios, setLabelsUsuarios] = useState<string[]>([]);
  const [chartUsuarios, setChartUsuarios] = useState<number[]>([]);

  
  const [numPedidos, setNumPedidos] = useState<string>("");
  const [concurrency, setConcurrency] = useState<string>("");
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [tiempoPedidos, setTiempoPedidos] = useState(0);
  const [labelsPedidos, setLabelsPedidos] = useState<string[]>([]);
  const [chartPedidos, setChartPedidos] = useState<number[]>([]);

  const [running, setRunning] = useState(false);


  const simulateUsers = async () => {
    const total = parseInt(cantidad);
    if (!total || total <= 0) {
      alert("Ingrese un número válido de usuarios");
      return;
    }

    setRunning(true);
    setUsuarios(0);
    setErrorUsuarios(0);
    setTiempoUsuarios(0);
    setLabelsUsuarios([]);
    setChartUsuarios([]);

    const start = performance.now();

    for (let i = 1; i <= total; i++) {
      try {
        await fakeUser(i); // ahora con latencia + CPU + error random
        setUsuarios((prev) => prev + 1);
        setLabelsUsuarios((prev) => [...prev, `OK #${i}`]);
        setChartUsuarios((prev) => [...prev, 1]);
      } catch {
        setErrorUsuarios((prev) => prev + 1);
        setLabelsUsuarios((prev) => [...prev, `Error #${i}`]);
        setChartUsuarios((prev) => [...prev, 0]);
      }

      
      if (i % 200 === 0) {
        await new Promise((res) => setTimeout(res, 1));
      }
    }

    const end = performance.now();
    setTiempoUsuarios((end - start) / 1000);
    setRunning(false);
  };

  // 🔹 Simular pedidos concurrentes
  const simulatePedidos = async () => {
    const pedidos = parseInt(numPedidos);
    const concurrencia = parseInt(concurrency);

    if (!pedidos || !concurrencia || pedidos <= 0 || concurrencia <= 0) {
      alert("Ingrese un valor que sea válido");
      return;
    }

    setRunning(true);
    setSuccessCount(0);
    setErrorCount(0);
    setTiempoPedidos(0);
    setLabelsPedidos([]);
    setChartPedidos([]);

    const tasks = Array.from({ length: pedidos }, (_, i) => async () => {
      try {
        await fakePurchase({ orderId: i + 1 });
        setSuccessCount((prev) => prev + 1);
        setLabelsPedidos((prev) => [...prev, `OK #${i + 1}`]);
        setChartPedidos((prev) => [...prev, 1]);
      } catch {
        setErrorCount((prev) => prev + 1);
        setLabelsPedidos((prev) => [...prev, `Error #${i + 1}`]);
        setChartPedidos((prev) => [...prev, 0]);
      }
    });

    const start = performance.now();
    await runWithConcurrency(tasks, concurrencia);
    const end = performance.now();

    setTiempoPedidos((end - start) / 1000);
    setRunning(false);
  };

 
  const dataUsuarios = {
    labels: labelsUsuarios,
    datasets: [
      {
        label: "Usuarios creados (1=Éxito, 0=Error)",
        data: chartUsuarios,
        backgroundColor: chartUsuarios.map((v) => (v === 1 ? "green" : "red")),
      },
    ],
  };

  const dataPedidos = {
    labels: labelsPedidos,
    datasets: [
      {
        label: "Pedidos procesados (1=Éxito, 0=Error)",
        data: chartPedidos,
        backgroundColor: chartPedidos.map((v) => (v === 1 ? "green" : "red")),
      },
    ],
  };

  return (
    <div className="container">
      <header className="header">
  <h1>🚀 Simulación de Sobrecarga</h1>
  <p>Proyecto de clase</p>
  <div className="modes">
    <div className="mode-card">
      <h3>👥 Usuarios masivos</h3>
      <p>Simula la creación de miles de usuarios al mismo tiempo.</p>
    </div>
    <div className="mode-card">
      <h3>📦 Pedidos concurrentes</h3>
      <p>Procesa pedidos en paralelo con latencia, errores y balanceo.</p>
    </div>
  </div>
</header>


      {/* Selector de modo */}
      <div style={{ margin: "20px" }}>
        <button onClick={() => setMode("usuarios")}>Simular Usuarios</button>
        <button onClick={() => setMode("pedidos")} style={{ marginLeft: "10px" }}>
          Simular Pedidos
        </button>
      </div>

      {/* Modo Usuarios */}
      {mode === "usuarios" && (
        <div className="card">
          <h2>Simulación de Usuarios Masivos</h2>
          <input
            type="text"
            value={cantidad}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setCantidad(val.replace(/^0+(?=\d)/, ""));
              }
            }}
            placeholder="Cantidad de usuarios (Ej: 20000)"
          />
          <button onClick={simulateUsers} disabled={running}>
            {running ? "Simulando..." : "Iniciar Simulación"}
          </button>

          {(usuarios + errorUsuarios) > 0 && (
            <div className="results">
              <h3>Resultados</h3>
              <p>✅ Éxitos: <b>{usuarios}</b></p>
              <p>❌ Errores: <b>{errorUsuarios}</b></p>
              <p>⏱ Tiempo total: <b>{tiempoUsuarios.toFixed(2)} segundos</b></p>
            </div>
          )}

          {labelsUsuarios.length > 0 && (
            <div className="chart">
              <Bar data={dataUsuarios} />
            </div>
          )}
        </div>
      )}

      {/* Modo Pedidos */}
      {mode === "pedidos" && (
        <div className="card">
          <h2>Simulación de Pedidos Concurrentes</h2>
          <input
            type="text"
            value={numPedidos}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setNumPedidos(val.replace(/^0+(?=\d)/, ""));
              }
            }}
            placeholder="Cantidad de pedidos (Ej: 100)"
          />
          <input
            type="text"
            value={concurrency}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setConcurrency(val.replace(/^0+(?=\d)/, ""));
              }
            }}
            placeholder="Concurrencia (Ej: 10)"
          />
          <button onClick={simulatePedidos} disabled={running}>
            {running ? "Simulando..." : "Iniciar Simulación"}
          </button>

          {(successCount + errorCount) > 0 && (
            <div className="results">
              <h3>Resultados</h3>
              <p>✅ Éxitos: <b>{successCount}</b></p>
              <p>❌ Errores: <b>{errorCount}</b></p>
              <p>⏱ Tiempo total: <b>{tiempoPedidos.toFixed(2)} segundos</b></p>
            </div>
          )}

          {labelsPedidos.length > 0 && (
            <div className="chart">
              <Bar data={dataPedidos} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
