package com.package8.friends;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.package1.utils.DatabaseConnection;

/**
 * Servlet implementation class FriendsServlet
 */
@WebServlet("/FriendsServlet")
public class FriendsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String type = request.getParameter("type");
        String userId = request.getParameter("userId");

        if (userId == null || type == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"Missing required parameters\"}");
            return;
        }

        List<Friends> friends = new ArrayList<>();
        
        try (Connection con = DatabaseConnection.getConnection()) {
            String query;
            switch (type) {
                case "following":
                    query = "SELECT f.following_id AS user_id, u.profile_picture_url, u.username " +
                            "FROM follows f JOIN users u ON f.following_id = u.user_id " +
                            "WHERE f.follower_id = ?";
                    break;
                case "followers":
                    query = "SELECT "
                           + "    f.follower_id AS user_id, "
                           + "    u.profile_picture_url, "
                           + "    u.username, "
                           + "    CASE "
                           + "        WHEN EXISTS ( "
                           + "            SELECT 1 "
                           + "            FROM follows f2 "
                           + "            WHERE f2.follower_id = ? AND f2.following_id = f.follower_id "
                           + "        ) "
                           + "        THEN TRUE "
                           + "        ELSE FALSE "
                           + "    END AS is_following "
                           + "FROM follows f "
                           + "JOIN users u ON f.follower_id = u.user_id "
                           + "WHERE f.following_id = ?";
                    break;
                case "mutual":
                    query = "SELECT f1.following_id AS user_id, u.profile_picture_url, u.username " +
                            "FROM follows f1 JOIN follows f2 " +
                            "ON f1.following_id = f2.follower_id " +
                            "AND f1.follower_id = f2.following_id " +
                            "JOIN users u ON f1.following_id = u.user_id " +
                            "WHERE f1.follower_id = ?";
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("{\"error\": \"Invalid type parameter\"}");
                    return;
            }

            try (PreparedStatement pstmt = con.prepareStatement(query)) {
                if ("followers".equals(type)) {
                    pstmt.setString(1, userId); // First parameter for checking "is_following"
                    pstmt.setString(2, userId);       // Second parameter for getting followers list
                } else {
                    pstmt.setString(1, userId);
                }

                ResultSet rs = pstmt.executeQuery();
                
                while (rs.next()) {
                    friends.add(new Friends(
                        rs.getString("user_id"),
                        rs.getString("profile_picture_url"),
                        rs.getString("username"),
                        type.equals("followers") ? rs.getBoolean("is_following") : true // Handle is_following only for followers
                    ));
                }
                
                String jsonResponse = new Gson().toJson(friends);
                response.getWriter().write(jsonResponse);
            }
        } catch (Exception e) {
            e.printStackTrace(); // Log the error properly
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"An unexpected error occurred\"}");
        }
    }

    class Friends {
        String user_id;
        String profile_picture_url;
        String username;
        Boolean is_following; 

        public Friends(String user_id, String profile_picture_url, String username, Boolean is_following) {
            this.user_id = user_id;
            this.profile_picture_url = profile_picture_url;
            this.username = username;
            this.is_following = is_following;
        }
    }
}

