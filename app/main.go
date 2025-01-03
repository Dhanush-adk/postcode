package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/dgrijalva/jwt-go"
	"github.com/labstack/echo/v4"
)

// User represents the structure of a user in the system
type User struct {
	Username    string         `json:"username"`
	Email       string         `json:"email"`
	PhoneNumber string         `json:"phone_number"`
	Dob         sql.NullString `json:"dob"`      // Use NullString for nullable fields
	Location    sql.NullString `json:"location"` // Use NullString for nullable fields
	SSOProvider string         `json:"sso_provider"`
	SSOID       string         `json:"sso_id"`
	Password    string         `json:"password"`
}

// OTPData holds OTP and timestamp
var otpStore = make(map[string]string)

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
	e.POST("/send-otp", sendOTPHandler)
	e.POST("/validate-otp", validateOTPHandler)
	e.POST("/register", registerHandler)
	e.POST("/login-with-sso", loginWithSSOHandler)
	e.POST("/register-with-sso", registerWithSSOHandler)
	e.GET("/user-details", getUserDetailsHandler) // Register the /user-details route

	// Start server
	e.Logger.Fatal(e.Start(":8080"))
}

// sendOTPHandler handles sending OTP requests
func sendOTPHandler(c echo.Context) error {
	var request struct {
		PhoneNumber string `json:"phone_number"`
	}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	otp := generateOTP()
	otpStore[request.PhoneNumber] = otp
	log.Printf("OTP sent to %s: %s", request.PhoneNumber, otp)

	// Integrate with SMS API (mocked here)
	if err := sendSMSToPhone(request.PhoneNumber, otp); err != nil {
		log.Println("Failed to send OTP via SMS:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to send OTP",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "OTP sent successfully",
	})
}

// validateOTPHandler validates the OTP entered by the user
func validateOTPHandler(c echo.Context) error {
	var request struct {
		PhoneNumber string `json:"phone_number"`
		OTP         string `json:"otp"`
	}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	savedOTP, exists := otpStore[request.PhoneNumber]
	if !exists || savedOTP != request.OTP {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "Invalid OTP",
		})
	}

	var user User
	err := db.QueryRow("SELECT username, email, dob, location FROM users WHERE phone_number = @phone_number",
		sql.Named("phone_number", request.PhoneNumber)).Scan(&user.Username, &user.Email, &user.Dob, &user.Location)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusOK, map[string]interface{}{
				"message":       "User not registered",
				"access_token":  "",
				"is_registered": false,
			})
		}
		log.Println("Database query error:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
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
		"message":       "OTP validated successfully",
		"access_token":  token,
		"is_registered": true,
		"user": map[string]interface{}{
			"username": user.Username,
			"email":    user.Email,
			"dob":      user.Dob.String,
			"location": user.Location.String,
		},
	})
}

// registerHandler handles user registration
func registerHandler(c echo.Context) error {
	var request struct {
		Username    string `json:"username"`
		Email       string `json:"email"`
		PhoneNumber string `json:"phone_number"`
		Dob         string `json:"dob"`
		Location    string `json:"location"`
	}

	if err := c.Bind(&request); err != nil {
		log.Println("Bind error:", err)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// // Generate a default unique sso_id for non-SSO registrations
	// defaultSSOID := fmt.Sprintf("mobile-%s", request.PhoneNumber)

	// Insert user details into the database
	_, err := db.Exec("INSERT INTO users (username, email, phone_number, dob, location) VALUES (@username, @Email, @PhoneNumber, @Dob, @Location)",
		sql.Named("username", request.Username),
		sql.Named("Email", request.Email),
		sql.Named("PhoneNumber", request.PhoneNumber),
		sql.Named("Dob", sql.NullString{String: request.Dob, Valid: request.Dob != ""}),
		sql.Named("Location", sql.NullString{String: request.Location, Valid: request.Location != ""}))
	// sql.Named("SSOID", defaultSSOID))

	if err != nil {
		log.Println("Error inserting user into database:", err)

		// Handle unique key constraint violations
		if sqlErr, ok := err.(interface{ Error() string }); ok {
			errMsg := sqlErr.Error()
			if containsIgnoreCase(errMsg, "unique key constraint") {
				switch {
				case containsIgnoreCase(errMsg, "UQ__users__AB6E6164"): // Email constraint
					return c.JSON(http.StatusConflict, map[string]string{
						"message": "Email is already in use.",
					})
				case containsIgnoreCase(errMsg, "UQ__users__F3DBC572EC344C37"): // Username constraint
					return c.JSON(http.StatusConflict, map[string]string{
						"message": "Username is already taken.",
					})
				case containsIgnoreCase(errMsg, "UQ__users__phone_number"): // Phone number constraint
					return c.JSON(http.StatusConflict, map[string]string{
						"message": "Phone number is already registered.",
					})
				default:
					return c.JSON(http.StatusInternalServerError, map[string]string{
						"message": "Failed to register user. may be one of the entered field is already exists. Please check and try again.",
					})
				}
			}
		}

		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to register user.",
		})
	}

	// Generate JWT token for the newly registered user
	token, err := generateToken(request.Username)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to generate access token.",
		})
	}

	// Send success message with access token
	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":      "User registered successfully",
		"access_token": token,
	})
}

