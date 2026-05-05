import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPopular, getNowPlaying, getTopRated, getRecommendedByGenres } from '../services/tmdb';
import { useUser } from '../context/UserContext';
import MovieCard from '../components/MovieCard';

export default function Home() {
    const { state } = useUser();
    const { mediaType, favoritas, vistas } = state;

    // ESTADOS DE SECCIONES GENERALES
    const [sections, setSections] = useState({ popular: [], nowPlaying: [], topRated: [] });
    // ESTADOS DE RECOMENDACIONES (Integrados de Recommended.jsx)
    const [recommended, setRecommended] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(true);

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- LÓGICA DE RECOMENDACIONES (MEMOS Y EFECTOS) ---

    // 1. Calculamos los géneros más frecuentes basándonos en favoritas Y vistas
    const topGenres = useMemo(() => {
        const allUserMovies = [...favoritas, ...vistas];
        if (allUserMovies.length === 0) return null;

        const genreCounts = {};
        allUserMovies.forEach(movie => {
            // Extraemos géneros tanto si vienen como IDs o como objetos
            const ids = movie.genre_ids || movie.genres?.map(g => g.id) || [];

            ids.forEach(id => {
                genreCounts[id] = (genreCounts[id] || 0) + 1;
            });
        });

        // Ordenamos por frecuencia y tomamos los 2 principales
        const sorted = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(entry => entry[0]);

        return sorted.length > 0 ? sorted.join(',') : null;
    }, [favoritas, vistas]);

    // 2. Petición a la API para recomendaciones y filtrado inteligente
    useEffect(() => {
        const fetchRecs = async () => {
            // Si no hay historial, no buscamos recomendaciones
            if (!topGenres) {
                setLoadingRecs(false);
                setRecommended([]);
                return;
            }

            setLoadingRecs(true);
            try {
                // CLAVE: Pasamos mediaType para que recomiende solo el tipo activo (movie o tv)
                const data = await getRecommendedByGenres(topGenres, mediaType);

                // Filtramos las que el usuario ya conoce para que sean "novedades"
                const filtered = data.filter(m =>
                    !favoritas.some(f => f.id === m.id) &&
                    !vistas.some(v => v.id === m.id)
                );

                setRecommended(filtered.slice(0, 10));
            } catch (error) {
                console.error("Error cargando recomendaciones:", error);
            } finally {
                setLoadingRecs(false);
            }
        };

        fetchRecs();
        // Reacciona al cambio de mediaType para cambiar recomendaciones de Cine <-> Series
    }, [topGenres, favoritas, vistas, mediaType]);

    // --- CARGA DE CATEGORÍAS GENERALES ---

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [pop, now, top] = await Promise.all([
                    getPopular(mediaType),
                    getNowPlaying(mediaType),
                    getTopRated(mediaType)
                ]);

                setSections({
                    popular: pop.results.slice(0, 10),
                    nowPlaying: now.results.slice(0, 10),
                    topRated: top.results.slice(0, 10)
                });
            } catch (error) {
                console.error("Error cargando categorías", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [mediaType]);

    // Función para que las categorías enlacen con búsquedas
    const handleSeeAll = (category) => {
        let sortParam = 'popularity.desc';

        if (category === 'top_rated') sortParam = 'vote_average.desc';
        if (category === 'now_playing') sortParam = 'primary_release_date.desc';
        if (category === 'popular') sortParam = 'popularity.desc';

        navigate(`/buscar?sort=${sortParam}`);
    };

    if (loading) return <div className="status">Cargando cartelera 2026...</div>;

    return (
        <main className="home-page">
            {/* Eslogan dinámico según el modo activo */}
            <h1 className="main-title">
                Cine<span className="text-accent">Log</span>: el mejor amigo de los amantes de <span className="text-accent">{mediaType === 'movie' ? 'el cine' : 'las series'}</span>
            </h1>

            {/* Sección de Recomendaciones dinámica */}
            {topGenres && (loadingRecs || recommended.length > 0) && (
                <section className="carousel-section recommendations-area">
                    <div className="section-header">
                        <h2>Recomendado para ti</h2>
                    </div>
                    <div className="carousel-container">
                        {loadingRecs ? (
                            <p className="loading-text">Buscando joyas ocultas...</p>
                        ) : (
                            recommended.map(movie => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Populares */}
            <section className="carousel-section">
                <div className="section-header">
                    <h2>Populares</h2>
                    <button onClick={() => handleSeeAll('popular')}>Ver todas</button>
                </div>
                <div className="carousel-container">
                    {sections.popular.map(m => <MovieCard key={m.id} movie={m} />)}
                </div>
            </section>

            {/* En Cartelera / Al aire */}
            <section className="carousel-section">
                <div className="section-header">
                    <h2>{mediaType === 'movie' ? 'En Cartelera' : 'Nuevos Episodios'}</h2>
                    <button onClick={() => handleSeeAll('now_playing')}>Ver todas</button>
                </div>
                <div className="carousel-container">
                    {sections.nowPlaying.map(m => <MovieCard key={m.id} movie={m} />)}
                </div>
            </section>

            {/* Mejor Valoradas */}
            <section className="carousel-section">
                <div className="section-header">
                    <h2>Mejor Valoradas</h2>
                    <button onClick={() => handleSeeAll('top_rated')}>Ver todas</button>
                </div>
                <div className="carousel-container">
                    {sections.topRated.map(m => <MovieCard key={m.id} movie={m} />)}
                </div>
            </section>
        </main>
    );
};