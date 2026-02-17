import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../supabase";

type Registro = {
  numero: string;
  data: string;
  erro?: string;
};

type Props = {
  usuario: {
    matricula: string;
    nome: string;
    tipo: string;
  };
  setPagina: (pagina: "home" | "cadastro") => void;
  handleLogout: () => void;
  atualizarContagem: () => void;
};

export default function Cadastro({
  usuario,
  setPagina,
  handleLogout,
  atualizarContagem,
}: Props) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [erroImportacao, setErroImportacao] = useState("");
  const [loading, setLoading] = useState(false);

  // ================================
  // IMPORTAR EXCEL (mantido igual)
  // ================================
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      });

      const novos: Registro[] = [];

      for (let i = 1; i < json.length; i++) {
        const numero = String(json[i][0] ?? "").trim();
        const dataExcel = json[i][1];

        let erro = "";

        if (!/^\d{6}$/.test(numero)) {
          erro = "Número deve ter 6 dígitos numéricos";
        }

        let dataFormatada = "";

        if (!dataExcel) {
          erro = "Data inválida ou vazia";
        } else {
          if (typeof dataExcel === "number") {
            dataFormatada = XLSX.SSF.format("dd/mm/yyyy", dataExcel);
          } else {
            dataFormatada = new Date(dataExcel).toLocaleDateString("pt-BR");
          }
        }

        novos.push({
          numero,
          data: dataFormatada,
          erro: erro || undefined,
        });
      }

      setRegistros(novos);
      setErroImportacao("");
    };

    reader.readAsBinaryString(file);
  }

  // ================================
  // CADASTRAR NO BANCO (mantido igual)
  // ================================
  async function handleCadastrar() {
    setErroImportacao("");

    const registrosAtualizados = [...registros];

    let possuiErro = false;

    for (let i = 0; i < registrosAtualizados.length; i++) {
      const r = registrosAtualizados[i];

      const { data } = await supabase
        .from("db_chaves")
        .select("id")
        .eq("numero", r.numero)
        .maybeSingle();

      if (data) {
        registrosAtualizados[i].erro = "Chave já existente no banco";
        possuiErro = true;
      }
    }

    setRegistros(registrosAtualizados);

    if (possuiErro) {
      setErroImportacao(
        "Existem registros inválidos ou duplicados. Corrija antes de cadastrar."
      );
      return;
    }

    setLoading(true);

    for (const r of registrosAtualizados) {
      await supabase.from("db_chaves").insert([
        {
          numero: r.numero,
          dt_disp: r.data.split("/").reverse().join("-"),
          usu_cad_db: usuario.matricula,
        },
      ]);
    }

    alert("Chaves cadastradas com sucesso!");

    setRegistros([]);
    atualizarContagem();
    setLoading(false);
  }

  // ================================
  // RENDER AJUSTADO
  // ================================
  return (
    <div style={styles.container}>
      <div style={styles.electricParticles}></div>
      
      <div style={styles.overlay}>
        <div style={styles.topBar}>
          {/* === TOPO: MATRICULA - NOME === */}
          <div style={styles.headerUsuario}>
            <div style={styles.linhaUsuario}>
              {usuario.matricula} - {usuario.nome}
            </div>
          </div>
          
          <div style={styles.acoesUsuario}>
            <button style={styles.btnPrimario} onClick={() => setPagina("home")}>
              <span>🏠 Início</span>
            </button>
            <button style={styles.btnSecundario} onClick={handleLogout}>
              <span>🚪 Sair</span>
            </button>
          </div>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.cardPrincipal}>
            <div style={styles.uploadArea}>
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFile}
                style={styles.inputFile}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={styles.labelUpload}>
                <div style={styles.uploadIcon}>📁</div>
                <div>
                  <strong>Selecionar Arquivo Excel</strong>
                  <p>Arraste ou clique para importar (.xls, .xlsx)</p>
                </div>
              </label>
            </div>

            {erroImportacao && (
              <div style={styles.alertaErro}>
                <span>⚠️ {erroImportacao}</span>
              </div>
            )}

            {registros.length > 0 && (
              <>
                {/* === QUANTIDADE + BOTÃO DENTRO DA MESMA CAIXA === */}
                <div style={styles.caixaQuantidade}>
                  <div style={styles.statsContent}>
                    <div style={styles.statItem}>
                      <strong style={styles.statNumber}>{registros.length}</strong>
                      <span>registros importados</span>
                    </div>
                    <div style={styles.validosInvalidos}>
                      <span style={styles.validos}>
                        {registros.filter(r => !r.erro).length} válidos
                      </span>
                      <span style={styles.invalidos}>
                        {registros.filter(r => r.erro).length} com erro
                      </span>
                    </div>
                  </div>

                  {/* BOTÃO DENTRO DA CAIXA */}
                  <div style={styles.botaoContainer}>
                    <button
                      style={styles.btnCadastrar}
                      onClick={handleCadastrar}
                      disabled={loading || registros.filter(r => !r.erro).length === 0}
                    >
                      {loading ? (
                        <>
                          <span style={styles.spinner}></span>
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          ⚡ Cadastrar {registros.filter(r => !r.erro).length} Chaves
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* === TABELA COM ESPECIFICAÇÕES === */}
                <div style={styles.tabelaContainer}>
                  <table style={styles.tabela}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.thNumero}>Número</th>
                        <th style={styles.thData}>Data</th>
                        <th style={styles.thStatus}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((r, index) => (
                        <tr key={index} style={r.erro ? styles.linhaErro : styles.linhaOk}>
                          <td style={styles.tdNumero}>{r.numero}</td>
                          <td style={styles.tdData}>{r.data}</td>
                          <td style={styles.tdStatus}>
                            {r.erro ? (
                              <span style={styles.statusErro}>❌ {r.erro}</span>
                            ) : (
                              <span style={styles.statusOk}>✅ OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================
// ESTILOS AJUSTADOS
// ================================
const styles: { [key: string]: React.CSSProperties } = {
  // ... todos os estilos anteriores mantidos ...
  container: {
    minHeight: "100vh",
    background: `
      linear-gradient(135deg, 
        #0a1f44 0%, 
        #1a3a72 25%, 
        #2a4a92 50%, 
        #1e3c72 75%, 
        #0f2b5a 100%
      ),
      radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 0, 0.1) 0%, transparent 50%)
    `,
    backgroundSize: "cover, 200px, 200px",
    backgroundPosition: "center, 20px 80px, 80% 20%",
    backgroundAttachment: "fixed",
    position: "relative",
    overflow: "hidden",
  },

  electricParticles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(2px 2px at 20px 30px, #fff, transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 40px, #fff, transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255,200,0,0.6), transparent)
    `,
    backgroundRepeat: "repeat",
    backgroundSize: "200px 100px",
    animation: "sparkle 20s linear infinite",
    pointerEvents: "none",
    zIndex: 1,
  },

  overlay: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, rgba(10,31,68,0.95) 0%, rgba(26,58,114,0.98) 100%)",
    padding: "40px 20px",
    color: "white",
    position: "relative",
    zIndex: 2,
  },

  // === HEADER AJUSTADO ===
  topBar: {
    maxWidth: "1200px",
    margin: "0 auto 60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "0 20px",
  },

headerUsuario: {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
},

linhaUsuario: {
  fontSize: 22,
  fontWeight: 700,
  color: "#ffffff",
  textShadow: "0 0 10px rgba(0,212,255,0.6)",
},

  matriculaTop: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#00d4ff",
    marginBottom: "8px",
    textShadow: "0 0 20px rgba(0,212,255,0.5)",
  },

  nomeTop: {
    fontSize: "22px",
    fontWeight: "700",
    color: "white",
  },

  tipoContainer: {
    alignSelf: "center",
    marginTop: "10px",
  },

  tipoUsuario: {
    background: "rgba(0,212,255,0.2)",
    color: "#00d4ff",
    padding: "8px 20px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "700",
    border: "1px solid rgba(0,212,255,0.4)",
  },

  // === CAIXA QUANTIDADE + BOTÃO ===
  caixaQuantidade: {
  background: "rgba(0,212,255,0.15)",
  border: "2px solid rgba(0,212,255,0.4)",
  borderRadius: "20px",
  padding: "30px",
  marginTop: "20px",      // 👈 espaço entre os retângulos
  marginBottom: "20px",
},

  statsContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap" as const,
    gap: "20px",
  },

  botaoContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },

  // === TABELA COM BORDAS E ESPECIFICAÇÕES ===
  tabelaContainer: {
    overflowX: "auto",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    border: "2px solid #e5e7eb",
  },

  thead: {
    background: "linear-gradient(135deg, #1e3c72, #2a4a92)",
  },

  thNumero: {
    width: "15%",
    padding: "20px 12px",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    borderRight: "2px solid #4b6cb7",
  },

  thData: {
    width: "15%",
    padding: "20px 12px",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    borderRight: "2px solid #4b6cb7",
  },

  thStatus: {
    width: "70%",
    padding: "20px 16px",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },

  tdNumero: {
    padding: "16px 12px",
    borderRight: "1px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center" as const,
    background: "white",
  },

  tdData: {
    padding: "16px 12px",
    borderRight: "1px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center" as const,
    background: "white",
  },

  tdStatus: {
    padding: "16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center" as const,
    background: "white",
  },

  linhaErro: {
    background: "#fee2e2",
  },

  linhaOk: {
    background: "rgba(34,197,94,0.05)",
  },

  statusErro: {
    color: "#dc2626 !important",
    fontWeight: "700",
  },

  statusOk: {
    color: "#059669 !important",
    fontWeight: "700",
  },

  // Manter outros estilos necessários...
  btnPrimario: {
    padding: "12px 24px",
    background: "linear-gradient(45deg, rgba(0,212,255,0.2), rgba(0,212,255,0.1))",
    border: "2px solid rgba(0,212,255,0.5)",
    borderRadius: "12px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
  },

  btnSecundario: {
    padding: "12px 24px",
    background: "linear-gradient(45deg, rgba(255,170,0,0.2), rgba(255,170,0,0.1))",
    border: "2px solid rgba(255,170,0,0.5)",
    borderRadius: "12px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
  },

  btnCadastrar: {
    padding: "16px 32px",
    background: "linear-gradient(45deg, #00d4ff, #0099cc)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 10px 30px rgba(0,212,255,0.4)",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  // Demais estilos mantidos (cardPrincipal, uploadArea, etc.)
  mainContent: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  cardPrincipal: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
  },

  inputFile: {
    display: "none",
  },

  labelUpload: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "40px",
    border: "3px dashed rgba(0,212,255,0.5)",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "rgba(0,212,255,0.05)",
    textAlign: "center" as const,
  },

  uploadIcon: {
    fontSize: "48px",
    marginBottom: "20px",
    filter: "drop-shadow(0 0 20px rgba(0,212,255,0.3))",
  },

  alertaErro: {
    background: "rgba(231,76,60,0.15)",
    border: "1px solid rgba(231,76,60,0.4)",
    borderRadius: "12px",
    padding: "16px 24px",
    marginBottom: "24px",
    color: "#ff6b6b",
  },

  statNumber: {
    fontSize: "36px",
    fontWeight: "800",
    background: "linear-gradient(45deg, #00d4ff, #ffaa00)",
    WebkitBackgroundClip: "text" as any,
    WebkitTextFillColor: "transparent",
  },

  validos: {
    color: "#00ff88",
    fontWeight: "600",
  },

  invalidos: {
    color: "#ff6b6b",
    fontWeight: "600",
  },
};
