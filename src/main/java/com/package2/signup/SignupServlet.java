package com.package2.signup;

import com.package1.utils.DatabaseConnection;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import org.json.JSONObject;

@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 1024 * 1024 * 10,
        maxRequestSize = 1024 * 1024 * 15
)
public class SignupServlet extends HttpServlet {

    private static final long serialVersionUID = -923620194097035803L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JSONObject jsonResponse = new JSONObject();

        try {
            String fullName = request.getParameter("fullName");
            String username = request.getParameter("username");
            String email = request.getParameter("email");
            String password = request.getParameter("password");
            Part profilePicture = request.getPart("profilePicture");

            // Validate input
            if (!validateInput(fullName, username, email, password)) {
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Invalid input data");
                response.getWriter().write(jsonResponse.toString());
                return;
            }

            try {
                // Check if username or email already exists
                if (checkUserExists(username, email)) {
                	response.setStatus(400);
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Username or email already exists");
                    response.getWriter().write(jsonResponse.toString());
                    return;
                }

                // Hash password (assuming PasswordHasher is available)
                String hashedPassword = PasswordHasher.hashPassword(password);

                // Handle profile picture upload
                String profilePictureUrl = null;
                if (profilePicture != null && profilePicture.getSize() > 0) {
                    profilePictureUrl = handleFileUpload(profilePicture);
                }

                // Insert user into database and get user_id
                int userId = insertUser(fullName, username, email, hashedPassword, profilePictureUrl);
                if (userId > 0) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Signup successful! Please select your interests.");
                    jsonResponse.put("user_id", userId); // Add user_id to response
                } else {
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Failed to create account");
                }
            } catch (SQLException e) {
                if (e.getMessage().contains("unique_username")) {
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Username already taken");
                } else if (e.getMessage().contains("unique_email")) {
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Email already registered");
                } else {
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Database error occurred");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Server error occurred");
        }

        // Write response
        try (PrintWriter out = response.getWriter()) {
            out.print(jsonResponse.toString());
            out.flush();
        }
    }

    private int insertUser(String fullName, String username, String email,
                           String hashedPassword, String profilePictureUrl) throws SQLException {
        String query = "INSERT INTO users (full_name, username, email, password_hash, profile_picture_url, is_verified) " +
                "VALUES (?, ?, ?, ?, ?, true)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, fullName);
            stmt.setString(2, username);
            stmt.setString(3, email);
            stmt.setString(4, hashedPassword);
            stmt.setString(5, profilePictureUrl != null ? profilePictureUrl : "images/default-profile.jpg");

            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                // Retrieve the generated user_id
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        return rs.getInt(1); // Return the user_id
                    }
                }
            }
            return -1; // Indicate failure if no user_id was retrieved
        }
    }

    private boolean validateInput(String fullName, String username, String email, String password) {
        return fullName != null && fullName.length() >= 2 &&
                username != null && username.length() >= 3 &&
                email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$") &&
                password != null && password.length() >= 6;
    }

    private boolean checkUserExists(String username, String email) throws SQLException {
        String query = "SELECT COUNT(*) FROM users WHERE username = ? OR email = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, username);
            stmt.setString(2, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        }
        return false;
    }

    private String handleFileUpload(Part filePart) throws IOException {
        // Implement file upload logic here if needed
        // For now, return null or a default value
        return null;
    }
}