import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const Login: React.FC = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
     
      if (data) {
        setMessage('login successfully!');
        navigate('/home');
        localStorage.setItem('token',data.token);
      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-blue-600 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">Login</h2>
  {message && (
          <p className="text-center text-sm text-red-500 font-medium">{message}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="w-full py-3 text-white font-semibold bg-indigo-600 rounded-xl hover:bg-indigo-700 transition duration-300"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Don’t have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline font-medium">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
