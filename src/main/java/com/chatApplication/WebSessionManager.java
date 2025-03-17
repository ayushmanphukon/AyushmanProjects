package com.chatApplication;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.websocket.Session;


public class WebSessionManager {
	private static Map<Integer, Session> clients = new ConcurrentHashMap<>();

    public static void addUserSession(int userId, Session session) {
    	if(userId != 0 && session != null) {
    		clients.put(userId, session);
    	}else {
    		System.out.println("userid or session is null");
    	}
    }

    public static Session getUserSession(int userId) {
        return (userId != 0) ? clients.get(userId) : null;
    }

    public static void removeUserSession(int userId) {
    	
    	if(userId != 0) {
        	clients.remove(userId);
    	}else {
    		System.out.println("user id is null");
    	}
    }
}
