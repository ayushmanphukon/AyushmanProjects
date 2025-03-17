package com.package5.feeds;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.BufferedReader;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.http.Part;

import org.json.JSONObject;

import com.google.gson.JsonObject;
import com.package1.utils.DatabaseConnection;
import com.package2.signup.User;
import com.package7.websocket.FeedsWebSocket;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.UUID;

@WebServlet("/api/posts/*")
@MultipartConfig(fileSizeThreshold = 1024 * 1024 * 2, // 2MB
maxFileSize = 1024 * 1024 * 10, // 10MB
maxRequestSize = 1024 * 1024 * 50)
public class PostOperationsServlet extends HttpServlet {
    
    private static final long serialVersionUID = -7159174467843239493L;
    private static final String UPLOAD_DIR = "uploads/posts";

	@Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        response.setContentType("application/json");
        
        try {
            // Extract post ID from path
            int postId = Integer.parseInt(pathInfo.substring(1));
            
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "SELECT p.*, u.username FROM posts p " +
                            "JOIN users u ON p.user_id = u.user_id " +
                            "WHERE p.post_id = ?";
                
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, postId);
                    ResultSet rs = stmt.executeQuery();
                    
                    if (rs.next()) {
                        JSONObject post = new JSONObject()
                            .put("postId", rs.getInt("post_id"))
                            .put("caption", rs.getString("caption"))
                            .put("imageUrl", rs.getString("image_url"))
                            .put("userId", rs.getInt("user_id"))
                            .put("username", rs.getString("username"))
                            .put("createdAt", rs.getTimestamp("created_at").getTime());
                        
                        response.getWriter().write(post.toString());
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        response.getWriter().write(new JSONObject()
                            .put("error", "Post not found")
                            .toString());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(new JSONObject()
                .put("error", "Failed to fetch post")
                .toString());
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if (pathInfo == null || pathInfo.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid request");
            return;
        }

        JSONObject jsonResponse = new JSONObject();
        response.setContentType("application/json");

        try {
            if (pathInfo.startsWith("/delete/")) {
                int postId = Integer.parseInt(pathInfo.substring(pathInfo.lastIndexOf("/") + 1));
                System.out.println("Attempting to delete post: " + postId);
                
                try (Connection conn = DatabaseConnection.getConnection()) {
                    String sql = "DELETE FROM posts WHERE post_id = ?";
                    PreparedStatement stmt = conn.prepareStatement(sql);
                    stmt.setInt(1, postId);
                    
                    int rowsAffected = stmt.executeUpdate();
                    System.out.println("Rows affected: " + rowsAffected);
                    
                    jsonResponse.put("success", rowsAffected > 0);
                    jsonResponse.put("post_id", postId);
                    
                    if (rowsAffected > 0) {
                        response.setStatus(HttpServletResponse.SC_OK);
                        // Broadcast delete event
                        JsonObject broadcastData = new JsonObject();
                        broadcastData.addProperty("postId", postId);
                        FeedsWebSocket.broadcast("post_delete", broadcastData);
                        System.out.println("Delete servlet called");
                    } else {
                        jsonResponse.put("error", "Post not found");
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    }
                }
            }
            else if (pathInfo.startsWith("/update/")) {
                int postId = Integer.parseInt(pathInfo.substring("/update/".length()));
                
                String caption = request.getParameter("caption");
                Part filePart = request.getPart("media");
                String imageUrl = null;
                
                if (filePart != null && filePart.getSize() > 0) {
                    String fileName = UUID.randomUUID().toString() + "_" + Paths.get(filePart.getSubmittedFileName()).getFileName().toString();
                    String uploadPath = getServletContext().getRealPath("/") + UPLOAD_DIR;
                    Files.createDirectories(Paths.get(uploadPath));
                    
                    try (InputStream input = filePart.getInputStream()) {
                        Files.copy(input, Paths.get(uploadPath, fileName), StandardCopyOption.REPLACE_EXISTING);
                    }
                    imageUrl = UPLOAD_DIR + "/" + fileName;
                    
                }
                
                try (Connection conn = DatabaseConnection.getConnection()) {
                    
                    String query = "update posts set caption = ? , image_url = ? where post_id = ?";
                    
                    try (PreparedStatement stmt = conn.prepareStatement(query)) {
                    	stmt.setString(1, caption);
                        stmt.setString(2, imageUrl); 
                        stmt.setInt(3, postId);
                        
                        int rowsAffected = stmt.executeUpdate();
                        
                        if (rowsAffected > 0) {
                            String selectSql = "SELECT p.*, u.username FROM posts p " +
                                              "JOIN users u ON p.user_id = u.user_id WHERE p.post_id = ?";
                            try (PreparedStatement selectStmt = conn.prepareStatement(selectSql)) {
                                selectStmt.setInt(1, postId);
                                ResultSet rs = selectStmt.executeQuery();
                                
                                if (rs.next()) {
                                    JSONObject postData = new JSONObject()
                                        .put("postId", rs.getInt("post_id"))
                                        .put("caption", rs.getString("caption"))
                                        .put("imageUrl", rs.getString("image_url"))
                                        .put("createdAt", rs.getTimestamp("created_at").getTime());
                                    
                                    jsonResponse.put("success", true);
                                    jsonResponse.put("data", postData);
                                    
                                    FeedsWebSocket.broadcast("post_update", postData);
                                }
                            }
                        } else {
                            jsonResponse.put("success", false);
                            jsonResponse.put("message", "Post not found or you don't have permission to edit");
                            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        }
                    }
                }
            }        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.put("success", false);
            jsonResponse.put("error", "Error processing request: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
        
        response.getWriter().write(jsonResponse.toString());
    }
    
    private int getCurrentUserId(HttpServletRequest request) throws ServletException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            // Instead of throwing exception, return error response
            throw new ServletException("User not logged in");
        }
        
        User user = (User) session.getAttribute("user");
        return user.getId();
    }
} 