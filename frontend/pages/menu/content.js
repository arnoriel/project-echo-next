// frontend/pages/menu/content.js
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const checkAuth = (router) => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth/login');
  }
};

export default function Content() {
  const router = useRouter();
  const [contents, setContents] = useState([]);

  useEffect(() => {
    checkAuth(router);
    // Fetching contents from backend
    fetch('http://localhost:8080/contents')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setContents(data);
        } else {
          console.error('Unexpected API response:', data);
        }
      })
      .catch((err) => console.error('Error fetching contents:', err));
  }, [router]);

  return (
    <div>
      <h1>Content List</h1>
      <Link href="/menu/addcontent">Add Content</Link>
      <button>
        <a href="/menu/restorecontent">Restore Contents</a>
      </button>
      <button>
        <a href="/user/dashboard">Return</a>
      </button>
      <ul>
        {contents.map((content) => (
          <li key={content.id}>
            <h2>{content.title}</h2>
            <img
              src={`http://localhost:8080/uploads/${content.image}`}
              alt={content.title}
              style={{ width: '100px', height: '100px' }}
            />
            <p>{content.summary}</p>
            <Link href={`/menu/editcontent?id=${content.id}`}>Edit</Link>
            <Link href={`/menu/deletecontent?id=${content.id}`}>Delete</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
