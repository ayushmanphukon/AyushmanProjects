package com.dbConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.json.JSONArray;
import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;

public class MessagesManager {
    public static boolean storeSendingMessage(int senderId, int receiverId, String message, boolean isRead, int groupId) {
        boolean isSaved = false;
        String query;

        if (groupId == 0) {
            // Personal message
            query = "INSERT INTO messages (sender_id, receiver_id, message, isread) VALUES (?, ?, ?, ?)";
        } else {
            // Group message
            query = "INSERT INTO messages (sender_id, message, isread, group_id) VALUES (?, ?, ?, ?)";
        }

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            
            if (groupId == 0) {
                // Personal message: set all 4 parameters
                preparedStatement.setInt(1, senderId);
                preparedStatement.setInt(2, receiverId);
                preparedStatement.setString(3, message);
                preparedStatement.setBoolean(4, isRead);
            } else {
                // Group message: set all 4 parameters
                preparedStatement.setInt(1, senderId);
                preparedStatement.setString(2, message);
                preparedStatement.setBoolean(3, isRead);
                preparedStatement.setInt(4, groupId);
            }

            isSaved = preparedStatement.executeUpdate() > 0; // Use executeUpdate for INSERT
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return isSaved;
    }

    // Fixed overloaded method to correctly call the main method
    public static boolean storeSendingMessage(int senderId, int receiverId, String message, int groupId) {
        return storeSendingMessage(senderId, receiverId, message, false, groupId);
    }

    public static JSONArray getMessages(int receiverId, int senderId) {
        JSONArray messages = new JSONArray();
        String query = "SELECT * FROM messages WHERE ((receiver_id = ? AND sender_id = ?) OR (sender_id = ? AND receiver_id = ?)) ORDER BY send_time DESC";
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, receiverId);
            preparedStatement.setInt(2, senderId);
            preparedStatement.setInt(3, receiverId);
            preparedStatement.setInt(4, senderId);
            ResultSet result = preparedStatement.executeQuery();

            while (result.next()) {
                JSONObject message = new JSONObject();
                message.put("senderId", result.getString("sender_id"));
                message.put("receiverId", result.getString("receiver_id"));
                message.put("message", result.getString("message"));
                messages.put(message);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        setRead(senderId, receiverId);
        return messages;
    }

    public static void setRead(int senderId, int receiverId) {
        String query = "UPDATE messages SET isread = TRUE WHERE sender_id = ? AND receiver_id = ? AND isread = false";
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, senderId);
            preparedStatement.setInt(2, receiverId);
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}