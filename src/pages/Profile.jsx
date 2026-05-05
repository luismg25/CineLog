import { useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import MovieCard from '../components/MovieCard';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { state } = useContext(UserContext);

    const {
        favoritas = [],
        vistas = [],
        pendientes = [],
        reviews = []
    } = state || {};

    const handleExport = () => {
        window.print();
    };

    // --- CÁLCULO DE ESTADÍSTICAS ---
    const stats = useMemo(() => {
        // 1. Nota Media
        const totalRating = (reviews || []).reduce((acc, r) => acc + (r.rating || 0), 0);
        const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

        // 2. Top Géneros (Contamos ocurrencias en películas vistas)
        const genreCounts = {};
        (vistas || []).forEach(movie => {
            movie.genres?.forEach(g => {
                genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
            });
        });

        const topGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(g => g[0]);

        return { avgRating, topGenres };
    }, [vistas, reviews]);

    // Función auxiliar para renderizar carruseles vacíos o con datos
    const renderCarousel = (title, list, emptyMsg) => (
        <section className="detail-section">
            <div className="section-header">
                <h2>{title} ({list.length})</h2>
            </div>
            {list.length > 0 ? (
                <div className="carousel-container">
                    {list.map(movie => {
                        // BUSCAMOS LA RESEÑA PARA ESTA PELÍCULA
                        const userReview = reviews.find(r => Number(r.movieId) === Number(movie.id));

                        return (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                userRating={userReview?.rating} // PASAMOS LA NOTA AQUÍ
                            />
                        );
                    })}
                </div>
            ) : (
                <p className="empty-message">{emptyMsg}</p>
            )}
        </section>
    );

    return (
        <div className="profile-container">
            <header className="profile-hero">
                <div className="profile-info-main">
                    <div className="avatar-large">
                        {state.userName?.charAt(0) || "U"}
                    </div>
                    <div className="profile-text">
                        <h1>Mi Actividad</h1>
                        <button className="btn-export" onClick={handleExport}>
                            📥 Exportar favoritos
                        </button>
                    </div>
                </div>

                <div className="stats-container-modern">
                    <div className="stat-item">
                        <span className="stat-num">{vistas.length}</span>
                        <span className="stat-desc">Vistas</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-num">⭐ {stats.avgRating}</span>
                        <span className="stat-desc">Media</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <div className="genre-cloud-buttons">
                            {stats.topGenres.length > 0
                                ? stats.topGenres.map(g => (
                                    <Link
                                        key={g}
                                        to={`/buscar?q=${encodeURIComponent(g)}`}
                                        className="genre-mini-button"
                                    >
                                        {g}
                                    </Link>
                                ))
                                : <span className="no-data">-</span>}
                        </div>
                        <span className="stat-desc">Top Géneros</span>
                    </div>
                </div>
            </header>

            <div className="exportable-poster-area">
                <div className="export-grid">
                    {favoritas.map(movie => {
                        const review = reviews.find(r => Number(r.movieId) === Number(movie.id));
                        // Determinar el título correcto para cine o serie
                        const displayTitle = movie.title || movie.name;

                        return (
                            <div key={movie.id} className="export-item">
                                <img
                                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                    alt={displayTitle}
                                />
                                <div className="export-meta">
                                    <p className="export-title">{displayTitle}</p>
                                    {review && <span className="export-rating">⭐ {review.rating}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <main className="profile-content-body">
                {renderCarousel("Favoritas", favoritas, "Aún no tienes favoritas", "❤️")}
                {renderCarousel("Vistas", vistas, "No has visto ninguna película", "✅")}
                {renderCarousel("Pendientes", pendientes, "Lista de espera vacía", "🕒")}
            </main>
        </div>
    );
}