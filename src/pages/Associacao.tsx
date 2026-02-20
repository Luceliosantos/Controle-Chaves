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
  ns: number;
  flh: string;
  poste: string;
  coordenada: string;
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
      .select("numero, ns, flh, poste, coordenada, dt_ass_db")
      .eq("ns", Number(n))
      .order("dt_ass_db", { ascending: false });

    if (data) setLista(data);
  }

  async function handleAssociar() {
    if (!formValido) return;

    setLoading(true);
    setMensagem("");

    // 🔒 Verificar coordenada duplicada
    const { data: coordExiste } = await supabase
      .from("db_chaves")
      .select("numero")
      .eq("coordenada", coordenada)
      .not("ns", "is", null)
      .maybeSingle();

    if (coordExiste) {
      setMensagem("Já existe chave nesta coordenada.");
      setLoading(false);
      return;
    }

    // 🔒 Verificar conjunto nota+folha+poste
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

    // 🔍 Buscar primeira chave disponível
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

    // ✅ Atualizar chave
    const { error } = await supabase
      .from("db_chaves")
      .update({
        ns: Number(nota),
        flh: folha,
        poste: poste,
        coordenada: coordenada,
        usu_ass: usuario.matricula,
        dt_ass_db: new Date().toISOString(),
      })
      .eq("numero", chave.numero);

    if (error) {
      setMensagem("Erro ao associar.");
      console.log(error);
      setLoading(false);
      return;
    }

    setMensagem("Chave associada com sucesso!");
    await atualizarContagem();
    await buscarLista(nota);

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Associar Chave</h2>

      <input
        placeholder="Nota (10 dígitos)"
        value={nota}
        onChange={(e) => setNota(e.target.value.replace(/\D/g, ""))}
      />

      <input
        placeholder="Folha"
        value={folha}
        onChange={(e) => setFolha(e.target.value.replace(/\D/g, ""))}
      />

      <input
        placeholder="Poste"
        value={poste}
        onChange={(e) => setPoste(e.target.value.replace(/\D/g, ""))}
      />

      <input
        placeholder="Coordenada (111111:2222222)"
        value={coordenada}
        onChange={(e) => setCoordenada(e.target.value)}
      />

      <button
        disabled={!formValido || loading}
        onClick={handleAssociar}
      >
        {loading ? "Associando..." : "Associar"}
      </button>

      {mensagem && <p>{mensagem}</p>}

      {lista.length > 0 && (
        <div>
          <h3>Chaves da Nota {nota}</h3>
          {lista.map((r, i) => (
            <div key={i}>
              {r.numero} | Folha {r.flh} | Poste {r.poste} |{" "}
              {r.coordenada} |{" "}
              {new Date(r.dt_ass_db).toLocaleString("pt-BR")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
