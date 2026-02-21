import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type Registro = {
  id: number
  nota: string
  chave: string
  coordenada: string
  usu_ass: string
  dt_ass_db: string
  [key: string]: any
}

export default function Consulta() {

  const navigate = useNavigate()

  const [tipoBusca, setTipoBusca] = useState("")
  const [valorBusca, setValorBusca] = useState("")
  const [dados, setDados] = useState<Registro[]>([])
  const [loading, setLoading] = useState(false)

  const botaoHabilitado = tipoBusca !== "" && valorBusca !== ""

  async function consultar() {
    setLoading(true)

    let query = supabase.from("dbchaves_associacoes").select("*")

    if (tipoBusca === "data") {
      query = query.eq("dt_ass_db", valorBusca)
    } else {
      query = query.ilike(tipoBusca, `%${valorBusca}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setDados(data)
    }

    setLoading(false)
  }

  async function chavesDisponiveis() {
    const { data } = await supabase
      .from("db_chaves_disponiveis")
      .select("*")

    if (data) setDados(data)
  }

  async function chavesEmpenhadas() {
    const { data } = await supabase
      .from("dbchaves_associacoes")
      .select("*")

    if (data) setDados(data)
  }

  function gerarExcel() {
    const worksheet = XLSX.utils.json_to_sheet(dados)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consulta")
    XLSX.writeFile(workbook, "consulta.xlsx")
  }

  function gerarPDF() {
    const doc = new jsPDF()

    autoTable(doc, {
      head: [Object.keys(dados[0] || {})],
      body: dados.map(obj => Object.values(obj))
    })

    doc.save("consulta.pdf")
  }

  function limpar() {
    setDados([])
    setTipoBusca("")
    setValorBusca("")
  }

  return (
    <div style={{ padding: 30 }}>

      <h2>Consulta de Chaves</h2>

      {/* Área de Pesquisa */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>

        <select
          value={tipoBusca}
          onChange={e => setTipoBusca(e.target.value)}
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
          onChange={e => setValorBusca(e.target.value)}
        />

        <button
          disabled={!botaoHabilitado}
          onClick={consultar}
        >
          Consultar
        </button>

        <button onClick={() => navigate("/")}>
          Home
        </button>

        <button onClick={chavesDisponiveis}>
          Chaves Disponíveis
        </button>

        <button onClick={chavesEmpenhadas}>
          Chaves Empenhadas
        </button>

        <button onClick={gerarPDF} disabled={dados.length === 0}>
          PDF
        </button>

        <button onClick={gerarExcel} disabled={dados.length === 0}>
          EXCEL
        </button>

        <button onClick={limpar}>
          Limpar
        </button>

      </div>

      {/* Tabela */}
      <div style={{ overflowX: "auto" }}>

        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            textAlign: "center"
          }}
        >
          <thead>
            <tr>
              {dados[0] &&
                Object.keys(dados[0]).map(coluna => (
                  <th
                    key={coluna}
                    style={{
                      border: "1px solid black",
                      padding: "5px",
                      backgroundColor: "#e6e6e6"
                    }}
                  >
                    {coluna}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {dados.map((linha, index) => (
              <tr key={index}>
                {Object.values(linha).map((valor, i) => (
                  <td
                    key={i}
                    style={{
                      border: "1px solid black",
                      padding: "4px"
                    }}
                  >
                    {String(valor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {loading && <p>Consultando...</p>}

    </div>
  )
}
