import { useState, useEffect, useMemo, useContext } from 'react';
import { useMovies } from '../hooks/useMovies';
import { fetchMovies } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import { useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const MOVIE_GENRES = [
    { id: 28, name: 'Acción' },
    { id: 35, name: 'Comedia' },
    { id: 18, name: 'Drama' },
    { id: 27, name: 'Terror' },
    { id: 878, name: 'Ciencia Ficción' },
];

const TV_GENRES = [
    { id: 10759, name: 'Acción y Aventura' },
    { id: 35, name: 'Comedia' },
    { id: 18, name: 'Drama' },
    { id: 9648, name: 'Misterio' },
    { id: 10765, name: 'Ciencia Ficción y Fantasía' },
];

// Constantes para precargar páginas
const LOCAL_PAGE_SIZE = 20;
const PREFETCH_PAGES = 5;

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { state } = useContext(UserContext);
    const { mediaType } = state;

    // 1. ESTADOS DE LA URL Y BÚSQUEDA
    const queryParam = searchParams.get('q') || '';
    const initialSort = searchParams.get('sort') || 'popularity.desc';
    const initialPage = parseInt(searchParams.get('page')) || 1;

    const [query, setQuery] = useState(queryParam);
    const [page, setPage] = useState(initialPage);

    // 2. ESTADO PARA LOS FILTROS
    const [filters, setFilters] = useState({
        genre: searchParams.get('genre') || '',
        year: searchParams.get('year') || '',
        minRating: parseFloat(searchParams.get('minRating')) || 0,
        sort: initialSort
    });

    // 3. POOL LOCAL (cuando se busca por texto se precargan resultados)
    const [textPool, setTextPool] = useState([]);
    const [loadingText, setLoadingText] = useState(false);

    const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

    useEffect(() => {
        if (!query) return;

        const controller = new AbortController();
        let cancelled = false;

        const prefetch = async () => {
            setLoadingText(true);
            try {
                const pages = await Promise.all(
                    Array.from({ length: PREFETCH_PAGES }, (_, i) =>
                        fetchMovies(
                            `/search/${mediaType}`,
                            `&query=${encodeURIComponent(query)}&page=${i + 1}`
                        )
                    )
                );
                if (cancelled) return;

                const combined = pages.flatMap(d => d.results || []);
                const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
                setTextPool(unique);
            } catch {
                if (!cancelled) setTextPool([]);
            } finally {
                if (!cancelled) setLoadingText(false);
            }
        };

        const debounce = setTimeout(prefetch, 500);
        return () => {
            cancelled = true;
            clearTimeout(debounce);
            controller.abort();
        };
    }, [query, mediaType]);

    const { movies: discoverMovies, loading: loadingDiscover, error, totalPages: apiTotalPages } = useMovies(
        query ? null : '',
        filters,
        page,
        mediaType
    );

    // 4. FILTRADO, ORDENADO Y PAGINACIÓN
    const { finalMovies, totalPages, loading } = useMemo(() => {
        const sortFn = (a, b) => {
            const dateA = a.release_date || a.first_air_date || '1970-01-01';
            const dateB = b.release_date || b.first_air_date || '1970-01-01';
            switch (filters.sort) {
                case 'popularity.desc': return (b.popularity || 0) - (a.popularity || 0);
                case 'vote_average.desc': return (b.vote_average || 0) - (a.vote_average || 0);
                case 'primary_release_date.desc': return new Date(dateB) - new Date(dateA);
                case 'primary_release_date.asc': return new Date(dateA) - new Date(dateB);
                default: return 0;
            }
        };

        const applyFilters = (list) => list.filter(movie => {
            const matchGenre = filters.genre
                ? movie.genre_ids?.includes(Number(filters.genre))
                : true;
            const date = movie.release_date || movie.first_air_date;
            const matchYear = filters.year
                ? date?.startsWith(filters.year.toString())
                : true;
            const matchRating = filters.minRating > 0
                ? movie.vote_average >= Number(filters.minRating)
                : true;
            return matchGenre && matchYear && matchRating;
        });

        if (query) {
            // Filtrado local si se está buscando por texto
            const pool = loadingText ? [] : textPool;
            const processed = applyFilters(pool).sort(sortFn);
            const total = Math.max(1, Math.ceil(processed.length / LOCAL_PAGE_SIZE));
            const start = (page - 1) * LOCAL_PAGE_SIZE;
            const paginated = processed.slice(start, start + LOCAL_PAGE_SIZE);
            return { finalMovies: paginated, totalPages: total, loading: loadingText };
        }

        const processed = applyFilters(discoverMovies).sort(sortFn);
        return { finalMovies: processed, totalPages: apiTotalPages, loading: loadingDiscover };

    }, [textPool, discoverMovies, filters, query, page, loadingText, loadingDiscover, apiTotalPages]);

    // 5. MANEJADORES DE EVENTOS
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        setPage(1);
        setSearchParams({ q: query, ...newFilters, page: 1 });
    };

    const handleClearFilters = () => {
        const resetFilters = { genre: '', year: '', minRating: 0, sort: 'popularity.desc' };
        setQuery('');
        setFilters(resetFilters);
        setPage(1);
        setSearchParams({ q: '', ...resetFilters, page: 1 });
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            setSearchParams({ q: query, ...filters, page: nextPage });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            const prevPage = page - 1;
            setPage(prevPage);
            setSearchParams({ q: query, ...filters, page: prevPage });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="search-page">
            <h2>Explora el catálogo de <span className="text-accent">{mediaType === 'movie' ? 'películas' : 'series'}</span></h2>

            <section className="controls">
                <input
                    type="text"
                    placeholder={`Buscar ${mediaType === 'movie' ? 'película' : 'serie'} por título...`}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                        setSearchParams({ q: e.target.value, ...filters, page: 1 });
                    }}
                    className="search-input"
                />

                <div className="filters-group" style={{ position: 'relative' }}>
                    <select name="sort" onChange={handleFilterChange} value={filters.sort}>
                        <option value="popularity.desc">Más populares</option>
                        <option value="vote_average.desc">Mejor valoradas</option>
                        <option value="primary_release_date.desc">Más recientes</option>
                        <option value="primary_release_date.asc">Más antiguas</option>
                    </select>

                    <select name="genre" onChange={handleFilterChange} value={filters.genre}>
                        <option value="">Todos los géneros</option>
                        {genres.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        name="year"
                        placeholder="Año"
                        value={filters.year}
                        onChange={handleFilterChange}
                        className="year-input"
                    />

                    <label className="rating-filter">
                        Nota mín: <strong>{filters.minRating}</strong>
                        <input
                            type="range"
                            name="minRating"
                            min="0" max="10" step="0.5"
                            value={filters.minRating}
                            onChange={handleFilterChange}
                        />
                    </label>

                    <button className="btn-clear-filters" onClick={handleClearFilters}>
                        🧹 Limpiar
                    </button>
                </div>
            </section>

            <hr />

            {loading && <div className="status">Cargando...</div>}
            {error && <div className="status error">⚠️ Error: {error}</div>}

            <div className="movie-grid">
                {finalMovies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>

            {/* Sin resultados */}
            {!loading && !error && finalMovies.length === 0 && (
                <div className="no-results-container">
                    <div className="no-results-content">
                        <h3>🎬 ¡Corten! No hay resultados.</h3>
                        <p>No encontramos nada que coincida con tus filtros. Prueba a cambiarlos o limpiar la búsqueda.</p>
                        <button className="btn-pagination" onClick={handleClearFilters}>
                            Ver todo el catálogo
                        </button>
                    </div>
                </div>
            )}

            {/* Paginación */}
            {!loading && finalMovies.length > 0 && (
                <div className="pagination">
                    <button onClick={handlePrevPage} disabled={page === 1} className="btn-pagination">
                        Anterior
                    </button>
                    <span className="page-indicator">Página {page} de {totalPages}</span>
                    <button onClick={handleNextPage} disabled={page >= totalPages} className="btn-pagination">
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}