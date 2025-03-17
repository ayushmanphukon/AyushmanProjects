package com.package5.profile;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;

import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/profile/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,    // 1 MB
        maxFileSize = 1024 * 1024 * 5,      // 5 MB
        maxRequestSize = 1024 * 1024 * 5    // 5 MB
)
public class ProfileServlet extends HttpServlet {
    private static final long serialVersionUID = 5616441609960053066L;
	private static final String UPLOAD_DIRECTORY = "uploads/profiles";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }

        Integer userId = (Integer) session.getAttribute("userId");

        try (Connection conn = DatabaseConnection.getConnection()) {
            Profile profile = getProfile(userId); // Pass connection to reuse
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("username", profile.getUsername());
            jsonResponse.put("bio", profile.getBio());
            jsonResponse.put("profilePictureUrl", profile.getProfilePictureUrl());
            
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(jsonResponse.toString());
        } catch (SQLException e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        HttpSession session = request.getSession();
        Integer userId = (Integer) session.getAttribute("userId");

        if (userId == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }

        try {
            String username = request.getParameter("username");
            String bio = request.getParameter("bio");

            // Validate username
            if (username == null || username.trim().isEmpty()) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Username cannot be empty");
                return;
            }

            // Check if username is already taken
            if (!isUsernameAvailable(username.trim(), userId)) {
                sendError(response, HttpServletResponse.SC_CONFLICT, "Username already exists");
                return;
            }

            // Handle file upload if present
            String profilePictureUrl = null;
            Part filePart = request.getPart("profilePicture");
            if (filePart != null && filePart.getSize() > 0) {
            		// Get the upload path
                    String applicationPath = request.getServletContext().getRealPath("");
                    String uploadPath = applicationPath + File.separator + UPLOAD_DIRECTORY;

                    // Create upload directory if it doesn't exist
                    File uploadDir = new File(uploadPath);
                    if (!uploadDir.exists()) {
                        uploadDir.mkdirs();
                    }

                    String fileName = "user_" + userId + "_" + System.currentTimeMillis() + getFileExtension(filePart);
                    String filePath = uploadPath + File.separator + fileName;
                    filePart.write(filePath);
                    profilePictureUrl = UPLOAD_DIRECTORY + "/" + fileName;
            	}
                
            

            // Update database
            boolean updated = updateProfile(userId, username, bio, profilePictureUrl);

            if (updated) {
            	
            	
                // Get updated profile data
            	JSONObject websocketProfile = new JSONObject();
                JSONObject profile = getProfileData(userId);

                JSONObject responseData = new JSONObject();
                responseData.put("success", true);
                responseData.put("message", "Profile updated successfully");
                responseData.put("profile", profile);
                
                websocketProfile.put("userId", userId);
                websocketProfile.put("username", username);
                websocketProfile.put("bio", bio);
                websocketProfile.put("profilePictureUrl", profilePictureUrl);
                
                FeedsWebSocket.broadcast("profile_update", websocketProfile);
                response.getWriter().write(responseData.toString());
                System.out.println("api/profile called!");
            } else {
                sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to update profile");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    private Profile getProfile(int userId) throws SQLException {
        String query = "SELECT u.*, " +
                "(SELECT COUNT(*) FROM posts WHERE user_id = u.user_id) as posts_count, " +
                "(SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) as followers_count, " +
                "(SELECT COUNT(*) FROM follows WHERE follower_id = u.user_id) as following_count " +
                "FROM users u WHERE u.user_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setInt(1, userId);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                Profile profile = new Profile();
                profile.setUserId(rs.getInt("user_id"));
                profile.setUsername(rs.getString("username"));
                profile.setFullName(rs.getString("full_name"));
                profile.setBio(rs.getString("bio"));
                profile.setEmail(rs.getString("email"));
                profile.setProfilePictureUrl(rs.getString("profile_picture_url"));

                return profile;
            }
            throw new SQLException("User not found");
        }
    }

    private boolean updateProfile(int userId, String username, String bio, String profilePictureUrl)
            throws SQLException {
        List<String> updates = new ArrayList<>();

        List<Object> values = new ArrayList<>();

        if (username != null && !username.trim().isEmpty()) {
            updates.add("username = ?");
            values.add(username.trim());
        }

        if (bio != null) {
            updates.add("bio = ?");
            values.add(bio);
        }

        if (profilePictureUrl != null) {
            updates.add("profile_picture_url = ?");
            values.add(profilePictureUrl);
        }

        if (updates.isEmpty()) {
            return false;
        }

        String query = "UPDATE users SET " + String.join(", ", updates) + " WHERE user_id = ?";
        values.add(userId);

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            for (int i = 0; i < values.size(); i++) {
                stmt.setObject(i + 1, values.get(i));
            }

            return stmt.executeUpdate() > 0;
        }
    }

    private JSONObject getProfileData(int userId) throws SQLException {
        String query = "SELECT username, bio, profile_picture_url FROM users WHERE user_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setInt(1, userId);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                JSONObject profile = new JSONObject();
                profile.put("username", rs.getString("username"));
                profile.put("bio", rs.getString("bio"));
                profile.put("profilePictureUrl", rs.getString("profile_picture_url"));
                return profile;
            }
            throw new SQLException("User not found");
        }
    }

    private String getFileExtension(Part part) {
        String contentDisp = part.getHeader("content-disposition");
        String[] tokens = contentDisp.split(";");
        for (String token : tokens) {
            if (token.trim().startsWith("filename")) {
                String fileName = token.substring(token.indexOf("=") + 2, token.length() - 1);
                return fileName.substring(fileName.lastIndexOf('.'));
            }
        }
        return ".jpg"; // default extension
    }


    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        JSONObject error = new JSONObject();
        error.put("success", false);
        error.put("message", message);
        response.getWriter().write(error.toString());
    }

    private boolean isUsernameAvailable(String username, int currentUserId) throws SQLException {
        String query = "SELECT COUNT(*) FROM users WHERE username = ? AND user_id != ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, username);
            stmt.setInt(2, currentUserId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) == 0; // Return true if no other user has this username
                }
                return false;
            }
        }
    }
}