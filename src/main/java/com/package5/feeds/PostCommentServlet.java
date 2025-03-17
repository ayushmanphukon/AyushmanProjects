package com.package5.feeds;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;

@WebServlet("/PostCommentServlet")
public class PostCommentServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try (Connection con = DatabaseConnection.getConnection()) {
            String postId = request.getParameter("postId");
            String userId = request.getParameter("userId");
            String comment = request.getParameter("comment");
            String commentsCount = "";
            
            JSONObject jsonResponse = new JSONObject();
            JSONObject jsonResponse2 = new JSONObject();
            
            String query3 = "update posts set comments_count = comments_count + 1 where post_id = ? ;";
            try(PreparedStatement pstmt3 = con.prepareStatement(query3)){
            	pstmt3.setString(1, postId);
            	int result = pstmt3.executeUpdate();
            	if (result>0) {
            		String query4 = "select comments_count from posts where post_id = ? ;";
            		try(PreparedStatement pstmt4 = con.prepareStatement(query4)){
            			pstmt4.setString(1, postId);
            			ResultSet rs2 = pstmt4.executeQuery();
            			if(rs2.next()) {
            				commentsCount = rs2.getString("comments_count");
            			}
            		}
            	}
            }
            String query = "INSERT INTO post_comments (post_id, user_id, comment_text) VALUES (?, ?, ?)";
            try (PreparedStatement pstmt = con.prepareStatement(query)) {
                pstmt.setInt(1, Integer.parseInt(postId)); // Use setInt for IDs
                pstmt.setInt(2, Integer.parseInt(userId));
                pstmt.setString(3, comment);

                int rowsAffected = pstmt.executeUpdate();

                if (rowsAffected > 0) {
                    String query2 = "SELECT post_comments.comment_id, post_comments.created_at, users.username, "
                            + "users.profile_picture_url, post_comments.user_id, post_comments.post_id, "
                            + "post_comments.comment_text, post_comments.likes_count "
                            + "FROM post_comments JOIN users ON post_comments.user_id = users.user_id "
                            + "WHERE post_comments.user_id = ? AND post_comments.post_id = ? "
                            + "AND post_comments.comment_text = ? ORDER BY post_comments.created_at DESC";
                    try (PreparedStatement pstmt2 = con.prepareStatement(query2)) {
                        pstmt2.setInt(1, Integer.parseInt(userId));
                        pstmt2.setInt(2, Integer.parseInt(postId));
                        pstmt2.setString(3, comment);
                        
                        ResultSet rs = pstmt2.executeQuery();
                        if (rs.next()) { // Use if instead of while for single expected row
                            String commentId = rs.getString("comment_id");
                            boolean isLiked = isLiked(commentId, userId, con);
                            jsonResponse2.put("comment_id", commentId);
                            jsonResponse2.put("created_at", rs.getString("created_at"));
                            jsonResponse2.put("username", rs.getString("username"));
                            jsonResponse2.put("profile_pic", rs.getString("profile_picture_url"));
                            jsonResponse2.put("post_id", postId);
                            jsonResponse2.put("user_id", userId);
                            jsonResponse2.put("comment", comment);
                            jsonResponse2.put("isLiked", isLiked);
                            jsonResponse2.put("likes_count", rs.getInt("likes_count"));
                            jsonResponse2.put("commentsCount", commentsCount);
                        }
                    }
                    jsonResponse.put("success", true); // Corrected typo "sucess" to "success"
                    jsonResponse.put("data", jsonResponse2); // Include comment data in response
                } else {
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Failed to insert comment");
                }
                if (rowsAffected > 0) {
                    FeedsWebSocket.broadcast("post_comment", jsonResponse2);
                }
            }

            out.println(jsonResponse.toString());
            out.flush();

            

        } catch (SQLException | NumberFormatException e) {
            JSONObject errorResponse = new JSONObject();
            errorResponse.put("success", false);
            errorResponse.put("message", "Server error: " + e.getMessage());
            out.println(errorResponse.toString());
            out.flush();
            e.printStackTrace(); // Log the error for debugging
        } catch (Exception e) {
            JSONObject errorResponse = new JSONObject();
            errorResponse.put("success", false);
            errorResponse.put("message", "Unexpected error: " + e.getMessage());
            out.println(errorResponse.toString());
            out.flush();
            e.printStackTrace();
        } finally {
            out.close(); // Ensure PrintWriter is closed
        }
    }

    public boolean isLiked(String commentId, String userId, Connection con) {
        String query = "SELECT comment_id, user_id FROM comment_likes WHERE comment_id = ? AND user_id = ?";
        try (PreparedStatement pstmt = con.prepareStatement(query)) {
            pstmt.setInt(1, Integer.parseInt(commentId));
            pstmt.setInt(2, Integer.parseInt(userId));
            ResultSet rs = pstmt.executeQuery();
            return rs.next(); // True if a matching row exists
        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace(); // Log for debugging
            return false;
        }
    }
}