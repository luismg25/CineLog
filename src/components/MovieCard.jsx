import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

export default function MovieCard({ movie, userRating }) {
    const { state } = useContext(UserContext);

    const mediaType = movie.media_type === 'tv' ? 'serie'
        : movie.media_type === 'movie' ? 'pelicula'
        : movie.title ? 'pelicula' : 'serie';
    const displayTitle = movie.title || movie.name;
    const date = movie.release_date || movie.first_air_date;
    const year = date ? date.split('-')[0] : 'N/A';

    const isFavorita = state.favoritas.some(m => m.id === movie.id);
    const isVista = state.vistas.some(m => m.id === movie.id);
    const isPendiente = state.pendientes.some(m => m.id === movie.id);

    let statusClass = "";
    if (isFavorita) statusClass = "border-fav";
    else if (isVista) statusClass = "border-visto";
    else if (isPendiente) statusClass = "border-pendiente";

    return (
        <div className={`card ${statusClass}`}>
            <Link to={`/${mediaType}/${movie.id}`} className="card-link">
                <div className="indicators">
                    {isFavorita && <span title="En favoritos">❤️</span>}
                    {isVista && <span title="Ya la has visto">✅</span>}
                    {isPendiente && <span title="Ver más tarde">👁️</span>}
                </div>

                <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={displayTitle}
                    onError={(e) => { e.target.src = "/no-poster.png"; }}
                />

                <div className="card-info">
                    <div className="card-info-text">
                        <h4>{displayTitle}</h4>
                        <span>{year}</span>
                    </div>

                    {/* Mostrar la nota del usuario si existe en el Perfil */}
                    {userRating !== undefined && (
                        <div className="user-rating-badge">
                            <span className="star">⭐</span>
                            <span className="score">{userRating}</span>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};