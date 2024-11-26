import React, { useEffect, useState } from "react";
import axios from "axios";

const RestoreContent = () => {
  const [deletedContents, setDeletedContents] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true); // Tambahkan state untuk loading

  // Fetch deleted contents on component mount
  useEffect(() => {
    const fetchDeletedContents = async () => {
      try {
        const response = await axios.get("http://localhost:8080/contents/deleted");
        setDeletedContents(response.data || []); // Pastikan data berupa array
      } catch (error) {
        console.error("Failed to fetch deleted contents", error);
        setMessage("Failed to load data.");
      } finally {
        setLoading(false); // Matikan loading setelah data di-fetch
      }
    };

    fetchDeletedContents();
  }, []);

  const handleRestore = async (id) => {
    try {
      const response = await axios.put(`http://localhost:8080/contents/${id}/restore`);
      setMessage(response.data.message);

      // Remove restored content from the list
      setDeletedContents((prev) => prev.filter((content) => content.id !== id));
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || "Failed to restore content");
      } else {
        setMessage("An unexpected error occurred");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Recycle Bin</h1>
      <p>Restore deleted contents from here:</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {message && <p>{message}</p>}
          {deletedContents.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {deletedContents.map((content) => (
                <li
                  key={content.id}
                  style={{
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  <h2>{content.title}</h2>
                  <p><strong>Author:</strong> {content.author}</p>
                  <p><strong>Description:</strong> {content.description}</p>
                  {content.image && (
                    <img
                      src={`http://localhost:8080/uploads/${content.image}`}
                      alt={content.title}
                      style={{ maxWidth: "200px", display: "block", marginBottom: "10px" }}
                    />
                  )}
                  <button onClick={() => handleRestore(content.id)}>Restore</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No deleted contents available.</p>
          )}
        </>
      )}
    </div>
  );
};

export default RestoreContent;
