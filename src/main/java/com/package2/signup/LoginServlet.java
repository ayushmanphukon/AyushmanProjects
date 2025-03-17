package com.package2.signup;

import com.package1.utils.DatabaseConnection;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.json.JSONObject;

@WebServlet("/api/auth/*")
public class LoginServlet extends HttpServlet {

    private static final long serialVersionUID = -3102258464878208024L;

	@Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();
        // Handle different POST endpoints
        if ("/login".equals(pathInfo)) {
            handleLogin(request, response);
        } else if ("/logout".equals(pathInfo)) {
            handleLogout(request, response);
        }
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        request.setCharacterEncoding("UTF-8");


        try {
            // Read JSON data from request body
            StringBuilder buffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                buffer.append(line);
            }

            JSONObject jsonRequest = new JSONObject(buffer.toString());
            String username = jsonRequest.getString("username");
            String password = jsonRequest.getString("password");

            try (Connection conn = DatabaseConnection.getConnection()) {
                String query = "SELECT * FROM users WHERE username = ? OR email = ?";

                try (PreparedStatement stmt = conn.prepareStatement(query)) {
                    stmt.setString(1, username);
                    stmt.setString(2, username);

                    try (ResultSet rs = stmt.executeQuery()) {
                        JSONObject jsonResponse = new JSONObject();

                        if (rs.next()) {
                            String storedHash = rs.getString("password_hash");

                            if (PasswordHasher.verifyPassword(password, storedHash)) {
                                // Create session
                                HttpSession session = request.getSession(true); // Create new session if none exists
                                session.setAttribute("userId", rs.getInt("user_id"));
                                session.setAttribute("username", rs.getString("username"));

                                jsonResponse.put("success", true);
                                jsonResponse.put("message", "Login successful");
                                jsonResponse.put("userId", rs.getInt("user_id"));
                                jsonResponse.put("username", rs.getString("username"));
                            } else {
                            	response.setStatus(401);
                                jsonResponse.put("success", false);
                                jsonResponse.put("message", "Invalid username or password");
                            }
                        } else {
                        	response.setStatus(401);
                            jsonResponse.put("success", false);
                            jsonResponse.put("message", "Invalid username or password");
                        }

                        response.getWriter().write(jsonResponse.toString());
                    }
                }
            }
        } catch (Exception e) {
        	response.setStatus(500);
            e.printStackTrace();
            JSONObject errorResponse = new JSONObject();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred during login");
            response.getWriter().write(errorResponse.toString());
        }
    }

    private void handleLogout(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write("{\"success\": true}");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();
        if ("/check-session".equals(pathInfo)) {
            HttpSession session = request.getSession(false);
            if (session != null && session.getAttribute("userId") != null) {
                response.setStatus(HttpServletResponse.SC_OK);
                // Send back some basic user info
                JSONObject jsonResponse = new JSONObject();
                jsonResponse.put("authenticated", true);
                jsonResponse.put("userId", session.getAttribute("userId"));
                response.getWriter().write(jsonResponse.toString());
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"authenticated\": false}");
            }
        }
    }
}