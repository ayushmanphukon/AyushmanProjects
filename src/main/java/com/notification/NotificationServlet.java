package com.notification;

import java.io.IOException;
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
import com.google.gson.Gson;
import com.package1.utils.DatabaseConnection;

@WebServlet("/notifications")
public class NotificationServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    // Notification class to hold notification data
    private static class Notification {
        private int id;
        private String type;
        private String caption;
        private String created_at;
        private boolean read;

        public Notification(int id, String type, String caption, String created_at, boolean read) {
            this.id = id;
            this.type = type;
            this.caption = caption;
            this.created_at = created_at;
            this.read = read;
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Set response content type to JSON
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Get userId from request parameter
        String userIdParam = request.getParameter("userId");
        if (userIdParam == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing userId parameter");
            return;
        }

        int userId;
        try {
            userId = Integer.parseInt(userIdParam);
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid userId format");
            return;
        }

        List<Notification> notifications = new ArrayList<>();

        // Database query
        String sql = "SELECT notification_id, notification_type, notification_caption , created_at " +
                    "FROM notification WHERE user_id = ? ORDER BY notification_id DESC";

        try (Connection con = DatabaseConnection.getConnection();
             PreparedStatement pstmt = con.prepareStatement(sql)) {
            
            pstmt.setInt(1, userId);
            ResultSet rs = pstmt.executeQuery();

            while (rs.next()) {
                int notificationId = rs.getInt("notification_id");
                String type = rs.getString("notification_type");
                String caption = rs.getString("notification_caption");
                String created_at = rs.getString("created_at");
                // Assuming read status isn't in DB yet, defaulting to false
                notifications.add(new Notification(notificationId, type, caption, created_at, false));
            }

            // Convert to JSON and send response
            Gson gson = new Gson();
            String json = gson.toJson(notifications);
            response.getWriter().write(json);

        } catch (SQLException e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                "Database error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String action = request.getParameter("action");
        if ("markAsRead".equals(action)) {
            String notificationIdParam = request.getParameter("notificationId");
            
            if (notificationIdParam == null) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, 
                    "Missing notificationId parameter");
                return;
            }

            try {
                int notificationId = Integer.parseInt(notificationIdParam);
                // Here you would update the database to mark notification as read
                // For this example, we'll just return success
                response.setContentType("application/json");
                response.getWriter().write("{\"status\": \"success\"}");
            } catch (NumberFormatException e) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, 
                    "Invalid notificationId format");
            }
        }
    }
}
