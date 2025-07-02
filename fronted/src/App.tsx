import { Routes, Route} from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/Home'
import ProtectedRoute from './components/protectRoute';

 // Use this in ProtectedRoute


function App() {
  
  return (
    <Routes>
      <Route path="/home" element={<ProtectedRoute><Home /> </ProtectedRoute>} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
    </Routes>
  );
}

export default App;
