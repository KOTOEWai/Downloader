import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await api.post('/user/login', {
        email: formData.email,
        password: formData.password,
      });

      const data = res.data;

      if (data.success && data.user) {
        setMessage('Login successfully!');
        setTimeout(() => navigate('/home'), 500);
      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-10 glass rounded-3xl relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-text-main">Welcome Back</h2>
          <p className="text-text-dim">Login to your downloader account</p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl text-center mb-6 text-sm font-medium ${message.includes('successfully') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
          >
            {message}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dim ml-1">Email Address</label>
            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dim ml-1">Password</label>
            <input
              className="input-field"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-4 mt-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-text-dim text-sm">
          Don’t have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-semibold transition-colors underline decoration-primary/30 underline-offset-4">
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
