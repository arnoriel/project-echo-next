// frontend-lp/pages/index.js
import { useEffect, useState } from "react";
import { fetchContents } from "@/utils/api";

export default function Home({ initialContents }) {
  const [contents, setContents] = useState(initialContents || []); // Pastikan nilai default adalah []

  // Fungsi untuk fetching data di klien
  const fetchData = async () => {
    try {
      const data = await fetchContents();
      setContents(data);
    } catch (error) {
      console.error("Error fetching contents:", error);
    }
  };

  useEffect(() => {
    // Fetch data setiap 1 detik
    const interval = setInterval(() => {
      fetchData();
    }, 1000);

    return () => clearInterval(interval); // Bersihkan interval saat komponen unmount
  }, []);

  return (
    <div>
      <div className="container">
      <h1>Contents</h1>
      <ul>
        {contents.map((content) => ( // contents dijamin array
          <li key={content.id}>
            <h2>{content.title}</h2>
            <p>{content.description}</p>
            <img
              src={`http://localhost:8080/uploads/${content.image}`}
              alt={content.title}
              width={300}
              height={300}
            />
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

// SSR: Ambil data awal di server
export async function getServerSideProps() {
  try {
    const initialContents = await fetchContents();

    return {
      props: {
        initialContents: initialContents || [], // Pastikan nilai default adalah array kosong
      },
    };
  } catch (error) {
    console.error("Error fetching contents on server:", error);

    return {
      props: {
        initialContents: [], // Kembalikan array kosong jika terjadi error
      },
    };
  }
}
