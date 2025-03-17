package com.package5.feeds;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import com.package2.signup.User;

@WebServlet("/dashboard")
public class DashboardServlet extends HttpServlet {
    private static final long serialVersionUID = -1456333606704604984L;

	@Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        
        if (user == null) {
            response.sendRedirect("login");
            return;
        }

        // Set the user ID as a request attribute
        request.setAttribute("userId", user.getId());
        
        // Forward to the dashboard page
        request.getRequestDispatcher("/dashboard.html").forward(request, response);
    }
} 