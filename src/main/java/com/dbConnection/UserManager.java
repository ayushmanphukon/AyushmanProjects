package com.dbConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.json.JSONArray;
import org.json.JSONObject;

import com.package1.utils.DatabaseConnection;

public class UserManager {
	
	public static JSONArray getAllUsers(int CurrentUserid) {
		JSONArray users = new JSONArray();
		String query = "SELECT \n"
				+ "    u.user_id,\n"
				+ "    u.full_name,\n"
				+ "    u.username,\n"
				+ "    u.email,\n"
				+ "    u.profile_picture_url,\n"
				+ "    u.is_verified,\n"
				+ "    u.created_at,\n"
				+ "    u.bio,\n"
				+ "    MAX(m.send_time) AS last_message_time,\n"
				+ "    MIN(m.isread) AS isread,\n"
				+ "    COUNT(CASE WHEN m.isread = false AND m.receiver_id = ? THEN 1 END) AS unread_message_count  \n"
				+ "FROM \n"
				+ "    users u\n"
				+ "JOIN \n"
				+ "    messages m ON (m.sender_id = u.user_id OR m.receiver_id = u.user_id) \n"
				+ "WHERE \n"
				+ "    u.user_id <> ? \n"
				+ "    AND (\n"
				+ "        m.sender_id = ? OR m.receiver_id = ?\n"
				+ "    )\n"
				+ "GROUP BY \n"
				+ "    u.user_id\n"
				+ "ORDER BY \n"
				+ "    isread ASC, \n"
				+ "    last_message_time DESC;\n"
				+ "";

		try {
		    Connection connection = DatabaseConnection.getConnection();
		    PreparedStatement preparedStatement = connection.prepareStatement(query);
		    preparedStatement.setInt(1, CurrentUserid); // Set the logged-in user's ID
		    preparedStatement.setInt(2, CurrentUserid); // Set the logged-in user's ID for sender
		    preparedStatement.setInt(3, CurrentUserid); // Set the logged-in user's ID for receiver
		    preparedStatement.setInt(4, CurrentUserid);
		    ResultSet result = preparedStatement.executeQuery();
		    
		    while(result.next()) {
		        JSONObject user = new JSONObject();
		        user.put("userId", result.getInt("user_id"));
		        user.put("userName", result.getString("username"));
		        user.put("mailId", result.getString("email"));
		        user.put("profileImage", result.getString("profile_picture_url"));
		        user.put("unreadCount", result.getString("unread_message_count"));
		        users.put(user);
		    }
		} catch (SQLException e) {
		    e.printStackTrace();
		}
//		System.out.println("taken users" + users);

		return users;
	
	}
	
