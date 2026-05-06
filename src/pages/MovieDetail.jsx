import { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovieDetails } from '../services/tmdb';
import { UserContext } from '../context/UserContext';

export default function MovieDetail() {
    const { type, id } = useParams();
    const { state, dispatch } = useContext(UserContext);

    // 1. ESTADOS
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [userRating, setUserRating] = useState(10);
    const [userReview, setUserReview] = useState('');

    // 2. MEMOS (Cálculos que dependen de los datos)
    const existingReview = useMemo(() => {
        return state.reviews?.find(r => Number(r.movieId) === Number(id));
    }, [state.reviews, id]);

    // 3. EFECTOS

    // Carga de datos de la película o serie
    useEffect(() => {
        const loadDetail = async () => {
            setLoading(true);
            try {
                // 1. TRADUCIMOS LA RUTA PARA TMDB
                // Como en la URL usamos español ('pelicula' o 'serie'),
                // lo pasamos al formato que TMDB entiende ('movie' o 'tv')
                let apiType = type;
                if (type === 'pelicula') apiType = 'movie';
                if (type === 'serie') apiType = 'tv';

                // 2. HACEMOS LA PETICIÓN CON EL TIPO CORRECTO
                const data = await getMovieDetails(id, apiType);
                setItem(data);
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setLoading(false);
            }
        };
        loadDetail();
    }, [id, type]);

    // Sincronización de la reseña
    useEffect(() => {
        if (existingReview) {
            setUserRating(existingReview.rating);
            setUserReview(existingReview.review);
        } else {
            setUserRating(0);
            setUserReview('');
        }
    }, [existingReview, id]);

    // 4. VALIDACIONES DE CARGA
    if (loading) return <div className="status">Cargando...</div>;
    if (!item) return <div className="status">No se encontró el contenido.</div>;

    // 5. LÓGICA DE NEGOCIO
    const isFav = state.favoritas.some(m => m.id === item.id);
    const isWatched = state.vistas.some(m => m.id === item.id);
    const isPending = state.pendientes.some(m => m.id === item.id);

    const handleToggleFavorite = () => {
        if (isFav) {
            dispatch({ type: 'REMOVE_FROM_LIST', list: 'favoritas', id: item.id });
        } else {
            // Corregido: tu reducer espera 'movie', no 'item'
            dispatch({ type: 'ADD_TO_LIST', list: 'favoritas', movie: item });
        }
    };

    const handleToggleWatched = () => {
        if (isWatched) {
            dispatch({ type: 'REMOVE_FROM_LIST', list: 'vistas', id: item.id });
        } else {
            dispatch({ type: 'ADD_TO_LIST', list: 'vistas', movie: item });
            setShowModal(true);
        }
    };

    const handleTogglePending = () => {
        if (isPending) {
            dispatch({ type: 'REMOVE_FROM_LIST', list: 'pendientes', id: item.id });
        } else {
            dispatch({ type: 'ADD_TO_LIST', list: 'pendientes', movie: item });
        }
    };

    const handleSaveReview = () => {
        dispatch({
            type: 'ADD_REVIEW',
            movieId: item.id,
            rating: userRating,
            review: userReview
        });
        alert("¡Reseña guardada!");
        setShowModal(false);
    };

    // Datos extraídos adaptados para CINE y TV
    const displayTitle = item.title || item.name;
    const displayDate = item.release_date || item.first_air_date;
    const director = item.credits?.crew?.find(p => p.job === 'Director' || p.job === 'Executive Producer')?.name || "Desconocido";
    const trailer = item.videos?.results?.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');

    // Las series no suelen tener 'runtime', sino 'episode_run_time' (un array)
    const runtime = item.runtime || (item.episode_run_time ? item.episode_run_time[0] : 0);
    const duration = runtime > 0 ? `${Math.floor(runtime / 60)}h ${runtime % 60}min` : "Duración no disponible";

    return (
        <div className="movie-detail-page">
            <header className="detail-banner" style={{
                backgroundImage: `linear-gradient(to top, var(--bg) 10%, transparent), url(https://image.tmdb.org/t/p/original${item.backdrop_path})`
            }}>
                <div className="banner-content">
                    <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        className="detail-poster"
                        alt={displayTitle}
                        onError={(e) => { e.target.src = "/no-poster.png"; }}
                    />

                    <div className="detail-main-info">
                        <h1>{displayTitle}</h1>
                        <p className="director-tag">
                            {item.name ? "Creada/Producida por " : "Dirigida por "}
                            <strong>{director}</strong>
                        </p>

                        <div className="meta-stack">
                            <p>📅 {displayDate || "Próximamente"}</p>
                            <p>⏱️ {duration}</p>
                            {item.number_of_seasons && <p>📺 Temporadas: {item.number_of_seasons}</p>}
                        </div>

                        <div className="banner-overview">
                            <h3>Sinopsis</h3>
                            <p>{item.overview?.trim() ? item.overview : "No hay sinopsis disponible."}</p>
                        </div>

                        <div className="genres-list">
                            <h3>Géneros</h3>
                            {item.genres?.map(g => (
                                <Link
                                    key={g.id}
                                    to={`/buscar?q=${encodeURIComponent(g.name)}`}
                                    className="genre-pill"
                                    style={{ textDecoration: 'none' }}
                                > {g.name}
                                </Link>
                            ))}
                        </div>

                        <div className="action-buttons">
                            <button className={isFav ? "btn-remove" : "btn-add"} onClick={handleToggleFavorite}>
                                {isFav ? "💔 Eliminar" : "🤍 Favoritos"}
                            </button>
                            <button className={isWatched ? "btn-remove" : "btn-add"} onClick={handleToggleWatched}>
                                {isWatched ? "✅ Vista" : "👁️ Marcar vista"}
                            </button>
                            <button className={isPending ? "btn-remove" : "btn-pending"} onClick={handleTogglePending}>
                                {isPending ? "🕒 Quitar de lista" : "🕒 Ver más tarde"}
                            </button>
                        </div>
                    </div>

                    <div className="banner-rating">
                        <span className="rating-number">{(item.vote_average || 0).toFixed(1)}</span>
                        <span className="rating-star">⭐</span>
                    </div>
                </div>
            </header>

            <main className="detail-body-container">
                <section className="detail-section">
                    <div className="section-header"><h2>Reparto</h2></div>
                    <div className="carousel-container">
                        {item.credits?.cast?.slice(0, 15).map(actor => (
                            <div key={actor.id} className="cast-card">
                                <img
                                    src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                        : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'}
                                    alt={actor.name}
                                />
                                <div className="cast-info">
                                    <p><strong>{actor.name}</strong></p>
                                    <p>{actor.character}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="detail-section">
                    <div className="section-header"><h2>Tráiler</h2></div>
                    {trailer ? (
                        <div className="video-responsive">
                            <iframe src={`https://www.youtube.com/embed/${trailer.key}`} title="YouTube video" allowFullScreen></iframe>
                        </div>
                    ) : (
                        <div className="no-trailer-message"><p>⚠️ No hay vídeos disponibles.</p></div>
                    )}
                </section>

                <section className="detail-section review-section">
                    <div className="section-header">
                        <h2>{existingReview ? "Tu Reseña" : "Añadir Reseña"}</h2>
                    </div>
                    <div className="review-container">
                        <div className="review-rating-input">
                            <label>Tu puntuación: <strong>{userRating}/10</strong></label>
                            <input
                                type="range" min="1" max="10" step="0.5"
                                value={userRating}
                                onChange={(e) => setUserRating(parseFloat(e.target.value))}
                            />
                        </div>
                        <textarea
                            placeholder="Escribe aquí tu opinión..."
                            value={userReview}
                            onChange={(e) => setUserReview(e.target.value)}
                            className="review-textarea"
                        />
                        <button className="btn-accent" onClick={handleSaveReview}>
                            {existingReview ? "Actualizar Reseña" : "Publicar Reseña"}
                        </button>
                    </div>
                </section>
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>¡Contenido visto!</h2>
                        <label>Tu nota: {userRating}/10</label>
                        <input type="range" min="1" max="10" step="0.5" value={userRating} onChange={(e) => setUserRating(parseFloat(e.target.value))} />
                        <textarea placeholder="¿Qué te ha parecido?" value={userReview} onChange={(e) => setUserReview(e.target.value)} />
                        <div className="modal-actions">
                            <button className="btn-accent" onClick={() => setShowModal(false)}>Cerrar</button>
                            <button className="btn-accent" onClick={handleSaveReview}>Guardar reseña</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}