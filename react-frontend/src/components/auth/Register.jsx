import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });
  const [betaMode, setBetaMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    checkBetaMode();
  }, []);

  const checkBetaMode = async () => {
    try {
      const res = await api.get('/api/invite/mode');
      setBetaMode(res.data.enabled);
    } catch (err) {
      console.error('Failed to check beta mode:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        inviteCode: betaMode ? formData.inviteCode : undefined
      });

      if (res.data.token) {
        await login(res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (betaMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-[#2d2d2d] p-8 rounded-lg shadow-lg border border-[#4a4a4a]">
          <div>
            <h2 className="mt-6 text-center text-3xl font-minecraft text-white">
              BETA Registration
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              BizzyLink is currently in BETA. You need an invite code to register.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="inviteCode" className="sr-only">Invite Code</label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  placeholder="Invite Code"
                  value={formData.inviteCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-minecraft rounded-md text-white bg-[#4a90e2] hover:bg-[#357abd] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4a90e2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link to="/login" className="font-medium text-[#4a90e2] hover:text-[#357abd]">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Regular registration form (when beta mode is off)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#2d2d2d] p-8 rounded-lg shadow-lg border border-[#4a4a4a]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-minecraft text-white">
            Create your account
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-[#4a4a4a] bg-[#1a1a1a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-minecraft rounded-md text-white bg-[#4a90e2] hover:bg-[#357abd] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4a90e2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-[#4a90e2] hover:text-[#357abd]">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 