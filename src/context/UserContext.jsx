import { createContext, useReducer, useEffect, useContext } from 'react';

export const UserContext = createContext();

const savedData = JSON.parse(localStorage.getItem('cinelog_data')) || {};

const initialState = {
    mediaType: 'movie',
    favoritas: savedData.favoritas || [],
    vistas: savedData.vistas || [],
    pendientes: savedData.pendientes || [],
    reviews: savedData.reviews || []
};

function userReducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_MEDIA':
            return {
                ...state,
                mediaType: state.mediaType === 'movie' ? 'tv' : 'movie'
            };

        case 'ADD_TO_LIST':
            if (state[action.list].find(m => m.id === action.movie.id)) return state;
            return {
                ...state,
                [action.list]: [...state[action.list], action.movie]
            };

        case 'REMOVE_FROM_LIST':
            return {
                ...state,
                [action.list]: state[action.list].filter(m => m.id !== action.id)
            };

        case 'ADD_REVIEW':
            return {
                ...state,
                reviews: [
                    ...state.reviews.filter(r => r.movieId !== action.movieId),
                    {
                        movieId: action.movieId,
                        rating: action.rating,
                        review: action.review
                    }
                ]
            };
        default: return state;
    }
}

export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userReducer, initialState);

    // Persistencia automática
    useEffect(() => {
        localStorage.setItem('cinelog_data', JSON.stringify(state));
    }, [state]);

    return (
        <UserContext.Provider value={{ state, dispatch }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser debe usarse dentro de un UserProvider");
    }
    return context;
};


