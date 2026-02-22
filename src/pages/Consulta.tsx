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

export default function Consulta({ setPagina }: Props) {
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
