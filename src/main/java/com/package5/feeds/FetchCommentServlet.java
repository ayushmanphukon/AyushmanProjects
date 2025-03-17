package com.package5.feeds;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import com.google.gson.Gson;

import com.package1.utils.DatabaseConnection;

/**
 * Servlet implementation class FetchCommentServlet
 */
@WebServlet("/FetchCommentServlet")
public class FetchCommentServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");
		
		String postId = request.getParameter("postId");
		String userId = request.getParameter("userId");
		PrintWriter out = response.getWriter();
		List<Comments> array = new ArrayList<>();
		
		try(Connection con = DatabaseConnection.getConnection()){
			String query2 = "SELECT post_comments.comment_id, post_comments.created_at, users.username, "
	                + "users.profile_picture_url, post_comments.user_id, post_comments.post_id, "
	                + "post_comments.comment_text, post_comments.likes_count "
	                + "FROM post_comments JOIN users ON post_comments.user_id = users.user_id "
	                + "WHERE post_comments.post_id = ? "
	                + "ORDER BY post_comments.created_at DESC";
	        try (PreparedStatement pstmt2 = con.prepareStatement(query2)) {
	            pstmt2.setInt(1, Integer.parseInt(postId));

	            ResultSet rs = pstmt2.executeQuery();
	            while (rs.next()) { 
	            	String comment_id = rs.getString("comment_id");
	            	boolean isLiked = isLiked(comment_id, userId, con);
	                array.add(new Comments(comment_id,rs.getString("created_at"), rs.getString("username"), rs.getString("profile_picture_url"), rs.getString("post_id"), rs.getString("user_id"), rs.getString("comment_text"), isLiked, rs.getString("likes_count")));
	            }
	            
	            String json = new Gson().toJson(array);
	            out.println(json);
	            out.flush();
	        }
		}catch (SQLException | NumberFormatException e) {
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
	
	class Comments{
		String comment_id;
		String created_at;
		String username;
		String profile_pic;
		String post_id;
		String user_id;
		String comment;
		boolean isLiked;
		String likes_count;
		
		public Comments(String comment_id,String created_at, String username, String profile_pic, String post_id, String user_id, String comment, boolean isLiked, String likes_count) {
			this.comment_id = comment_id;
			this.created_at = created_at;
			this.username = username;
			this.profile_pic = profile_pic;
			this.post_id = post_id;
			this.user_id = user_id;
			this.comment = comment;
			this.isLiked = isLiked;
			this.likes_count = likes_count;
		}
	}


}
