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
  const [modoDisponivel, setModoDisponivel] = useState(false);

  const botaoHabilitado = tipoBusca !== "" && valorBusca !== "";

  async function consultar() {
    setModoDisponivel(false);
    setLoading(true);

    let query = supabase.from("db_chaves").select("*");

    if (tipoBusca === "ns") {
      query = query.eq("ns", Number(valorBusca));
    } else if (tipoBusca === "numero") {
      query = query.eq("numero", Number(valorBusca));
    } else if (tipoBusca === "dt_ass_db") {
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

  async function chavesEmpenhadas() {
    setModoDisponivel(false);

    const { data } = await supabase
      .from("db_chaves")
      .select("*")
      .not("ns", "is", null);

    if (data) setDados(data);
  }

  async function chavesDisponiveis() {
    setModoDisponivel(true);

    const { data } = await supabase
      .from("db_chaves")
      .select("numero, dt_cad_db, usu_cad_db")
      .is("ns", null);

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
      head: [Object.keys(dados[0]).map(formatarCabecalho)],
      body: dados.map((obj) => Object.values(obj)),
    });

    doc.save("consulta.pdf");
  }

  function limpar() {
    setModoDisponivel(false);
    setDados([]);
    setTipoBusca("");
    setValorBusca("");
  }

  function formatarCabecalho(coluna: string) {
    if (!modoDisponivel) return coluna;

    switch (coluna) {
      case "numero":
        return "Chave";
      case "dt_cad_db":
        return "Data Cadastro DB";
      case "usu_cad_db":
        return "Usuario Cadastro DB";
      default:
        return coluna;
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
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

        <div style={styles.titleArea}>
          <h1 style={styles.title}>Consulta de Chaves</h1>
          <p style={styles.subtitle}>Pesquisa e geração de relatórios</p>
        </div>

        <div style={styles.panel}>
          <div style={styles.grupoBusca}>
            <select
              value={tipoBusca}
              onChange={(e) => setTipoBusca(e.target.value)}
              style={styles.input}
            >
              <option value="">Selecione</option>
              <option value="ns">Nota</option>
              <option value="numero">Chave</option>
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
              Chaves disponíveis
            </button>

            <button onClick={chavesEmpenhadas} style={styles.button}>
              Chaves empenhadas
            </button>

            <button onClick={limpar} style={styles.button}>
              Limpar
            </button>
          </div>

          <div style={styles.grupoRelatorio}>
            <button
              onClick={gerarPDF}
              disabled={dados.length === 0}
              style={styles.button}
            >
              Gerar pdf
            </button>

            <button
              onClick={gerarExcel}
              disabled={dados.length === 0}
              style={styles.button}
            >
              Gerar xls
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {dados[0] &&
                  Object.keys(dados[0]).map((coluna) => (
                    <th key={coluna} style={styles.th}>
                      {formatarCabecalho(coluna)}
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
    maxWidth: 1100,
    margin: "0 auto 40px auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  grupoBusca: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 15,
  },
  grupoRelatorio: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 15,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 12px",
    height: "42px",
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
