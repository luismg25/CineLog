import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Compare from './pages/Compare';
import MovieDetail from './pages/MovieDetail';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import NotFound from "./pages/NotFound.jsx";

function App() {
    return (
          <UserProvider>
                <Router>
                    <Navbar/>
                          <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/buscar" element={<Search />} />
                                <Route path="/comparar" element={<Compare />} />
                                <Route path="/:type/:id" element={<MovieDetail />} />
                                <Route path="/perfil" element={<Profile />} />
                                <Route path="*" element={<NotFound />} />
                          </Routes>
                </Router>
          </UserProvider>
  );
}

export default App;
