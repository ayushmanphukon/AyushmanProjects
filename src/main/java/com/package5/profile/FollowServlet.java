package com.package5.profile;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;

/**
 * Servlet implementation class FollowServlet
 */
@WebServlet("/FollowServlet")
public class FollowServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String currentUserIdStr = request.getParameter("currentUserId");
        String followingUserIdStr = request.getParameter("followingUserId");
        String isFollowed = request.getParameter("isFollowed");
        JSONObject jsonResponse = new JSONObject();
        PrintWriter out = response.getWriter();

        // Validate parameters
        if (currentUserIdStr == null || currentUserIdStr.trim().isEmpty() || 
            followingUserIdStr == null || followingUserIdStr.trim().isEmpty()) {
            jsonResponse.put("success", false);
            jsonResponse.put("error", "Missing or invalid user IDs");
            out.println(jsonResponse.toString());
            out.flush();
            return;
        }

        int currentUserId, followingUserId;
        try {
            currentUserId = Integer.parseInt(currentUserIdStr);
            followingUserId = Integer.parseInt(followingUserIdStr);
        } catch (NumberFormatException e) {
            jsonResponse.put("success", false);
            jsonResponse.put("error", "Invalid user ID format");
            out.println(jsonResponse.toString());
            out.flush();
            return;
        }

        try (Connection con = DatabaseConnection.getConnection()) {
            String query;
            boolean isUnfollow = "true".equals(isFollowed);

            if (isUnfollow) {
                query = "DELETE FROM follows WHERE follower_id = ? AND following_id = ?";
            } else {
                query = "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)";
            }

            try (PreparedStatement pstmt = con.prepareStatement(query)) {
                pstmt.setInt(1, currentUserId); // Use setInt for integer column
                pstmt.setInt(2, followingUserId);

                int rs = pstmt.executeUpdate();

                if (rs > 0) {
                    jsonResponse.put("success", true);

                    // Update follower/following counts and broadcast
                    String query2 = "SELECT u.*, " +
                            "(SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) as followers_count, " +
                            "(SELECT COUNT(*) FROM follows WHERE follower_id = ?) as followings_count " +
                            "FROM users u WHERE u.user_id = ?";
                    try (PreparedStatement pstmt2 = con.prepareStatement(query2)) {
                        pstmt2.setInt(1, currentUserId);
                        pstmt2.setInt(2, followingUserId);

                        ResultSet rs2 = pstmt2.executeQuery();
                        if (rs2.next()) {
                            JSONObject jsonResponse2 = new JSONObject();
                            jsonResponse2.put("followers_count", rs2.getString("followers_count"));
                            jsonResponse2.put("followings_count", rs2.getString("followings_count"));
                            jsonResponse2.put("follower_id", currentUserId);
                            jsonResponse2.put("following_id", followingUserId);

                            FeedsWebSocket.broadcast("follow_user", jsonResponse2);
                        }
                    }
                } else {
                    jsonResponse.put("success", false);
                    jsonResponse.put("error", isUnfollow ? "No follow relationship to remove" : "Failed to follow user");
                }
            }

            out.println(jsonResponse.toString());
            out.flush();
        } catch (Exception e) {
            jsonResponse.put("success", false);
            jsonResponse.put("error", e.getMessage());
            out.println(jsonResponse.toString());
            out.flush();
            e.printStackTrace();
        }
    }
}