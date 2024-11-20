// frontend/pages/user/dashboard.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('Logout berhasil!');
    router.push('/auth/login');
  };

  useEffect(() => {
    // Periksa apakah user sudah login
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div>
      <h1>Dashboard</h1>
      <button><a href='/menu/content'>Contents</a></button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
