// frontend/pages/auth/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();

  // Periksa token saat halaman di-load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Jika token ada, redirect ke dashboard
      router.push('/user/dashboard');
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const res = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (res.ok && data.token) {
            // Simpan token di localStorage
            localStorage.setItem('token', data.token);
            alert('Login berhasil!');
            router.push('/user/dashboard');
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        console.error('Error during login:', err);
        alert('Terjadi kesalahan. Silakan coba lagi.');
    }
};

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit">Login</button>
    </form>
  );
}
