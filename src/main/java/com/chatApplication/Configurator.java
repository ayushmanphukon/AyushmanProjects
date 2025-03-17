package com.chatApplication;

import java.util.List;
import java.util.Map;

import javax.websocket.HandshakeResponse;
import javax.websocket.server.HandshakeRequest;
import javax.websocket.server.ServerEndpointConfig;

public class Configurator extends ServerEndpointConfig.Configurator {
    @Override
    public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response) {
        Map<String, List<String>> parameters = request.getParameterMap();
        if (parameters.containsKey("userId")) {
            String userId = parameters.get("userId").get(0);
            sec.getUserProperties().put("userId", userId);
        }
    }
}