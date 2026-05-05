import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Navbar() {
    const { state, dispatch } = useUser();
    const { mediaType } = state;

    const handleToggle = () => {
        dispatch({ type: 'TOGGLE_MEDIA' });
    };

    return (
        <header className="navbar-wrapper">
            <nav className="navbar-content">
                <Link to="/" className="brand">
                    Cine<span className="text-accent">Log</span>
                </Link>

                <div className="nav-links">
                    <Link to="/">🏠 Inicio</Link>
                    <Link to="/buscar">🔍 Busca</Link>
                    <Link to="/comparar">⚖️ Compara</Link>
                    <Link to="/perfil">👤 Perfil</Link>
                    <button className="btn-media-toggle" onClick={handleToggle}>
                        {mediaType === 'movie' ? (
                            <><span>📺</span> Ver Series</>
                        ) : (
                            <><span>🎬</span> Ver Cine</>
                        )}
                    </button>
                </div>
            </nav>
        </header>
    );
}