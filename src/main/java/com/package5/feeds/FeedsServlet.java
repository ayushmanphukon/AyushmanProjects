package com.package5.feeds;

import com.package1.utils.DatabaseConnection;
import org.json.JSONArray;
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
import java.sql.SQLException;

@WebServlet("/api/feeds")
public class FeedsServlet extends HttpServlet {
    
    private static final long serialVersionUID = -6117606554597661943L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        
        // Get and validate parameters
        String userId = request.getParameter("userId");
        String currentUserId = request.getParameter("currentUserId");
        String limitStr = request.getParameter("limit");
        String offsetStr = request.getParameter("offset");
        String type = request.getParameter("type");
        String kind = request.getParameter("kind");

        // Validate required parameters
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated: currentUserId is required");
            return;
        }

        // Parse limit and offset with default values and error handling
        int limit;
        int offset;
        try {
            limit = (limitStr != null) ? Integer.parseInt(limitStr) : 20;
            offset = (offsetStr != null) ? Integer.parseInt(offsetStr) : 0;
            if (limit < 1 || offset < 0) {
                throw new NumberFormatException("Invalid range");
            }
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid limit or offset parameter");
            return;
        }

        boolean isFriendsOnly = "friends".equals(type);

        try (Connection conn = DatabaseConnection.getConnection()) {
            String sql = "";
            
            // Handle different feed kinds
            switch (kind != null ? kind : "") {
                case "feedsTab":
                case "recent":  // Added support for "recent"
                    if (isFriendsOnly) {
                        sql = "SELECT p.*, u.username, u.profile_picture_url, " +
                              "EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked " +
                              "FROM posts p " +
                              "JOIN users u ON p.user_id = u.user_id " +
                              "WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) " +
                              "ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
                    } else {
                        sql = "SELECT p.*, u.username, u.profile_picture_url, " +
                              "EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked " +
                              "FROM posts p " +
                              "JOIN users u ON p.user_id = u.user_id " +
                              "ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
                    }
                    break;

                case "yourPostsTab":
                    sql = "SELECT p.*, u.username, u.profile_picture_url, " +
                          "EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked " +
                          "FROM posts p " +
                          "JOIN users u ON p.user_id = u.user_id " +
                          "WHERE p.user_id = ? " +
                          "ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
                    break;

                case "yourLikedPostsTab":
                    sql = "SELECT p.*, u.username, u.profile_picture_url, true as is_liked " +
                          "FROM posts p " +
                          "JOIN users u ON p.user_id = u.user_id " +
                          "JOIN post_likes pl ON p.post_id = pl.post_id " +
                          "WHERE pl.user_id = ? " +
                          "ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
                    break;

                case "suggestions":
                    sql = "SELECT p.*, u.username, u.profile_picture_url, " +
                          "EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) as is_liked " +
                          "FROM posts p " +
                          "JOIN users u ON p.user_id = u.user_id " +
                          "WHERE p.user_id IN (" +
                              "SELECT ut2.user_id " +
                              "FROM user_tags ut1 " +
                              "JOIN user_tags ut2 ON ut1.tag_id = ut2.tag_id AND ut1.user_id != ut2.user_id " +
                              "WHERE ut1.user_id = ? " +
                              "GROUP BY ut2.user_id " +
                              "HAVING COUNT(*) > 0" +
                          ") " +
                          "AND p.user_id != ? " +
                          "ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
                    break;

                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, 
                        "Invalid kind parameter. Must be one of: feedsTab, recent, yourPostsTab, yourLikedPostsTab, suggestions");
                    return;
            }

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                // Set parameters based on kind
                switch (kind != null ? kind : "") {
                    case "feedsTab":
                    case "recent":
                        if (isFriendsOnly) {
                            stmt.setString(1, currentUserId); // is_liked
                            stmt.setString(2, currentUserId); // follower_id
                            stmt.setInt(3, limit);
                            stmt.setInt(4, offset);
                        } else {
                            stmt.setString(1, currentUserId); // is_liked
                            stmt.setInt(2, limit);
                            stmt.setInt(3, offset);
                        }
                        break;

                    case "yourPostsTab":
                        stmt.setString(1, currentUserId); // is_liked
                        stmt.setString(2, userId != null ? userId : currentUserId); // user_id (default to currentUserId if null)
                        stmt.setInt(3, limit);
                        stmt.setInt(4, offset);
                        break;

                    case "yourLikedPostsTab":
                        stmt.setString(1, currentUserId); // user_id in post_likes
                        stmt.setInt(2, limit);
                        stmt.setInt(3, offset);
                        break;

                    case "suggestions":
                        stmt.setString(1, currentUserId); // is_liked
                        stmt.setString(2, currentUserId); // tag matching
                        stmt.setString(3, currentUserId); // exclude own posts
                        stmt.setInt(4, limit);
                        stmt.setInt(5, offset);
                        break;
                }

                ResultSet rs = stmt.executeQuery();
                JSONArray posts = new JSONArray();

                while (rs.next()) {
                    JSONObject post = new JSONObject()
                        .put("postId", rs.getLong("post_id"))
                        .put("userId", rs.getInt("user_id"))
                        .put("username", rs.getString("username"))
                        .put("profilePic", rs.getString("profile_picture_url"))
                        .put("caption", rs.getString("caption"))
                        .put("imageUrl", rs.getString("image_url"))
                        .put("createdAt", rs.getTimestamp("created_at").getTime())
                        .put("likesCount", rs.getInt("likes_count"))
                        .put("isLiked", rs.getBoolean("is_liked"))
                        .put("commentsCount", rs.getInt("comments_count")); // Changed to getInt since comments_count should be numeric

                    posts.put(post);
                }

                response.getWriter().write(posts.toString());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }
}