import { useState, useEffect } from 'react';
import { fetchMovies } from '../services/tmdb';

// Gestiona la carga de datos desde TMDB
export const useMovies = (query = '', filters = {}, page = 1, type = 'movie') => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(1);

    const { genre, year, minRating, sort } = filters;

    useEffect(() => {
        const getData = async () => {
            setLoading(true);
            try {
                let endpoint = query ? `/search/${type}` : `/discover/${type}`;
                let params = `&page=${page}`;

                if (query) {
                    params += `&query=${encodeURIComponent(query)}`;
                } else {
                    if (genre) params += `&with_genres=${genre}`;

                    if (year) {
                        const yearKey = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
                        params += `&${yearKey}=${year}`;
                    }

                    if (minRating) params += `&vote_average.gte=${minRating}`;

                    const sortBy = sort || 'popularity.desc';
                    params += `&sort_by=${sortBy}`;
                    if (sortBy.includes('vote_average')) params += '&vote_count.gte=200';
                }

                const data = await fetchMovies(endpoint, params);

                setMovies(data.results || []);
                setTotalPages(data.total_pages || 1);
            } catch (err) {
                setError("Error al cargar datos");
            } finally {
                setLoading(false);
            }
        };
        const timeoutId = setTimeout(getData, 500);
        return () => clearTimeout(timeoutId);
    }, [query, genre, year, minRating, sort, page, type]);
    return { movies, loading, error, totalPages };
};