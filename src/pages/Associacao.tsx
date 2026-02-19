import { useEffect, useState } from "react";

interface Chave {
  id: number;
  numero: string;
}

export default function Associacao() {
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [chaveSelecionada, setChaveSelecionada] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [folha, setFolha] = useState("");
  const [poste, setPoste] = useState("");
  const [coordenada, setCoordenada] = useState("");
  const [mensagem, setMensagem] = useState("");

  // 🔄 Carregar chaves disponíveis
  useEffect(() => {
    carregarChaves();
  }, []);

  async function carregarChaves() {
    const response = await fetch("http://localhost:3000/chaves-disponiveis");
    const data = await response.json();
    setChaves(data);
  }

  async function associar() {
    if (!chaveSelecionada) {
      setMensagem("Selecione uma chave.");
      return;
    }

    const response = await fetch("http://localhost:3000/associar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chave_id: chaveSelecionada,
        nota,
        folha,
        poste,
        coordenada,
      }),
    });

    if (response.ok) {
      setMensagem("Associado com sucesso!");
      setNota("");
      setFolha("");
      setPoste("");
      setCoordenada("");
      setChaveSelecionada(null);
      carregarChaves(); // Atualiza lista
    } else {
      setMensagem("Erro ao associar.");
    }
  }

  return (
    <div className="container">
      <h1>Associação de Chaves</h1>

      <div className="form">
        <label>Chave Disponível</label>
        <select
          value={chaveSelecionada ?? ""}
          onChange={(e) => setChaveSelecionada(Number(e.target.value))}
        >
          <option value="">Selecione...</option>
          {chaves.map((chave) => (
            <option key={chave.id} value={chave.id}>
              {chave.numero}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />

        <input
          type="text"
          placeholder="Folha"
          value={folha}
          onChange={(e) => setFolha(e.target.value)}
        />

        <input
          type="text"
          placeholder="Poste"
          value={poste}
          onChange={(e) => setPoste(e.target.value)}
        />

        <input
          type="text"
          placeholder="Coordenada"
          value={coordenada}
          onChange={(e) => setCoordenada(e.target.value)}
        />

        <button onClick={associar}>Associar</button>

        {mensagem && <p className="mensagem">{mensagem}</p>}
      </div>
    </div>
  );
}
