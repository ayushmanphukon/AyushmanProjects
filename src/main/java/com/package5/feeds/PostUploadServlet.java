package com.package5.feeds;

import com.package1.utils.DatabaseConnection;
import com.package7.websocket.FeedsWebSocket;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

@WebServlet("/api/posts/upload")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024, // 1 MB
    maxFileSize = 1024 * 1024 * 10,  // 10 MB
    maxRequestSize = 1024 * 1024 * 15 // 15 MB
)
public class PostUploadServlet extends HttpServlet {
    
    private static final long serialVersionUID = -5747484135538248963L;
	private static final String UPLOAD_DIR = "uploads/posts";

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        
        try {
            Integer userId = (Integer) request.getSession().getAttribute("userId");
            if (userId == null) {
                throw new ServletException("Not logged in");
            }

            String caption = request.getParameter("caption");
            // Sanitize HTML content if needed
            caption = caption.replaceAll("<script[^>]*>.*?</script>", "")
                            .replaceAll("<style[^>]*>.*?</style>", "");
            Part mediaPart = request.getPart("media");
            
            String imageUrl = "";
            
            if (mediaPart != null && mediaPart.getSize() > 0) {
                imageUrl = saveMedia(mediaPart);
            }

            // Save to database
            try (Connection conn = DatabaseConnection.getConnection()) {
                String sql = "INSERT INTO posts (user_id, caption, image_url, media_type) VALUES (?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, userId);
                    stmt.setString(2, caption);
                    stmt.setString(3, imageUrl);
                    stmt.setString(4, mediaPart != null && mediaPart.getSize() > 0 ? "image/png" : "text");
                    stmt.executeUpdate();
                }

                // Fetch the created post details for broadcast
                String fetchSql = "SELECT p.*, u.username, u.profile_picture_url, "
                		+ "       (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS total_posts "
                		+ "FROM posts p "
                		+ "JOIN users u ON p.user_id = u.user_id "
                		+ "WHERE p.user_id = ? "
                		+ "ORDER BY p.created_at DESC "
                		+ "LIMIT 1;";
                                 
                try (PreparedStatement fetchStmt = conn.prepareStatement(fetchSql)) {
                    fetchStmt.setInt(1, userId);
                    fetchStmt.setInt(2, userId);
                    ResultSet rs = fetchStmt.executeQuery();
                    
                    
                    if (rs.next()) {
                        JSONObject postData = new JSONObject()
                            .put("postId", rs.getLong("post_id"))
                            .put("userId", rs.getInt("user_id"))
                            .put("username", rs.getString("username"))
                            .put("profilePic", rs.getString("profile_picture_url"))
                            .put("caption", rs.getString("caption"))
                            .put("imageUrl", rs.getString("image_url"))
                            .put("createdAt", rs.getTimestamp("created_at").getTime())
                            .put("likesCount", 0)
                            .put("isLiked", false)
                            .put("commentsCount", rs.getString("comments_count"))
                            .put("posts_count", rs.getString("total_posts"));
                        // Broadcast the new post
                        FeedsWebSocket.broadcast("new_post", postData);
                        System.out.print("called");
                    }
                }
            }

            JSONObject jresponse = new JSONObject()
                .put("success", true)
                .put("message", "Post created successfully");
            response.getWriter().write(jresponse.toString());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JSONObject errorResponse = new JSONObject()
                .put("success", false)
                .put("error", e.getMessage());
            response.getWriter().write(errorResponse.toString());
        }
    }

    private String saveMedia(Part part) throws IOException {
        String fileName = UUID.randomUUID() + getFileExtension(part);
        String uploadPath = getServletContext().getRealPath("") + UPLOAD_DIR;
        
        Files.createDirectories(Paths.get(uploadPath));
        part.write(Paths.get(uploadPath, fileName).toString());
        
        return UPLOAD_DIR + "/" + fileName;
    }

    private String getFileExtension(Part part) {
        String submittedFileName = part.getSubmittedFileName();
        return submittedFileName.substring(submittedFileName.lastIndexOf("."));
    }
} 