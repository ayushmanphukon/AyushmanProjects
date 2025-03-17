package com.package5.profile;

public class Profile {
    private int userId;
    private String username;
    private String fullName;
    private String bio;
    private String email;
    private String profilePictureUrl;
    private boolean isFollowed;
    private String noOfPosts;
    private String followers;
    private String followings;
    


    // Getters and Setters
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
	public boolean isFollowed() {
		return isFollowed;
	}
	public void setFollowed(boolean isFollowed) {
		this.isFollowed = isFollowed;
	}
	public String getFollowers() {
		return followers;
	}
	public void setFollowers(String followers) {
		this.followers = followers;
	}
	public String getNoOfPosts() {
		return noOfPosts;
	}
	public void setNoOfPosts(String noOfPosts) {
		this.noOfPosts = noOfPosts;
	}
	public String getFollowings() {
		return followings;
	}
	public void setFollowings(String followings) {
		this.followings = followings;
	}


}