// Helper function to check if a string contains another string, ignoring case
func containsIgnoreCase(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// loginWithSSOHandler handles SSO login requests
func loginWithSSOHandler(c echo.Context) error {
	var request struct {
		Email       string `json:"email"`
		SSOProvider string `json:"sso_provider"`
		SSOID       string `json:"sso_id"`
	}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Check if user exists with SSO details
	var user User
	err := db.QueryRow("SELECT username, email, dob, location FROM users WHERE email = @Email AND sso_provider = @SSOProvider AND sso_id = @SSOID",
		sql.Named("Email", request.Email),
		sql.Named("SSOProvider", request.SSOProvider),
		sql.Named("SSOID", request.SSOID)).Scan(&user.Username, &user.Email, &user.Dob, &user.Location)

	if err == sql.ErrNoRows {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "SSO login failed, user not found",
		})
	} else if err != nil {
		log.Println("Database query error:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
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
		"message":      "SSO login successful",
		"access_token": token,
		"user":         user,
	})
}

// registerWithSSOHandler handles SSO registration requests
func registerWithSSOHandler(c echo.Context) error {
	user := new(User)
	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"message": "Invalid request format",
		})
	}

	// Insert SSO user into the database
	_, err := db.Exec("INSERT INTO users (username, email, phone_number, dob, location, sso_provider, sso_id) VALUES (@username, @Email, @PhoneNumber, @Dob, @Location, @SSOProvider, @SSOID)",
		sql.Named("username", user.Username),
		sql.Named("Email", user.Email),
		sql.Named("PhoneNumber", user.PhoneNumber),
		sql.Named("Dob", user.Dob),
		sql.Named("Location", user.Location),
		sql.Named("SSOProvider", user.SSOProvider),
		sql.Named("SSOID", user.SSOID))

	if err != nil {
		log.Println("Error inserting SSO user into database:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Failed to register SSO user",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "SSO user registered successfully",
	})
}

// generateOTP generates a 6-digit OTP
func generateOTP() string {
	num, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	return fmt.Sprintf("%06d", num)
}

// sendSMSToPhone mocks sending an SMS to a phone number
func sendSMSToPhone(phoneNumber, otp string) error {
	// Mocked SMS sending logic (replace with an actual SMS API)
	log.Printf("Sending SMS to %s: Your OTP is %s", phoneNumber, otp)
	return nil
}

// generateToken creates a JWT token for the authenticated user
func generateToken(username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString(JWTSecretKey)
}

func getUserDetailsHandler(c echo.Context) error {
	// Extract the token from the Authorization header
	tokenString := c.Request().Header.Get("Authorization")
	if tokenString == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "Missing or invalid token",
		})
	}

	// Parse and validate the JWT token
	tokenString = tokenString[len("Bearer "):] // Remove "Bearer " prefix
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return JWTSecretKey, nil
	})

	if err != nil {
		log.Println("Token parsing error:", err)
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "Invalid or expired token",
		})
	}

	// Extract the username from the token claims
	username, ok := claims["username"].(string)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"message": "Invalid token claims",
		})
	}

	// Fetch user details from the database
	var user User
	err = db.QueryRow("SELECT username, email, phone_number, dob, location FROM users WHERE username = @username",
		sql.Named("username", username)).Scan(
		&user.Username, &user.Email, &user.PhoneNumber, &user.Dob, &user.Location)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{
				"message": "User not found",
			})
		}
		log.Println("Database query error:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"message": "Database error",
		})
	}

	// Return user details
	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"username":     user.Username,
			"email":        user.Email,
			"phone_number": user.PhoneNumber,
			"dob":          user.Dob.String,
			"location":     user.Location.String,
		},
	})
}
