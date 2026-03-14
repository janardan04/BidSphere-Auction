import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
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
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <Routes>

            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/seller-login" element={<SellerLogin />} />
            <Route path="/seller-register" element={<SellerRegister />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/auctions" element={<ViewProducts />} />
            <Route path="/place-bid/:id" element={<PlaceBid />} />

            {/* Protected routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />

            <Route path="/receipt" element={
              <ProtectedRoute>
                <Receipt />
              </ProtectedRoute>
            } />

            {/* Seller routes */}
            <Route path="/add-product" element={
              <ProtectedRoute requiredRole="seller">
                <AddProduct />
              </ProtectedRoute>
            } />

            <Route path="/seller-dashboard" element={
              <ProtectedRoute requiredRole="seller">
                <SellerDashboard />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;