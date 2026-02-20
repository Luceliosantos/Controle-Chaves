import { useState } from "react";
import { supabase } from "./supabase";
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro";
import Associacao from "./pages/Associacao"; // ✅ ADICIONADO

type Usuario = {
  matricula: string;
  nome: string;
  tipo: string;
};

type Pagina = "home" | "cadastro" | "associacao"; // ✅ ADICIONADO

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState<Pagina>("home");
  const [chavesDisponiveis, setChavesDisponiveis] = useState<number>(0);

  async function atualizarContagem() {
    const { count, error } = await supabase
      .from("db_chaves_disponiveis")
      .select("*", { count: "exact", head: true });

    if (!error) {
      setChavesDisponiveis(count ?? 0);
    }
  }

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setErro("");
    setLoading(true);

    const { data, error } = await supabase.rpc("login_usuario", {
      p_matricula: matricula,
      p_senha: senha,
    });

    if (error) {
      setErro("Erro ao conectar com o servidor.");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setErro("Matrícula ou senha inválidos.");
      setLoading(false);
      return;
    }

    setUsuario(data[0]);
    setPagina("home");
    await atualizarContagem();
    setLoading(false);
  }

  function handleLogout() {
    setUsuario(null);
    setMatricula("");
    setSenha("");
    setPagina("home");
  }

  if (usuario) {
    if (pagina === "cadastro") {
      return (
        <Cadastro
          usuario={usuario}
          chavesDisponiveis={chavesDisponiveis}
          atualizarContagem={atualizarContagem}
          setPagina={setPagina}
          handleLogout={handleLogout}
        />
      );
    }

    if (pagina === "associacao") {
      return (
        <Associacao
          usuario={usuario}
          atualizarContagem={atualizarContagem}
          setPagina={setPagina}
          handleLogout={handleLogout}
        />
      );
    }

    return (
      <Home
        usuario={usuario}
        chavesDisponiveis={chavesDisponiveis}
        setPagina={setPagina}
        handleLogout={handleLogout}
      />
    );
  }

  return (
    <div style={styles.loginContainer}>
      <form style={styles.loginCard} onSubmit={handleLogin}>
        <h2>Controle de Chaves</h2>

        <input
          placeholder="Matrícula"
          style={styles.input}
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          style={styles.input}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && <p style={{ color: "#c0392b" }}>{erro}</p>}

        <button style={styles.loginButton} type="submit">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  loginContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom, #1e3c72, #2a5298)",
  },
  loginCard: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    width: 350,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  loginButton: {
    width: "100%",
    padding: 14,
    backgroundColor: "#1e3c72",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
