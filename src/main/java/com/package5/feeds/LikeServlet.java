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

/**
 * Servlet implementation class LikeServlet
 */
@WebServlet("/LikeServlet")
public class LikeServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
 
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json");
		
		
		
		try(Connection con = DatabaseConnection.getConnection()) {
			String userId = request.getParameter("userId");
			String postId = request.getParameter("postId");
			String likes_count = "";
			
			JSONObject jsonResponse = new JSONObject();
			JSONObject jsonResponse2 = new JSONObject();
			
			boolean isLiked = isLiked(userId,postId);
			String query = "";
			
			if(isLiked) {
				query = "update posts set likes_count = likes_count-1 where post_id = ? ";
				decreaseLike(userId, postId);
			}else {
				query = "update posts set likes_count = likes_count+1 where post_id = ? ";
				increaseLike(userId, postId);
			}
			
			try(PreparedStatement pstmt = con.prepareStatement(query)){
				pstmt.setString(1,postId);
				pstmt.executeUpdate();
				
				String likeQuery = "select likes_count from posts where post_id = ? ;";
				try(PreparedStatement pstmt2 = con.prepareStatement(likeQuery)){
					pstmt2.setString(1, postId);
					ResultSet rs = pstmt2.executeQuery();
					while(rs.next()) {
						likes_count = rs.getString("likes_count");
					}
				}
				
				jsonResponse.put("success", true);
				PrintWriter out = response.getWriter();
				out.print(jsonResponse);
				out.flush();
				
				jsonResponse2.put("likes_count", likes_count);
				jsonResponse2.put("post_id", postId);
				jsonResponse2.put("user_id", userId);
				

				FeedsWebSocket.broadcast("post_like", jsonResponse2);
			}
			
			
		}catch(Exception e) {
			e.getMessage();
		}
	}
	
	public boolean isLiked(String userId,String postId) {
		try(Connection con = DatabaseConnection.getConnection()){
			String query = "select * from post_likes where user_id=? and post_id=? ;";
			try(PreparedStatement pstmt = con.prepareStatement(query)){
				pstmt.setString(1, userId);
				pstmt.setString(2, postId);
				ResultSet result = pstmt.executeQuery();
				
				if(result.next()) {
					return true;
				}
			}
		}catch(SQLException e) {
			e.getMessage();
		}
		return false;
	}
	
	public void increaseLike(String userId, String postId) {
		try(Connection con = DatabaseConnection.getConnection()){
			String query = "insert into post_likes (post_id, user_id) values (?, ?);";
			try(PreparedStatement pstmt = con.prepareStatement(query)){
				pstmt.setString(1, postId);
				pstmt.setString(2, userId);
				
				pstmt.executeUpdate();

			}
		}catch(SQLException e) {
			e.getMessage();
		}
	}
	
	public void decreaseLike(String userId, String postId) {
		try(Connection con = DatabaseConnection.getConnection()){
			String query = "delete from post_likes where post_id = ? and user_id = ? ;";
			try(PreparedStatement pstmt = con.prepareStatement(query)){
				pstmt.setString(1, postId);
				pstmt.setString(2, userId);
				
				pstmt.executeUpdate();

			}
		}catch(SQLException e) {
			e.getMessage();
		}
	}

}
