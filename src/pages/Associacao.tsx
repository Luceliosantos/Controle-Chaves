import { useState } from "react";
import { supabase } from "../supabase";

type Props = {
  usuario: {
    matricula: string;
    nome: string;
    tipo: string;
  };
  atualizarContagem: () => Promise<void>;
};

type Registro = {
  numero: number;
  flh: string;
  poste: string;
  coord: string;
  dt_ass_db: string;
};

export default function Associacao({
  usuario,
  atualizarContagem,
}: Props) {
  const [nota, setNota] = useState("");
  const [folha, setFolha] = useState("");
  const [poste, setPoste] = useState("");
  const [coordenada, setCoordenada] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState<Registro[]>([]);

  const notaValida = /^[1-9][0-9]{9}$/.test(nota);
  const folhaValida = /^[0-9]+$/.test(folha);
  const posteValido = /^[0-9]+$/.test(poste);
  const coordenadaValida = /^[0-9]{6}:[0-9]{7}$/.test(coordenada);

  const formValido =
    notaValida && folhaValida && posteValido && coordenadaValida;

  async function buscarLista(n: string) {
    const { data } = await supabase
      .from("db_chaves")
      .select("numero, flh, poste, coord, dt_ass_db")
      .eq("ns", Number(n))
      .order("dt_ass_db", { ascending: false });

    if (data) setLista(data);
  }

  async function handleAssociar() {
    if (!formValido) return;

    setLoading(true);
    setMensagem("");

    const { data: coordExiste } = await supabase
      .from("db_chaves")
      .select("numero")
      .eq("coord", coordenada)
      .not("ns", "is", null)
      .maybeSingle();

    if (coordExiste) {
      setMensagem("Já existe chave nesta coordenada.");
      setLoading(false);
      return;
    }

    const { data: conjuntoExiste } = await supabase
      .from("db_chaves")
      .select("numero")
      .match({
        ns: Number(nota),
        flh: folha,
        poste: poste,
      })
      .maybeSingle();

    if (conjuntoExiste) {
      setMensagem(
        "Já existe chave com esta Nota, Folha e Poste."
      );
      setLoading(false);
      return;
    }

    const { data: chave } = await supabase
      .from("db_chaves")
      .select("numero")
      .is("ns", null)
      .order("numero", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!chave) {
      setMensagem("Não existem chaves disponíveis.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("db_chaves")
     .update({
        ns: Number(nota),
        flh: folha,
        poste: poste,
        coord: coordenada,
        usu_ass: usuario.matricula,
        dt_ass_db: new Date(),
      })
      .eq("numero", chave.numero);

if (error) {
  console.log("ERRO COMPLETO:", error);
  setMensagem(error.message);
  setLoading(false);
  return;
}

    setMensagem("Chave associada com sucesso!");
    await atualizarContagem();
    await buscarLista(nota);
    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.topBar}>
          <div>
            <strong>{usuario.nome}</strong> | {usuario.matricula}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.title}>Associar Chave</h2>

          <input
            style={styles.input}
            placeholder="Nota (10 dígitos)"
            value={nota}
            onChange={(e) => setNota(e.target.value.replace(/\D/g, ""))}
          />

          <input
            style={styles.input}
            placeholder="Folha"
            value={folha}
            onChange={(e) => setFolha(e.target.value.replace(/\D/g, ""))}
          />

          <input
            style={styles.input}
            placeholder="Poste"
            value={poste}
            onChange={(e) => setPoste(e.target.value.replace(/\D/g, ""))}
          />

          <input
            style={styles.input}
            placeholder="Coordenada (111111:2222222)"
            value={coordenada}
            onChange={(e) => setCoordenada(e.target.value)}
          />

          <button
            style={{
              ...styles.button,
              opacity: formValido ? 1 : 0.5,
            }}
            disabled={!formValido || loading}
            onClick={handleAssociar}
          >
            {loading ? "Associando..." : "Associar"}
          </button>

          {mensagem && (
            <div
              style={
                mensagem.includes("sucesso")
                  ? styles.msgSucesso
                  : styles.msgErro
              }
            >
              {mensagem}
            </div>
          )}
        </div>

        {lista.length > 0 && (
          <div style={styles.listaCard}>
            <h3>Chaves da Nota {nota}</h3>
            {lista.map((r, i) => (
              <div key={i} style={styles.listaItem}>
                <strong>{r.numero}</strong> | Folha {r.flh} | Poste{" "}
                {r.poste} | {r.coord} |{" "}
                {new Date(r.dt_ass_db).toLocaleString("pt-BR")}
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
    background: "rgba(0,0,0,0.75)",
    padding: 40,
    color: "white",
  },
  topBar: {
    marginBottom: 40,
    fontSize: 18,
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    padding: 30,
    maxWidth: 500,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 14,
    marginBottom: 15,
    borderRadius: 10,
    border: "none",
    fontSize: 15,
  },
  button: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(45deg,#00d4ff,#0099cc)",
    fontWeight: 600,
    cursor: "pointer",
  },
  msgErro: {
    marginTop: 15,
    padding: 12,
    background: "rgba(231,76,60,0.2)",
    borderRadius: 8,
    color: "#ff6b6b",
  },
  msgSucesso: {
    marginTop: 15,
    padding: 12,
    background: "rgba(46,204,113,0.2)",
    borderRadius: 8,
    color: "#2ecc71",
  },
  listaCard: {
    marginTop: 40,
    background: "rgba(255,255,255,0.08)",
    padding: 20,
    borderRadius: 20,
    backdropFilter: "blur(20px)",
  },
  listaItem: {
    padding: 10,
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  },
};
