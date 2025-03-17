package com.package6.userprofile;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;
import com.package7.websocket.ProfileWebSocket;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/UserProfileServlet")
public class UserProfileServlet extends HttpServlet {
    
    private static final long serialVersionUID = -4844010832553939965L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");

        String userId = request.getParameter("userId");
        String currentUserId = request.getParameter("currentUserId");

        // Log received parameters for debugging
        System.out.println("Received userId: " + userId);
        System.out.println("Received currentUserId: " + currentUserId);

        // Validate userId
        if (userId == null || !userId.matches("\\d+")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(new JSONObject()
                .put("error", "Invalid userId parameter")
                .toString());
            return;
        }

        // Validate currentUserId
        if (currentUserId == null || !currentUserId.matches("\\d+")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(new JSONObject()
                .put("error", "Invalid currentUserId parameter")
                .toString());
            return;
        }

        try (Connection conn = DatabaseConnection.getConnection()) {
            String query = "SELECT u.*, " +
                    "(SELECT COUNT(*) FROM posts WHERE user_id = u.user_id) as posts_count, " +
                    "(SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) as followers_count, " +
                    "(SELECT COUNT(*) FROM follows WHERE follower_id = u.user_id) as following_count, " +
                    "(SELECT COUNT(*) FROM follows where follower_id = ? and following_id = u.user_id) as isFollowed "+
                    "FROM users u WHERE u.user_id = ?";
            
            try (PreparedStatement stmt = conn.prepareStatement(query)) {
                stmt.setInt(1, Integer.parseInt(currentUserId)); // Set currentUserId first
                stmt.setInt(2, Integer.parseInt(userId));       // Set userId second
                ResultSet rs = stmt.executeQuery();

                if (rs.next()) {
                    JSONObject profile = new JSONObject();
                    
                    profile.put("userId", rs.getInt("user_id"));
                    profile.put("username", rs.getString("username"));
                    profile.put("fullName", rs.getString("full_name"));
                    profile.put("bio", rs.getString("bio"));
                    profile.put("profilePictureUrl", rs.getString("profile_picture_url"));
                    profile.put("createdAt", rs.getTimestamp("created_at").getTime());
                    profile.put("followings", rs.getString("following_count"));
                    profile.put("followers", rs.getString("followers_count"));
                    profile.put("posts_count", rs.getString("posts_count"));
                    int isFollowed = Integer.parseInt(rs.getString("isFollowed"));
                    profile.put("isFollowed", isFollowed > 0);
                    
                    response.getWriter().write(profile.toString());
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write(new JSONObject()
                        .put("error", "User not found")
                        .toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(new JSONObject()
                .put("error", "Failed to load user profile: " + e.getMessage())
                .toString());
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {

        response.setContentType("application/json");
        String pathInfo = request.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(new JSONObject()
                .put("error", "Missing user ID in path")
                .toString());
            return;
        }

        String userId = pathInfo.substring(1);

        // Validate userId
        if (!userId.matches("\\d+")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(new JSONObject()
                .put("error", "Invalid userId in path")
                .toString());
            return;
        }

        System.out.println("Received POST userId: " + userId);

        ResultSet rs = null;
        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql = "SELECT user_id, username, full_name, bio, profile_picture_url, created_at " +
                    "FROM users WHERE user_id = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, Integer.parseInt(userId));
                rs = stmt.executeQuery();

                if (rs.next()) {
                    // First broadcast the updates
                    JSONObject profileData = new JSONObject()
                        .put("userId", userId)
                        .put("username", rs.getString("username"))
                        .put("fullName", rs.getString("full_name"))
                        .put("bio", rs.getString("bio"))
                        .put("profilePic", rs.getString("profile_picture_url"));

                    // Broadcast to profile WebSocket
                    ProfileWebSocket.broadcast("profile_update", profileData);

                    // Create broadcast data
                    JSONObject feedData = new JSONObject()
                        .put("userId", userId)
                        .put("username", rs.getString("username"))
                        .put("profilePic", request.getContextPath() + "/" + rs.getString("profile_picture_url"))
                        .put("updatedAt", System.currentTimeMillis());

                    // Log the data being broadcast
                    System.out.println("Broadcasting user update: " + feedData.toString());
                    // Broadcast the update
                    FeedsWebSocket.broadcast("user_update", feedData);

                    // Then send response
                    response.getWriter().write(feedData.toString());
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write(new JSONObject()
                        .put("error", "User not found")
                        .toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(new JSONObject()
                .put("error", "Failed to update user profile: " + e.getMessage())
                .toString());
        }
    }
}