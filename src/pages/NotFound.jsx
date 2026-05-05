import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function NotFound() {
    const { state } = useUser();
    const isMovie = state.mediaType === 'movie';

    return (
        <div className="error-page">
            <div className="error-content">
                <h1 className="error-code">404</h1>
                <div className="error-icon">🎬</div>
                <h2 className="error-title">¡Corten! Escena no encontrada</h2>
                <p className="error-message">
                    Lo sentimos, parece que esta página se ha quedado en el suelo de la sala de montaje.
                    Ni siquiera en <span className="text-accent">{isMovie ? 'el cine' : 'las series'}</span> todo sale a la primera.
                </p>
                <div className="error-actions">
                    <Link to="/" className="btn-primary">
                        Volver al Inicio
                    </Link>
                    <Link to="/buscar" className="btn-secondary">
                        Explorar {isMovie ? 'Películas' : 'Series'}
                    </Link>
                </div>
            </div>

            <div className="film-strip-decor"></div>
        </div>
    );
}