	public static JSONObject getUser(int UserId) {
		String query = "SELECT * FROM users WHERE user_id = ?";
		JSONObject user = new JSONObject();
		try {
			Connection connection = DatabaseConnection.getConnection();
			PreparedStatement preparedStatement = connection.prepareStatement(query);
			preparedStatement.setInt(1, UserId);
			ResultSet result = preparedStatement.executeQuery();
			while(result.next()) {
		        user.put("userId", result.getInt("user_id"));
		        user.put("userName", result.getString("username"));
		        user.put("mailId", result.getString("email"));
//		        user.put("isTracking", result.getString("is_tracking"));
		        user.put("profileImage", result.getString("profile_picture_url"));
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return user;
	}
	
	
	// First method to get groups (original)
	public static JSONArray getGroups(int userId) {
	    String query = "SELECT c.group_id, c.group_name FROM members m JOIN community c ON m.group_id = c.group_id WHERE m.member_id = ?";
	    JSONArray groups = new JSONArray();
	    
	    try {
	        Connection connection = DatabaseConnection.getConnection();
	        PreparedStatement preparedStatement = connection.prepareStatement(query);
	        preparedStatement.setInt(1, userId);
	        ResultSet result = preparedStatement.executeQuery();
	        
	        while(result.next()) {
	            JSONObject group = new JSONObject();
	            group.put("groupId", result.getInt("group_id"));
	            group.put("groupName", result.getString("group_name"));
	            groups.put(group);
	        }
	    } catch (SQLException e) {
	        e.printStackTrace();
	    }
	    return groups;
	}

	// New method to get member information
	public static JSONArray getMembersInfo(int userId) {
	    String query = "SELECT u.user_id, u.full_name, u.username, u.email, u.profile_picture_url, u.is_verified, u.bio " +
	                  "FROM members m JOIN users u ON m.member_id = u.user_id " +
	                  "WHERE m.group_id IN (SELECT group_id FROM members WHERE member_id = ?)";
	    JSONArray members = new JSONArray();
	    
	    try {
	        Connection connection = DatabaseConnection.getConnection();
	        PreparedStatement preparedStatement = connection.prepareStatement(query);
	        preparedStatement.setInt(1, userId);
	        ResultSet result = preparedStatement.executeQuery();
	        
	        while(result.next()) {
	            JSONObject member = new JSONObject();
	            member.put("userId", result.getInt("user_id"));
	            member.put("fullName", result.getString("full_name"));
	            member.put("username", result.getString("username"));
	            member.put("email", result.getString("email"));
	            member.put("profilePictureUrl", result.getString("profile_picture_url"));
	            member.put("isVerified", result.getBoolean("is_verified"));
	            member.put("bio", result.getString("bio"));
	            members.put(member);
	        }
	    } catch (SQLException e) {
	        e.printStackTrace();
	    }
	    return members;
	}

	// Method to combine groups and members into contacts
	public static JSONObject getContacts(int userId) {
	    JSONObject contacts = new JSONObject();
	    
	    // Get groups
	    JSONArray groups = getGroups(userId);
	    // Get members
	    JSONArray members = getMembersInfo(userId);
	    
	    // Combine into contacts object
	    contacts.put("groups", groups);
	    contacts.put("members", members);
	    
	    return contacts;
	}
	
	public static JSONObject isSavedMail(String userInput) {
		boolean isSaved = false;
		JSONObject jsonObject = new JSONObject();
        String query = "SELECT *  FROM users WHERE mail_id = ? OR user_name = ? ";
		try {
			Connection connection = DatabaseConnection.getConnection();
			PreparedStatement preparedStatement = connection.prepareStatement(query);
			preparedStatement.setString(1, userInput);
			preparedStatement.setString(2, userInput);
		    ResultSet resultSet = preparedStatement.executeQuery();
		    if(resultSet.next()) {
		    	isSaved = true;
		    	jsonObject.put("hashedPassword", resultSet.getString("user_password"));
		    	jsonObject.put("userId", resultSet.getString("user_id"));
		    }
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			jsonObject = new JSONObject();
			jsonObject.put("success", false);
			jsonObject.put("message", "An error occurred during login");
		}
		jsonObject.put("isSaved", isSaved);
       
		return jsonObject;
	}
	
	public static boolean isUnique(String userId) {
		boolean isExist = true;
		String query = "SELECT user_id from users where user_id = ?";
		try {
			Connection connection = DatabaseConnection.getConnection();
			PreparedStatement preparedStatement = connection.prepareStatement(query);
			preparedStatement.setString(1, userId);
		    isExist = preparedStatement.execute();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return isExist;
	}
	
	public static boolean saveUser(String userId, String name, String email, String hashedPassword, String imagePath, boolean isTracking, String team ) throws SQLException {
		PreparedStatement preparedStatement;
		Connection connection = DatabaseConnection.getConnection();
		int rowsAffected = 0;
			preparedStatement = connection.prepareStatement("SELECT * FROM users WHERE mail_id = ?");
			preparedStatement.setString(1, email);
	    	ResultSet resultSet = preparedStatement.executeQuery();
	    	if (!(resultSet.next())) {

	            preparedStatement = connection.prepareStatement("INSERT INTO users(user_id, user_name, user_password, mail_id, profile_image, is_tracking,team_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
	            preparedStatement.setString(1, userId);
	            preparedStatement.setString(2, name);
	            preparedStatement.setString(3, hashedPassword);
	            preparedStatement.setString(4, email);
	            preparedStatement.setString(5, imagePath);
	            preparedStatement.setBoolean(6, isTracking);
	            preparedStatement.setString(7, team);
	            rowsAffected = preparedStatement.executeUpdate();
	            
	        }else {
	        	System.out.println("User email exist");
	        }
	
		return rowsAffected > 0;

	}
	
	public static JSONArray getGroupContacts(int groupId) {
		JSONArray groupContacts = new JSONArray();
		String query = "SELECT u.user_id, u.full_name, u.username, u.email, u.profile_picture_url, u.is_verified, u.bio\n"
				+ "FROM members m\n"
				+ "JOIN users u ON m.member_id = u.user_id\n"
				+ "WHERE m.group_id = ?;\n"
				+ "";
		try {
			Connection connection = DatabaseConnection.getConnection();
			PreparedStatement preparedStatement = connection.prepareStatement(query);
			preparedStatement.setInt(1, groupId);
			ResultSet result  = preparedStatement.executeQuery();
			while(result.next()) {
				JSONObject contact = new JSONObject();
				contact.put("userId",result.getString("user_id"));
				groupContacts.put(contact);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return groupContacts;
	}
}
