import { useState } from "react";
import { supabase } from "../supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Props = {
  usuario: {
    matricula: string;
    nome: string;
    tipo: string;
  };
  setPagina: React.Dispatch<
    React.SetStateAction<"home" | "cadastro" | "associacao" | "consulta">
  >;
};

type Registro = {
  [key: string]: any;
};

export default function Consulta({ usuario, setPagina }: Props) {
  const [tipoBusca, setTipoBusca] = useState("");
  const [valorBusca, setValorBusca] = useState("");
  const [dados, setDados] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);

  const botaoHabilitado = tipoBusca !== "" && valorBusca !== "";

  async function consultar() {
    setLoading(true);

    let query = supabase.from("dbchaves_associacoes").select("*");

    if (tipoBusca === "dt_ass_db") {
      query = query.eq("dt_ass_db", valorBusca);
    } else {
      query = query.ilike(tipoBusca, `%${valorBusca}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setDados(data);
    }

    setLoading(false);
  }

  async function chavesDisponiveis() {
    const { data } = await supabase
      .from("db_chaves_disponiveis")
      .select("*");

    if (data) setDados(data);
  }

  async function chavesEmpenhadas() {
    const { data } = await supabase
      .from("dbchaves_associacoes")
      .select("*");

    if (data) setDados(data);
  }

  function gerarExcel() {
    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consulta");
    XLSX.writeFile(workbook, "consulta.xlsx");
  }

  function gerarPDF() {
    if (dados.length === 0) return;

    const doc = new jsPDF();

    autoTable(doc, {
      head: [Object.keys(dados[0])],
      body: dados.map((obj) => Object.values(obj)),
    });

    doc.save("consulta.pdf");
  }

  function limpar() {
    setDados([]);
    setTipoBusca("");
    setValorBusca("");
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <strong>{usuario.nome}</strong> | {usuario.matricula}
          </div>
          <button
            style={{ ...styles.button, ...styles.logoutButton }}
            onClick={() => setPagina("home")}
          >
            Home
          </button>
        </div>

        {/* TÍTULO */}
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Consulta de Chaves</h1>
          <p style={styles.subtitle}>
            Pesquisa e geração de relatórios
          </p>
        </div>

        {/* PAINEL DE BUSCA */}
        <div style={styles.panel}>
          <select
            value={tipoBusca}
            onChange={(e) => setTipoBusca(e.target.value)}
            style={styles.input}
          >
            <option value="">Selecione</option>
            <option value="nota">Nota</option>
            <option value="chave">Chave</option>
            <option value="coordenada">Coordenada</option>
            <option value="usu_ass">Projetista</option>
            <option value="dt_ass_db">Data</option>
          </select>

          <input
            type={tipoBusca === "dt_ass_db" ? "date" : "text"}
            value={valorBusca}
            onChange={(e) => setValorBusca(e.target.value)}
            style={styles.input}
          />

          <button
            disabled={!botaoHabilitado}
            onClick={consultar}
            style={styles.button}
          >
            Consultar
          </button>

          <button onClick={chavesDisponiveis} style={styles.button}>
            Chaves Disponíveis
          </button>

          <button onClick={chavesEmpenhadas} style={styles.button}>
            Chaves Empenhadas
          </button>

          <button onClick={gerarPDF} disabled={dados.length === 0} style={styles.button}>
            PDF
          </button>

          <button onClick={gerarExcel} disabled={dados.length === 0} style={styles.button}>
            Excel
          </button>

          <button onClick={limpar} style={styles.button}>
            Limpar
          </button>
        </div>

        {/* TABELA */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {dados[0] &&
                  Object.keys(dados[0]).map((coluna) => (
                    <th key={coluna} style={styles.th}>
                      {coluna}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {dados.map((linha, index) => (
                <tr key={index}>
                  {Object.values(linha).map((valor, i) => (
                    <td key={i} style={styles.td}>
                      {String(valor)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <p style={{ color: "white" }}>Consultando...</p>}

      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    width: "100%",
    backgroundImage:
      "url('https://www.neoenergia.com/documents/107588/2280860/Neoenergia_Caminho_da_energia_da_geracao_a_distribuicao+c+%281%29.jpg/377c7a2b-edfd-dd1e-c8a6-91d79dc31a39?version=1.0&t=1726774318701')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  overlay: {
    minHeight: "100vh",
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 40,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    color: "white",
    marginBottom: 40,
  },

  titleArea: {
    textAlign: "center",
    color: "white",
    marginBottom: 40,
  },

  title: {
    fontSize: 36,
    margin: 0,
  },

  subtitle: {
    marginTop: 10,
    opacity: 0.85,
  },

  panel: {
    maxWidth: 900,
    margin: "0 auto 40px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 15,
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
  },

  button: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "white",
    cursor: "pointer",
  },

  logoutButton: {
    backgroundColor: "rgba(192,57,43,0.6)",
  },

  tableContainer: {
    maxWidth: "100%",
    overflowX: "auto",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "center",
  },

  th: {
    border: "1px solid #ccc",
    padding: 8,
    backgroundColor: "#f2f2f2",
  },

  td: {
    border: "1px solid #ccc",
    padding: 6,
  },
};
