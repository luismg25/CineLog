const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;

// Centraliza las llamadas a la API
export const fetchMovies = async (endpoint, params = "") => {
    try {
        const response = await fetch(
            `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=es-ES${params}`
        );
        if (!response.ok) throw new Error("Error en la petición");
        return await response.json();
    } catch (error) {
        console.error("TMDB API Error:", error);
        throw error;
    }
};

export const getNowPlaying = (type = 'movie') => {
    const endpoint = type === 'movie' ? 'now_playing' : 'on_the_air';
    return fetchMovies(`/${type}/${endpoint}`);
};

export const getTopRated = (type = 'movie') =>
    fetchMovies(`/${type}/top_rated`);

export const getPopular = (type = 'movie') =>
    fetchMovies(`/${type}/popular`);

export const searchMovies = async (query, type = 'movie') => {
    const data = await fetchMovies(`/search/${type}`, `&query=${encodeURIComponent(query)}`);
    return data.results || [];
};

export const getMovieDetails = (id, type = 'movie') =>
    fetchMovies(`/${type}/${id}`, '&append_to_response=credits,videos');

export const getRecommendedByGenres = async (genreIds, type = 'movie') => {
    // Aseguramos que el endpoint use el type dinámico (movie o tv)
    const data = await fetchMovies(`/discover/${type}`, `&with_genres=${genreIds}&sort_by=popularity.desc&vote_count.gte=100`);
    return data.results || [];
};

export const getPopularTV = () => fetchMovies('/tv/popular');
export const getTopRatedTV = () => fetchMovies('/tv/top_rated');
export const getOnTheAirTV = () => fetchMovies('/tv/on_the_air');
export const getTVDetails = (id) => fetchMovies(`/tv/${id}`, '&append_to_response=credits,videos');