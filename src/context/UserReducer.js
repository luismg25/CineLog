export const initialState = {
    favoritas: [],
    vistas: [],
    pendientes: [],
    reviews: []
};

export const userReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_LIST':
            // Evitamos duplicados comprobando si ya existe el ID
            if (state[action.list].find(m => m.id === action.movie.id)) {
                return state;
            }
            return {
                ...state,
                [action.list]: [...state[action.list], action.movie]
            };

        case 'REMOVE_FROM_LIST':
            return {
                ...state,
                [action.list]: state[action.list].filter(m => m.id !== action.id)
            };

        case 'ADD_REVIEW': {
            const otherReviews = state.reviews.filter(r => r.movieId !== action.movieId);
            return {
                ...state,
                reviews: [
                    ...otherReviews,
                    {
                        movieId: action.movieId,
                        rating: action.rating,
                        review: action.review
                    }
                ]
            };
        }
        default: return state;
    }
};