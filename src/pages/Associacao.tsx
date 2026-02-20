import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type Props = {
  usuario: {
    matricula: string;
    nome: string;
    tipo: string;
  };
  setPagina: (pagina: "home" | "cadastro" | "associacao") => void;
  handleLogout: () => void;
  atualizarContagem: () => Promise<void>;
};

type Chave = {
  id: number;
  numero: string;
};

export default function Associacao({
  usuario,
  setPagina,
  handleLogout,
  atualizarContagem,
}: Props) {
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [chaveId, setChaveId] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [folha, setFolha] = useState("");
  const [poste, setPoste] = useState("");
  const [coordenada, setCoordenada] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarChaves();
  }, []);

  async function carregarChaves() {
    const { data } = await supabase
      .from("db_chaves_disponiveis")
      .select("id, numero");

    if (data) setChaves(data);
  }

  async function handleAssociar() {
    if (!chaveId) {
      setMensagem("Selecione uma chave.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("dbchaves_associacoes").insert([
      {
        chave_id: chaveId,
        nota,
        folha,
        poste,
        coordenada,
        usu_associacao: usuario.matricula,
      },
    ]);

    if (!error) {
      setMensagem("Associado com sucesso!");
      setNota("");
      setFolha("");
      setPoste("");
      setCoordenada("");
      setChaveId(null);

      await atualizarContagem();
      carregarChaves();
    } else {
      setMensagem("Erro ao associar.");
      console.log(error);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Associação de Chaves</h2>

      <p>
        {usuario.nome} | {usuario.matricula}
      </p>

      <select
        value={chaveId ?? ""}
        onChange={(e) => setChaveId(Number(e.target.value))}
      >
        <option value="">Selecione uma chave</option>
        {chaves.map((c) => (
          <option key={c.id} value={c.id}>
            {c.numero}
          </option>
        ))}
      </select>

      <br /><br />

      <input placeholder="Nota" value={nota} onChange={(e) => setNota(e.target.value)} />
      <br /><br />

      <input placeholder="Folha" value={folha} onChange={(e) => setFolha(e.target.value)} />
      <br /><br />

      <input placeholder="Poste" value={poste} onChange={(e) => setPoste(e.target.value)} />
      <br /><br />

      <input placeholder="Coordenada" value={coordenada} onChange={(e) => setCoordenada(e.target.value)} />
      <br /><br />

      <button onClick={handleAssociar} disabled={loading}>
        {loading ? "Associando..." : "Associar"}
      </button>

      <br /><br />

      {mensagem && <p>{mensagem}</p>}

      <br />

      <button onClick={() => setPagina("home")}>Voltar</button>
      <button onClick={handleLogout} style={{ marginLeft: 10 }}>
        Sair
      </button>
    </div>
  );
}
