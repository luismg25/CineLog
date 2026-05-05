import { useState, useEffect, useMemo, useContext } from 'react'; // Añadido useContext
import { useMovies } from '../hooks/useMovies';
import MovieCard from '../components/MovieCard';
import { useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext'; // Importado UserContext

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { state } = useContext(UserContext); // Extraemos el estado global (mediaType)
    const { mediaType } = state;

    // 1. ESTADOS DE LA URL Y BÚSQUEDA
    const queryParam = searchParams.get('q') || '';
    const initialSort = searchParams.get('sort') || 'popularity.desc';
    const initialPage = parseInt(searchParams.get('page')) || 1;

    const [query, setQuery] = useState(queryParam);
    const [page, setPage] = useState(initialPage);

    // 2. ESTADO PARA LOS FILTROS
    const [filters, setFilters] = useState({
        genre: '',
        year: '',
        minRating: 0,
        sort: initialSort
    });

    // Sincronizar el buscador si cambia la URL (ej: desde el menú de navegación)
    useEffect(() => {
        if (queryParam) {
            setQuery(queryParam);
            setPage(1);
        }
    }, [queryParam]);

    // Consumo del hook (Pasamos mediaType para que use el endpoint de /movie o /tv)
    const { movies, loading, error, totalPages } = useMovies(query, filters, page, mediaType);

    // 3. LÓGICA DE FILTRADO Y ORDENADO LOCAL (useMemo)
    const finalMovies = useMemo(() => {
        // A. Aplicamos filtros en cascada
        let processed = movies.filter(movie => {
            const matchGenre = filters.genre
                ? movie.genre_ids?.includes(Number(filters.genre))
                : true;

            // Ajuste: Para series usamos 'first_air_date', para pelis 'release_date'
            const date = movie.release_date || movie.first_air_date;
            const matchYear = filters.year
                ? date?.startsWith(filters.year.toString())
                : true;

            const matchRating = filters.minRating > 0
                ? movie.vote_average >= Number(filters.minRating)
                : true;

            return matchGenre && matchYear && matchRating;
        });

        // B. Aplicamos el ordenamiento manual
        processed.sort((a, b) => {
            const dateA = a.release_date || a.first_air_date || '1970-01-01';
            const dateB = b.release_date || b.first_air_date || '1970-01-01';

            switch (filters.sort) {
                case 'popularity.desc':
                    return (b.popularity || 0) - (a.popularity || 0);
                case 'vote_average.desc':
                    return (b.vote_average || 0) - (a.vote_average || 0);
                case 'primary_release_date.desc':
                    return new Date(dateB) - new Date(dateA);
                case 'primary_release_date.asc':
                    return new Date(dateA) - new Date(dateB);
                default:
                    return 0;
            }
        });

        return processed;
    }, [movies, filters]);

    // 4. MANEJADORES DE EVENTOS
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));

        if (name === 'sort') {
            setSearchParams({ q: query, sort: value, page: 1 });
            setPage(1);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            setSearchParams({ q: query, page: nextPage, sort: filters.sort });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            const prevPage = page - 1;
            setPage(prevPage);
            setSearchParams({ q: query, page: prevPage, sort: filters.sort });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="search-page">
            <h2>Explorara el catálogo de <span className="text-accent">{mediaType === 'movie' ? 'películas' : 'series'}</span></h2>

            <section className="controls">
                <input
                    type="text"
                    placeholder={`Buscar ${mediaType === 'movie' ? 'película' : 'serie'} por título...`}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                        setSearchParams({ q: e.target.value, sort: filters.sort, page: 1 });
                    }}
                    className="search-input"
                />

                <div className="filters-group">
                    <select name="sort" onChange={handleFilterChange} value={filters.sort}>
                        <option value="popularity.desc">Más populares</option>
                        <option value="vote_average.desc">Mejor valoradas</option>
                        <option value="primary_release_date.desc">Más recientes</option>
                        <option value="primary_release_date.asc">Más antiguas</option>
                    </select>

                    <select name="genre" onChange={handleFilterChange} value={filters.genre}>
                        <option value="">Todos los géneros</option>
                        <option value="28">Acción</option>
                        <option value="35">Comedia</option>
                        <option value="18">Drama</option>
                        <option value="27">Terror</option>
                        <option value="878">Ciencia Ficción</option>
                    </select>

                    <input
                        type="number"
                        name="year"
                        placeholder="Año (ej: 2024)"
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

            {!loading && movies.length > 0 && finalMovies.length === 0 && (
                <div className="status no-results">
                    No hay resultados que coincidan con estos filtros. Prueba a cambiarlos.
                </div>
            )}

            {!loading && movies.length > 0 && (
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