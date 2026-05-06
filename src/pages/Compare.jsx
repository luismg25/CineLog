import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { searchMovies, getMovieDetails } from '../services/tmdb';
import { UserContext } from '../context/UserContext';

export default function Compare() {
    const { state } = useContext(UserContext);
    const { mediaType } = state;

    const [queries, setQueries] = useState({ p1: '', p2: '' });
    const [results, setResults] = useState({ p1: [], p2: [] });
    const [movie1, setMovie1] = useState(null);
    const [movie2, setMovie2] = useState(null);

    const isTV = mediaType === 'tv';
    const label = isTV ? 'Serie' : 'Película';

    const handleSearch = async (slot, text) => {
        setQueries(prev => ({ ...prev, [slot]: text }));
        if (text.length > 2) {
            const data = await searchMovies(text, mediaType);
            setResults(prev => ({ ...prev, [slot]: data.slice(0, 5) }));
        } else {
            setResults(prev => ({ ...prev, [slot]: [] }));
        }
    };

    const selectMovie = async (slot, movie) => {
        const details = await getMovieDetails(movie.id, mediaType);
        if (slot === 'p1') setMovie1(details);
        else setMovie2(details);
        setQueries(prev => ({ ...prev, [slot]: '' }));
        setResults(prev => ({ ...prev, [slot]: [] }));
    };

    const getWinnerClass = (val1, val2) => {
        if (!val1 || !val2) return '';
        return val1 > val2 ? 'winner-text' : '';
    };

    const formatMoney = (amount) => amount > 0 ? `$${(amount / 1000000).toFixed(0)}M` : 'N/A';

    const getTitle = (item) => item?.title || item?.name || '';
    const getYear = (item) => {
        const date = item?.release_date || item?.first_air_date;
        return date ? date.split('-')[0] : '-';
    };

    const getDetailPath = (item) => {
        if (!item) return '#';
        const routeType = isTV ? 'serie' : 'pelicula';
        return `/${routeType}/${item.id}`;
    };

    return (
        <div className="compare-page">
            <div className="section-header"></div>
            <h1>Comparador de <span className="text-accent">{isTV ? 'series' : 'películas'}</span></h1>

            <div className="compare-search-bars">
                {['p1', 'p2'].map((slot, i) => (
                    <div key={slot} className="search-box-container">
                        <input
                            type="text"
                            placeholder={`Buscar ${label} ${i + 1}...`}
                            value={queries[slot]}
                            onChange={(e) => handleSearch(slot, e.target.value)}
                        />
                        {results[slot].length > 0 && (
                            <ul className="search-results-list">
                                {results[slot].map(m => (
                                    <li key={m.id} onClick={() => selectMovie(slot, m)}>
                                        {m.title || m.name} ({(m.release_date || m.first_air_date)?.split('-')[0] || 'N/A'})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            <div className="battle-arena">
                {/* PELÍCULA / SERIE 1 */}
                <div className="fighter-side">
                    {movie1 ? (
                        <div className="fighter-info">
                            <img
                                src={`https://image.tmdb.org/t/p/w400${movie1.poster_path}`}
                                alt={getTitle(movie1)}
                                className="fighter-poster"
                                onError={(e) => { e.target.src = "/no-poster.png"; }}
                            />
                            <h3>{getTitle(movie1)}</h3>
                        </div>
                    ) : <div className="poster-placeholder">{label} 1</div>}
                </div>

                {/* COLUMNA CENTRAL */}
                <div className="data-core">
                    <div className="vs-badge">VS</div>

                    {(movie1 || movie2) && (
                        <div className="stats-table">
                            <div className="stat-row">
                                <span className={`val left ${getWinnerClass(movie1?.vote_average, movie2?.vote_average)}`}>{movie1?.vote_average?.toFixed(1) || '-'}</span>
                                <span className="label">Rating</span>
                                <span className={`val right ${getWinnerClass(movie2?.vote_average, movie1?.vote_average)}`}>{movie2?.vote_average?.toFixed(1) || '-'}</span>
                            </div>

                            <div className="stat-row">
                                <span className="val left">{getYear(movie1)}</span>
                                <span className="label">Año</span>
                                <span className="val right">{getYear(movie2)}</span>
                            </div>

                            {/* Duración: minutos para películas, temporadas para series */}
                            {isTV ? (
                                <div className="stat-row">
                                    <span className={`val left ${getWinnerClass(movie1?.number_of_seasons, movie2?.number_of_seasons)}`}>
                                        {movie1?.number_of_seasons ? `${movie1.number_of_seasons}T` : '-'}
                                    </span>
                                    <span className="label">Temporadas</span>
                                    <span className={`val right ${getWinnerClass(movie2?.number_of_seasons, movie1?.number_of_seasons)}`}>
                                        {movie2?.number_of_seasons ? `${movie2.number_of_seasons}T` : '-'}
                                    </span>
                                </div>
                            ) : (
                                <div className="stat-row">
                                    <span className="val left">{movie1?.runtime ? `${movie1.runtime}m` : '-'}</span>
                                    <span className="label">Duración</span>
                                    <span className="val right">{movie2?.runtime ? `${movie2.runtime}m` : '-'}</span>
                                </div>
                            )}

                            {/* Presupuesto y recaudación (solo películas) */}
                            {!isTV && (
                                <>
                                    <div className="stat-row">
                                        <span className={`val left ${getWinnerClass(movie1?.budget, movie2?.budget)}`}>{formatMoney(movie1?.budget)}</span>
                                        <span className="label">Presupuesto</span>
                                        <span className={`val right ${getWinnerClass(movie2?.budget, movie1?.budget)}`}>{formatMoney(movie2?.budget)}</span>
                                    </div>

                                    <div className="stat-row">
                                        <span className={`val left ${getWinnerClass(movie1?.revenue, movie2?.revenue)}`}>{formatMoney(movie1?.revenue)}</span>
                                        <span className="label">Recaudación</span>
                                        <span className={`val right ${getWinnerClass(movie2?.revenue, movie1?.revenue)}`}>{formatMoney(movie2?.revenue)}</span>
                                    </div>
                                </>
                            )}

                            {/* Episodios totales (solo series) */}
                            {isTV && (
                                <div className="stat-row">
                                    <span className={`val left ${getWinnerClass(movie1?.number_of_episodes, movie2?.number_of_episodes)}`}>
                                        {movie1?.number_of_episodes ?? '-'}
                                    </span>
                                    <span className="label">Episodios</span>
                                    <span className={`val right ${getWinnerClass(movie2?.number_of_episodes, movie1?.number_of_episodes)}`}>
                                        {movie2?.number_of_episodes ?? '-'}
                                    </span>
                                </div>
                            )}

                            <div className="stat-row-actions">
                                <div className="action-left">
                                    {movie1 && <Link to={getDetailPath(movie1)} className="btn-details-mini">Ver detalles</Link>}
                                </div>
                                <div className="label-spacer"></div>
                                <div className="action-right">
                                    {movie2 && <Link to={getDetailPath(movie2)} className="btn-details-mini">Ver detalles</Link>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PELÍCULA / SERIE 2 */}
                <div className="fighter-side">
                    {movie2 ? (
                        <div className="fighter-info">
                            <img
                                src={`https://image.tmdb.org/t/p/w400${movie2.poster_path}`}
                                alt={getTitle(movie2)}
                                className="fighter-poster"
                                onError={(e) => { e.target.src = "/no-poster.png"; }}
                            />
                            <h3>{getTitle(movie2)}</h3>
                        </div>
                    ) : <div className="poster-placeholder">{label} 2</div>}
                </div>
            </div>
        </div>
    );
}