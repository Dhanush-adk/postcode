package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/dgrijalva/jwt-go"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

// User represents the structure of a user in the system
type User struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number"`
}

// JWTSecretKey is the secret key used for token generation
var JWTSecretKey = []byte(os.Getenv("JWT_SECRET_KEY"))

// Database connection
var db *sql.DB

var server = "postcodeserver.database.windows.net"
var port = 1433
var user = "postcode_user"
var password = "Post@123"
var database = "myfreedb"

func init() {
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;port=%d;database=%s;",
		server, user, password, port, database)
	var err error
	db, err = sql.Open("sqlserver", connString)
	if err != nil {
		log.Fatal("Error creating connection pool: ", err.Error())
	}
	ctx := context.Background()
	err = db.PingContext(ctx)
	if err != nil {
		log.Fatal(err.Error())
	}
	fmt.Println("Connected to the database successfully!")
}

func main() {
	e := echo.New()

	// Routes
	e.POST("/login", loginHandler)
	e.POST("/signup", signupHandler)
	e.POST("/forgot-password", forgotPasswordHandler)
	e.PUT("/update-username", updateUsernameHandler)
	e.PUT("/update-email", updateEmailHandler)
	e.PUT("/update-phone", updatePhoneNumberHandler)

	// Start server
	e.Logger.Fatal(e.Start(":8080"))
}

// loginHandler handles user login requests
func loginHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Validate user credentials from the database
	var storedPassword string
	err := db.QueryRow("SELECT password FROM users WHERE username = @username",
		sql.Named("username", user.Username)).Scan(&storedPassword)

	if err == sql.ErrNoRows {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "Invalid username or password",
		})
	} else if err != nil {
		log.Println("Database query error:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	// Compare hashed password
	if bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(user.Password)) != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "Invalid username or password",
		})
	}

	// Generate JWT token
	token, err := generateToken(user.Username)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to generate token",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Login successful",
		"token":   token,
	})
}

// signupHandler handles user signup requests
func signupHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Check for existing username, email, or phone number
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE username = @username OR email = @username OR phone_number = @phone_number",
		sql.Named("username", user.Username),
		sql.Named("email", user.Email),
		sql.Named("phone_number", user.PhoneNumber)).Scan(&count)

	if err != nil {
		log.Println("Error checking user existence:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	if count > 0 {
		return c.JSON(http.StatusConflict, map[string]string{
			"message": "Username, email, or phone number already exists",
		})
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to hash password",
		})
	}

	// Prepare the SQL query
	query := "INSERT INTO users (username, password, email, phone_number) VALUES (@username, @password, @email, @phone_number)"
	_, err = db.Exec(query,
		sql.Named("username", user.Username),
		sql.Named("password", string(hashedPassword)),
		sql.Named("email", user.Email),
		sql.Named("phone_number", user.PhoneNumber))

	if err != nil {
		log.Println("Error inserting user into database:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to create user",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Signup successful",
	})
}

// forgotPasswordHandler handles password reset requests
func forgotPasswordHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Check if email exists
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE email = @email",
		sql.Named("email", user.Email)).Scan(&count)

	if err != nil {
		log.Println("Error checking email existence:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	if count == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{
			"message": "Email does not exist",
		})
	}

	// Implement email-based password reset logic here
	return c.JSON(http.StatusOK, map[string]string{
		"message": "Password reset link sent to email",
	})
}

// updateUsernameHandler handles username updates
func updateUsernameHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Check for existing username
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE username = @username",
		sql.Named("username", user.Username)).Scan(&count)

	if err != nil {
		log.Println("Error checking username existence:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	if count > 0 {
		return c.JSON(http.StatusConflict, map[string]string{
			"message": "Username already exists",
		})
	}

	// Update the username
	_, err = db.Exec("UPDATE users SET username = @username WHERE email = @email",
		sql.Named("username", user.Username),
		sql.Named("email", user.Email))

	if err != nil {
		log.Println("Error updating username:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to update username",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Username updated successfully",
	})
}

// updateEmailHandler handles email updates
func updateEmailHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Check for existing email
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE email = @email",
		sql.Named("email", user.Email)).Scan(&count)

	if err != nil {
		log.Println("Error checking email existence:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	if count > 0 {
		return c.JSON(http.StatusConflict, map[string]string{
			"message": "Email already exists",
		})
	}

	// Update the email
	_, err = db.Exec("UPDATE users SET email = @new_email WHERE email = @current_email",
		sql.Named("new_email", user.Email),
		sql.Named("current_email", user.Email))

	if err != nil {
		log.Println("Error updating email:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to update email",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Email updated successfully",
	})
}

// updatePhoneNumberHandler handles phone number updates
func updatePhoneNumberHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Check for existing phone number
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE phone_number = @phone_number",
		sql.Named("phone_number", user.PhoneNumber)).Scan(&count)

	if err != nil {
		log.Println("Error checking phone number existence:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	if count > 0 {
		return c.JSON(http.StatusConflict, map[string]string{
			"message": "Phone number already exists",
		})
	}

	// Update the phone number
	_, err = db.Exec("UPDATE users SET phone_number = @new_phone WHERE phone_number = @current_phone",
		sql.Named("new_phone", user.PhoneNumber),
		sql.Named("current_phone", user.PhoneNumber))

	if err != nil {
		log.Println("Error updating phone number:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to update phone number",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Phone number updated successfully",
	})
}

// generateToken creates a JWT token for the authenticated user
func generateToken(username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString(JWTSecretKey)
}
