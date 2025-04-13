import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AddProduct from './pages/AddProduct';
import Contact from './pages/Contact';
import AboutUs from './pages/AboutUs';
import ViewProducts from './pages/ViewProducts';
import SellerDashboard from './pages/SellerDashboard';
import SellerLogin from './pages/SellerLogin';
import SellerRegister from './pages/SellerRegister';
import PlaceBid from './pages/PlaceBid';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <div>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/auctions" element={<ViewProducts />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/seller-login" element={<SellerLogin />} />
          <Route path="/seller-register" element={<SellerRegister />} />
          <Route path="/place-bid/:id" element={<PlaceBid />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect to Home */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;