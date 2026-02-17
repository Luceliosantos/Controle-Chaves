import React from "react";

type Props = {
  usuario: {
    matricula: string;
    nome: string;
    tipo: string;
  };
  chavesDisponiveis: number;
  setPagina: (pagina: "home" | "cadastro") => void;
  handleLogout: () => void;
};

export default function Home({
  usuario,
  chavesDisponiveis,
  setPagina,
  handleLogout,
}: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        {/* HEADER SUPERIOR */}
        <div style={styles.header}>
          <div>
            <strong>Chaves disponíveis:</strong> {chavesDisponiveis}
          </div>

          <div>
            <strong>{usuario.nome}</strong> | {usuario.matricula} |{" "}
            {usuario.tipo.toUpperCase()}
          </div>
        </div>

        {/* TÍTULO */}
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Controle de Chaves CEMIG</h1>
          <p style={styles.subtitle}>
            Sistema Corporativo de Gestão de Chaves
          </p>
        </div>

        {/* BOTÕES */}
        <div style={styles.panel}>
          <button
            style={styles.button}
            onClick={() => setPagina("cadastro")}
          >
            Cadastrar
          </button>

          <button style={styles.button}>Associar</button>
          <button style={styles.button}>Relatório</button>
          <button style={styles.button}>Usuários</button>
          <button style={styles.button}>Créditos</button>

          <button
            style={{ ...styles.button, ...styles.logoutButton }}
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================
// ESTILOS
// ================================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundImage:
      "url('https://www.neoenergia.com/documents/107588/2280860/Neoenergia_Caminho_da_energia_da_geracao_a_distribuicao+c+%281%29.jpg/377c7a2b-edfd-dd1e-c8a6-91d79dc31a39?version=1.0&t=1726774318701')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    fontFamily: "Segoe UI, Arial, sans-serif",
  },

  overlay: {
    minHeight: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)", // 40% visibilidade da imagem
    padding: 40,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    color: "white",
    fontWeight: 500,
    marginBottom: 60,
  },

  titleArea: {
    textAlign: "center",
    color: "white",
    marginBottom: 50,
  },

  title: {
    fontSize: 44,
    fontWeight: 600,
    margin: 0,
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 18,
    opacity: 0.85,
  },

  panel: {
    maxWidth: 600,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  button: {
    padding: 18,
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "white",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    transition: "all 0.3s ease",
  },

  logoutButton: {
    border: "1px solid rgba(255,0,0,0.5)",
    backgroundColor: "rgba(192,57,43,0.45)",
  },
};
