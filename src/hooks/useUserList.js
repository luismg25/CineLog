import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

export const useUserList = () => {
    const { state, dispatch } = useContext(UserContext);

    const addMovie = (list, movie) => dispatch({ type: 'ADD_TO_LIST', list, movie });
    const removeMovie = (list, id) => dispatch({ type: 'REMOVE_FROM_LIST', list, id });
    const stats = { totalVistas: state.vistas.length, };

    return { lists: state, addMovie, removeMovie, stats };
};

