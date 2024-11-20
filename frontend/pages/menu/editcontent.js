import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const checkAuth = (router) => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth/login');
  }
};

export default function EditContent() {
  const [content, setContent] = useState({
    title: '',
    description: '',
    summary: '',
    author: '',
    image: '',
  });
  const [file, setFile] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    checkAuth(router);

    if (id) {
      fetch(`http://localhost:8080/contents/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setContent({
            title: data.title || '',
            description: data.description || '',
            summary: data.summary || '',
            author: data.author || '',
            image: data.image || '',
          });
        })
        .catch((error) => {
          console.error('Error fetching content:', error);
        });
    }
  }, [router, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', content.title || '');
    formData.append('description', content.description || '');
    formData.append('summary', content.summary || '');
    formData.append('author', content.author || '');
    if (file) {
      formData.append('image', file);
    }

    try {
      const res = await fetch(`http://localhost:8080/contents/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        alert('Content updated successfully!');
        router.push('/menu/content');
      } else {
        throw new Error('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content. Please try again.');
    }
  };

  return (
    <div>
      <h1>Edit Content</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            type="text"
            value={content.title}
            onChange={(e) => setContent({ ...content, title: e.target.value })}
          />
        </label>
        <label>
          Image:
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {content.image && (
            <div>
              <img
                src={`http://localhost:8080/uploads/${content.image}`}
                alt="Current"
                style={{ width: '100px', height: 'auto' }}
              />
            </div>
          )}
        </label>
        <label>
          Description:
          <textarea
            value={content.description}
            onChange={(e) => setContent({ ...content, description: e.target.value })}
          />
        </label>
        <label>
          Summary:
          <input
            type="text"
            value={content.summary}
            onChange={(e) => setContent({ ...content, summary: e.target.value })}
          />
        </label>
        <label>
          Author:
          <input
            type="text"
            value={content.author}
            onChange={(e) => setContent({ ...content, author: e.target.value })}
          />
        </label>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
