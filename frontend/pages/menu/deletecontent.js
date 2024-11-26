// frontend/pages/menu/deletecontent.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const checkAuth = (router) => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth/login');
  }
};

export default function DeleteContent() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    checkAuth(router);
  }, [router]);

  const handleDelete = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:8080/contents/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Content deleted successfully');
        router.push('/menu/content');
      } else {
        alert(data.message || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menghapus konten');
    }
  };

  return (
    <div>
      <h1>Delete Content</h1>
      <button onClick={handleDelete}>Confirm Delete</button>
    </div>
  );
}
