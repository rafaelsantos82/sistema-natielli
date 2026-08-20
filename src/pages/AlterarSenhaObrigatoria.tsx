import { Navigate } from 'react-router-dom';

/** Compatibilidade: redireciona para a página unificada de troca de senha. */
const AlterarSenhaObrigatoria = () => <Navigate to="/conta/senha" replace />;

export default AlterarSenhaObrigatoria;
