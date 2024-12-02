// backend/main.go
package main

import (
	"database/sql"
	"io"
	"log"
	"net/http"
	"os"
	"time"
	"fmt"

	"github.com/golang-jwt/jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB

func main() {
	// Konfigurasi koneksi database PostgreSQL
	connStr := "postgres://postgres:arnoarno@localhost:5432/learnextecho?sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	defer db.Close()

	// Inisialisasi Echo
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
	}))	
	// Serve Static Images from Uploads
	e.Static("/uploads", "uploads")

	// Routes
	e.POST("/register", createUser)
	e.POST("/login", loginUser)

	// Content routes
	e.POST("/contents", createContent)       // Untuk membuat konten baru
	e.GET("/contents", getAllContents)       // Untuk mendapatkan semua konten
	e.PUT("/contents/:id", editContent)      // Untuk mengedit konten berdasarkan ID
	e.DELETE("/contents/:id", deleteContent) // Untuk menghapus konten berdasarkan ID
	e.PUT("/contents/:id/restore", restoreContent)
	e.GET("/contents/deleted", getDeletedContents)
	e.GET("/contents/:id", getContentByID)

	// Start server
	e.Logger.Fatal(e.Start(":8080"))
}

type User struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Content struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Image       string `json:"image"`
	Description string `json:"description"`
	Summary     string `json:"summary"`
	Author      string `json:"author"`
}

// Register handler
func createUser(c echo.Context) error {
	var user User
	if err := c.Bind(&user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid input"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error hashing password"})
	}

	_, err = db.Exec("INSERT INTO users (name, email, password) VALUES ($1, $2, $3)", user.Name, user.Email, string(hashedPassword))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error creating user"})
	}

	return c.JSON(http.StatusCreated, map[string]string{"message": "User registered successfully"})
}

// Login handler
func loginUser(c echo.Context) error {
	var user User
	if err := c.Bind(&user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid input"})
	}

	var dbUser User
	var hashedPassword string

	err := db.QueryRow("SELECT email, password FROM users WHERE email = $1", user.Email).Scan(&dbUser.Email, &hashedPassword)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid email or password"})
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid email or password"})
	}

	// Generate JWT token
	token, err := createToken(dbUser.Email)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to generate token"})
	}

	return c.JSON(http.StatusOK, map[string]string{"token": token})
}

// Contoh fungsi untuk membuat token JWT
func createToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(), // Token berlaku selama 24 jam
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte("your-secret-key"))
}

// Upload folder
const uploadFolder = "./uploads/"

// Handler to create content (with image upload)
func createContent(c echo.Context) error {
	file, err := c.FormFile("image")
	if err != nil {
		log.Printf("Error getting file: %v", err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid file"})
	}

	// Ensure the 'uploads' folder exists
	if _, err := os.Stat(uploadFolder); os.IsNotExist(err) {
		os.Mkdir(uploadFolder, os.ModePerm)
	}

	// Save image to 'uploads' folder
	src, err := file.Open()
	if err != nil {
		log.Printf("Error opening file: %v", err)
		return err
	}
	defer src.Close()

	dst, err := os.Create(fmt.Sprintf("%s/%s", uploadFolder, file.Filename))
	if err != nil {
		log.Printf("Error saving file: %v", err)
		return err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		log.Printf("Error copying file: %v", err)
		return err
	}

	content := Content{
		Title:       c.FormValue("title"),
		Image:       file.Filename,
		Description: c.FormValue("description"),
		Summary:     c.FormValue("summary"),
		Author:      c.FormValue("author"),
	}

	_, err = db.Exec(
		"INSERT INTO contents (title, image, description, summary, author) VALUES ($1, $2, $3, $4, $5)",
		content.Title, content.Image, content.Description, content.Summary, content.Author,
	)
	if err != nil {
		log.Printf("Error inserting content to database: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save content"})
	}

	return c.JSON(http.StatusCreated, content)
}

