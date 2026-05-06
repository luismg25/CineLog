import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Compare from './pages/Compare';
import MovieDetail from './pages/MovieDetail';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import NotFound from "./pages/NotFound.jsx";
import { useUser } from './context/UserContext';

function AppRoutes() {
    const { state } = useUser();

    return (
        <Router>
            <Navbar/>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/buscar" element={<Search key={state.mediaType} />} />
                <Route path="/comparar" element={<Compare key={state.mediaType} />} />
                <Route path="/:type/:id" element={<MovieDetail />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <UserProvider>
            <AppRoutes />
        </UserProvider>
    );
}

export default App;