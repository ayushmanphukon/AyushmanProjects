package com.suggestions;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.json.JSONArray;
import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;

@WebServlet("/GetSuggestionsServlet")
public class GetSuggestionsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String currentUserId = request.getParameter("currentUserId");
        
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"Missing user ID\"}");
            return;
        }

        try {
            try (Connection conn = DatabaseConnection.getConnection()) {

                String sql = "SELECT DISTINCT u.user_id, u.username, u.profile_picture_url, "
                		+ "    EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? "
                		+ "        AND f.following_id = u.user_id) as is_following "
                		+ "FROM users u "
                		+ "INNER JOIN user_tags ut ON u.user_id = ut.user_id "
                		+ "WHERE ut.tag_id IN ( "
                		+ "    SELECT tag_id "
                		+ "    FROM user_tags "
                		+ "    WHERE user_id = ? "
                		+ ") "
                		+ "AND u.user_id != ? "
                		+ "AND NOT EXISTS ( "
                		+ "    SELECT 1 FROM follows f "
                		+ "    WHERE f.follower_id = ? "
                		+ "    AND f.following_id = u.user_id "
                		+ ") "
                		+ "ORDER BY u.user_id "
                		+ "LIMIT 10";
                    
                
                
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, Integer.parseInt(currentUserId)); // for is_following check
                    stmt.setInt(2, Integer.parseInt(currentUserId)); // for tag matching
                    stmt.setInt(3, Integer.parseInt(currentUserId)); // exclude current user
                    stmt.setInt(4, Integer.parseInt(currentUserId));
                    
                    ResultSet rs = stmt.executeQuery();
                    JSONArray suggestionsArray = new JSONArray();
                    
                    while (rs.next()) {
                        JSONObject friend = new JSONObject();
                        friend.put("user_id", rs.getInt("user_id"));
                        friend.put("username", rs.getString("username"));
                        friend.put("profile_picture_url", 
                            rs.getString("profile_picture_url") != null ? 
                            rs.getString("profile_picture_url") : 
                            "images/default-profile.jpg");
                        friend.put("is_following", rs.getBoolean("is_following"));
                        suggestionsArray.put(friend);
                    }
                    
                    // Write the JSON response
                    response.getWriter().write(suggestionsArray.toString());
                }
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"error\": \"An error occurred while fetching suggestions: " + 
                e.getMessage() + "\"}"
            );
            e.printStackTrace();
        }
    }
}