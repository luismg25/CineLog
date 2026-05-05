import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchMovies, getMovieDetails } from '../services/tmdb';

export default function Compare() {
    const [queries, setQueries] = useState({ p1: '', p2: '' });
    const [results, setResults] = useState({ p1: [], p2: [] });
    const [movie1, setMovie1] = useState(null);
    const [movie2, setMovie2] = useState(null);

    const handleSearch = async (slot, text) => {
        setQueries(prev => ({ ...prev, [slot]: text }));
        if (text.length > 2) {
            const data = await searchMovies(text);
            setResults(prev => ({ ...prev, [slot]: data.slice(0, 5) }));
        } else {
            setResults(prev => ({ ...prev, [slot]: [] }));
        }
    };

    const selectMovie = async (slot, movie) => {
        const details = await getMovieDetails(movie.id);
        if (slot === 'p1') setMovie1(details);
        else setMovie2(details);
        setQueries(prev => ({ ...prev, [slot]: '' }));
        setResults(prev => ({ ...prev, [slot]: [] }));
    };

    const getWinnerClass = (val1, val2) => {
        if (!val1 || !val2) return '';
        return val1 > val2 ? 'winner-text' : '';
    };

    // Formateador para dinero (Millones)
    const formatMoney = (amount) => amount > 0 ? `$${(amount / 1000000).toFixed(0)}M` : 'N/A';

    return (
        <div className="compare-page">
            <div className="section-header"></div>
            <h1>Comparador de <span className="text-accent">películas</span></h1>

            <div className="compare-search-bars">
                {['p1', 'p2'].map((slot) => (
                    <div key={slot} className="search-box-container">
                        <input
                            type="text"
                            placeholder={`Buscar Película ${slot === 'p1' ? '1' : '2'}...`}
                            value={queries[slot]}
                            onChange={(e) => handleSearch(slot, e.target.value)}
                        />
                        {results[slot].length > 0 && (
                            <ul className="search-results-list">
                                {results[slot].map(m => (
                                    <li key={m.id} onClick={() => selectMovie(slot, m)}>
                                        {m.title} ({m.release_date?.split('-')[0] || 'N/A'})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            <div className="battle-arena">
                {/* PELÍCULA 1 */}
                <div className="fighter-side">
                    {movie1 ? (
                        <div className="fighter-info">
                            <img src={`https://image.tmdb.org/t/p/w400${movie1.poster_path}`} alt={movie1.title} className="fighter-poster" />
                            <h3>{movie1.title}</h3>
                        </div>
                    ) : <div className="poster-placeholder">Pelicula 1</div>}
                </div>

                {/* COLUMNA CENTRAL (Datos y VS) */}
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
                                <span className="val left">{movie1?.runtime ? `${movie1.runtime}m` : '-'}</span>
                                <span className="label">Duración</span>
                                <span className="val right">{movie2?.runtime ? `${movie2.runtime}m` : '-'}</span>
                            </div>

                            <div className="stat-row">
                                <span className="val left">{movie1?.release_date?.split('-')[0] || '-'}</span>
                                <span className="label">Año</span>
                                <span className="val right">{movie2?.release_date?.split('-')[0] || '-'}</span>
                            </div>

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

                            <div className="stat-row-actions">
                                <div className="action-left">
                                    {movie1 && <Link to={`/pelicula/${movie1.id}`} className="btn-details-mini">Ver detalles</Link>}
                                </div>
                                <div className="label-spacer"></div>
                                <div className="action-right">
                                    {movie2 && <Link to={`/pelicula/${movie2.id}`} className="btn-details-mini">Ver detalles</Link>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PELÍCULA 2 */}
                <div className="fighter-side">
                    {movie2 ? (
                        <div className="fighter-info">
                            <img src={`https://image.tmdb.org/t/p/w400${movie2.poster_path}`} alt={movie2.title} className="fighter-poster" />
                            <h3>{movie2.title}</h3>
                        </div>
                    ) : <div className="poster-placeholder">Pelicula 2</div>}
                </div>
            </div>
        </div>
    );
}