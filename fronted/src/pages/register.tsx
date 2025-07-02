import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
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
      const res = await fetch('http://localhost:3000/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Account created successfully!');
        navigate('/Login')
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
          {message && (
          <p className="text-center text-sm text-red-500 font-medium">{message}</p>
        )}

        <h2 className="text-3xl font-bold text-center text-gray-800">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

      
          <button
            type="submit"
            className="w-full py-3 text-white font-semibold bg-purple-600 rounded-xl hover:bg-purple-700 transition duration-300"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-purple-600 hover:underline font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
