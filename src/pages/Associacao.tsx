import { useState } from "react";
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

type RegistroAssociado = {
  id: number;
  numero: string;
  nota: string;
  folha: number;
  poste: number;
  coordenada: string;
  created_at: string;
};

export default function Associacao({
  usuario,
  setPagina,
  handleLogout,
  atualizarContagem,
}: Props) {
  const [nota, setNota] = useState("");
  const [folha, setFolha] = useState("");
  const [poste, setPoste] = useState("");
  const [coordenada, setCoordenada] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState<RegistroAssociado[]>([]);

  const notaValida = /^[1-9][0-9]{9}$/.test(nota);
  const folhaValida = /^[0-9]+$/.test(folha);
  const posteValido = /^[0-9]+$/.test(poste);
  const coordenadaValida = /^[0-9]{6}:[0-9]{7}$/.test(coordenada);

  const formValido =
    notaValida && folhaValida && posteValido && coordenadaValida;

  async function buscarLista(n: string) {
    const { data } = await supabase
      .from("dbchaves_associacoes")
      .select("id, numero, nota, folha, poste, coordenada, created_at")
      .eq("nota", n)
      .order("created_at", { ascending: false });

    if (data) setLista(data);
  }

  async function handleAssociar() {
    if (!formValido) return;

    setLoading(true);
    setMensagem("");

    // 🔒 Verificar coordenada duplicada
    const { data: coordExiste } = await supabase
      .from("dbchaves_associacoes")
      .select("id")
      .eq("coordenada", coordenada)
      .maybeSingle();

    if (coordExiste) {
      setMensagem("Já existe chave cadastrada nesta coordenada.");
      setLoading(false);
      return;
    }

    // 🔒 Verificar conjunto nota+folha+poste
    const { data: conjuntoExiste } = await supabase
      .from("dbchaves_associacoes")
      .select("id")
      .match({ nota, folha: Number(folha), poste: Number(poste) })
      .maybeSingle();

    if (conjuntoExiste) {
      setMensagem(
        "Já existe chave cadastrada com esta Nota, Folha e Poste."
      );
      setLoading(false);
      return;
    }

    // 🔍 Buscar primeira chave disponível
    const { data: chave } = await supabase
      .from("db_chaves_disponiveis")
      .select("id, numero")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!chave) {
      setMensagem("Não existem chaves disponíveis.");
      setLoading(false);
      return;
    }

    // ✅ Inserir associação
    const { error } = await supabase.from("dbchaves_associacoes").insert([
      {
        numero: chave.numero,
        nota,
        folha: Number(folha),
        poste: Number(poste),
        coordenada,
        usu_associacao: usuario.matricula,
      },
    ]);

    if (error) {
      setMensagem("Erro ao associar.");
      setLoading(false);
      return;
    }

    setMensagem("Chave associada com sucesso!");
    setNota("");
    setFolha("");
    setPoste("");
    setCoordenada("");

    await atualizarContagem();
    await buscarLista(nota);

    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.header}>
          <div>
            <strong>{usuario.nome}</strong> | {usuario.matricula}
          </div>
          <div>
            <button style={styles.btn} onClick={() => setPagina("home")}>
              Início
            </button>
            <button style={styles.btnLogout} onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2>Associar Chave</h2>

          <input
            placeholder="Nota (10 dígitos)"
            value={nota}
            onChange={(e) => setNota(e.target.value.replace(/\D/g, ""))}
            style={styles.input}
          />

          <input
            placeholder="Folha"
            value={folha}
            onChange={(e) => setFolha(e.target.value.replace(/\D/g, ""))}
            style={styles.input}
          />

          <input
            placeholder="Poste"
            value={poste}
            onChange={(e) => setPoste(e.target.value.replace(/\D/g, ""))}
            style={styles.input}
          />

          <input
            placeholder="Coordenada (111111:2222222)"
            value={coordenada}
            onChange={(e) => setCoordenada(e.target.value)}
            style={styles.input}
          />

          <button
            style={{
              ...styles.btnAssociar,
              opacity: formValido ? 1 : 0.5,
              cursor: formValido ? "pointer" : "not-allowed",
            }}
            onClick={handleAssociar}
            disabled={!formValido || loading}
          >
            {loading ? "Associando..." : "Associar"}
          </button>

          {mensagem && <p style={{ marginTop: 15 }}>{mensagem}</p>}
        </div>

        {lista.length > 0 && (
          <div style={styles.lista}>
            <h3>Chaves da Nota {nota}</h3>
            {lista.map((r) => (
              <div key={r.id} style={styles.itemLista}>
                <strong>{r.numero}</strong> | Folha {r.folha} | Poste{" "}
                {r.poste} | {r.coordenada} |{" "}
                {new Date(r.created_at).toLocaleString("pt-BR")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundImage:
      "url('https://www.neoenergia.com/documents/107588/2280860/Neoenergia_Caminho_da_energia_da_geracao_a_distribuicao+c+%281%29.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  overlay: {
    minHeight: "100vh",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 40,
    color: "white",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    padding: 30,
    borderRadius: 16,
    backdropFilter: "blur(10px)",
    maxWidth: 500,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    border: "none",
  },
  btnAssociar: {
    width: "100%",
    padding: 14,
    borderRadius: 8,
    border: "none",
    backgroundColor: "#00d4ff",
    color: "black",
    fontWeight: 600,
  },
  btn: {
    padding: 10,
    marginRight: 10,
  },
  btnLogout: {
    padding: 10,
    backgroundColor: "#c0392b",
    color: "white",
  },
  lista: {
    marginTop: 40,
    background: "rgba(255,255,255,0.08)",
    padding: 20,
    borderRadius: 16,
  },
  itemLista: {
    padding: 10,
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  },
};
