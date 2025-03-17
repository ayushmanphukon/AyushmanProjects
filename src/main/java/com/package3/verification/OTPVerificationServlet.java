package com.package3.verification;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import org.json.JSONObject;
import java.sql.Connection;
import java.sql.PreparedStatement;

import com.package1.utils.DatabaseConnection;

@WebServlet("/verify-otp")
public class OTPVerificationServlet extends HttpServlet {

    private static final long serialVersionUID = -6164098094661420415L;

	@Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        JSONObject jsonResponse = new JSONObject();

        try {
            // Get the OTP from request
            JSONObject jsonRequest = new JSONObject(request.getReader().readLine());
            String submittedOTP = jsonRequest.getString("otp");

            // Get stored OTP and user email from session
            HttpSession session = request.getSession();
            String storedOTP = (String) session.getAttribute("otp");
            String userEmail = (String) session.getAttribute("userEmail");

            if (storedOTP != null && storedOTP.equals(submittedOTP)) {
                // Update user verification status in database
                updateUserVerificationStatus(userEmail);

                // Clear session attributes
                session.removeAttribute("otp");
                session.removeAttribute("userEmail");

                jsonResponse.put("success", true);
                jsonResponse.put("message", "Email verified successfully");
            } else {
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Invalid OTP");
            }

        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Verification failed");
        }

        response.getWriter().write(jsonResponse.toString());
    }

    private void updateUserVerificationStatus(String email) throws Exception {
        String query = "UPDATE users SET is_verified = true WHERE email = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, email);
            stmt.executeUpdate();
        }
    }
}