import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const checkAuth = (router) => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth/login');
  }
};

export default function AddContent() {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth(router);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('image', image);
    formData.append('description', description);
    formData.append('summary', summary);
    formData.append('author', author);

    try {
      const res = await fetch('http://localhost:8080/contents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        router.push('/menu/content'); // Redirect to content list after success
      } else {
        const error = await res.json();
        alert(`Failed to add content: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div>
      <h1>Add Content</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Image:
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </label>
        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <label>
          Summary:
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </label>
        <label>
          Author:
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </label>
        <button type="submit">Add Content</button>
      </form>
    </div>
  );
}