// Get all contents
func getAllContents(c echo.Context) error {
	rows, err := db.Query("SELECT id, title, image, description, summary, author FROM contents WHERE deleted_at IS NULL")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch contents"})
	}
	defer rows.Close()

	var contents []Content
	for rows.Next() {
		var content Content
		if err := rows.Scan(&content.ID, &content.Title, &content.Image, &content.Description, &content.Summary, &content.Author); err != nil {
			log.Printf("Error scanning row: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error parsing contents"})
		}
		contents = append(contents, content)
	}

	return c.JSON(http.StatusOK, contents)
}

// Get content by ID
func getContentByID(c echo.Context) error {
	id := c.Param("id")

	var content Content
	err := db.QueryRow(
		"SELECT id, title, image, description, summary, author FROM contents WHERE id = $1 AND deleted_at IS NULL",
		id,
	).Scan(&content.ID, &content.Title, &content.Image, &content.Description, &content.Summary, &content.Author)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Content not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch content"})
	}

	return c.JSON(http.StatusOK, content)
}

// Edit content
func editContent(c echo.Context) error {
    id := c.Param("id")

    // Ambil data lama dari database
    oldContent := Content{}
    err := db.QueryRow(
        "SELECT title, image, description, summary, author FROM contents WHERE id = $1",
        id,
    ).Scan(&oldContent.Title, &oldContent.Image, &oldContent.Description, &oldContent.Summary, &oldContent.Author)
    if err != nil {
        if err == sql.ErrNoRows {
            return c.JSON(http.StatusNotFound, map[string]string{"error": "Content not found"})
        }
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve old content"})
    }

    // Ambil data dari form
    title := c.FormValue("title")
    description := c.FormValue("description")
    summary := c.FormValue("summary")
    author := c.FormValue("author")
    image := oldContent.Image // Default gunakan image lama

    // Proses file gambar jika ada
    file, err := c.FormFile("image")
    if file != nil {
        // Hapus gambar lama jika ada
        if oldContent.Image != "" {
            oldImagePath := fmt.Sprintf("%s/%s", uploadFolder, oldContent.Image)
            os.Remove(oldImagePath)
        }

        // Simpan file baru
        src, err := file.Open()
        if err != nil {
            return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to open new image"})
        }
        defer src.Close()

        dst, err := os.Create(fmt.Sprintf("%s/%s", uploadFolder, file.Filename))
        if err != nil {
            return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save new image"})
        }
        defer dst.Close()

        if _, err = io.Copy(dst, src); err != nil {
            return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to copy new image"})
        }

        image = file.Filename
    }

    // Update konten di database
    _, err = db.Exec(
        "UPDATE contents SET title = $1, image = $2, description = $3, summary = $4, author = $5, updated_at = NOW() WHERE id = $6",
        title, image, description, summary, author, id,
    )
    if err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update content"})
    }

    return c.JSON(http.StatusOK, map[string]string{"message": "Content updated successfully"})
}

// Delete content (soft delete)
func deleteContent(c echo.Context) error {
	id := c.Param("id")

	// Update kolom deleted_at dengan waktu sekarang
	result, err := db.Exec("UPDATE contents SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL", id)
	if err != nil {
		log.Printf("Error soft deleting content: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to delete content"})
	}

	// Cek apakah ada baris yang diperbarui
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to delete content"})
	}

	if rowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Content not found or already deleted"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Content deleted successfully"})
}

// Restore content
func restoreContent(c echo.Context) error {
	id := c.Param("id")

	result, err := db.Exec("UPDATE contents SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL", id)
	if err != nil {
		log.Printf("Error restoring content: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to restore content"})
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to restore content"})
	}

	if rowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "Content not found or not deleted"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Content restored successfully"})
}

// Get deleted contents
func getDeletedContents(c echo.Context) error {
	rows, err := db.Query("SELECT id, title, image, description, summary, author FROM contents WHERE deleted_at IS NOT NULL")
	if err != nil {
		log.Printf("Error fetching deleted contents: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch deleted contents"})
	}
	defer rows.Close()

	var contents []Content
	for rows.Next() {
		var content Content
		if err := rows.Scan(&content.ID, &content.Title, &content.Image, &content.Description, &content.Summary, &content.Author); err != nil {
			log.Printf("Error scanning row: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error parsing deleted contents"})
		}
		contents = append(contents, content)
	}

	return c.JSON(http.StatusOK, contents)
}
