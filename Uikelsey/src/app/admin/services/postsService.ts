import { projectId, publicAnonKey } from '@/lib/supabase-info';
import { AdminPost } from "../types/post";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-604ca09d`;

export const postsService = {
  async getPosts(): Promise<AdminPost[]> {
    const response = await fetch(`${BASE_URL}/posts`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    
    const posts = await response.json();
    
    // Auto-seed if empty (for demo purposes)
    if (Array.isArray(posts) && posts.length === 0) {
      await this.seedPosts();
      // Fetch again
      return this.getPosts();
    }
    
    return posts;
  },

  async getPost(id: string): Promise<AdminPost> {
    const response = await fetch(`${BASE_URL}/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json();
  },

  async createPost(post: Partial<AdminPost>): Promise<AdminPost> {
    const response = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`);
    }

    return response.json();
  },

  async updatePost(id: string, post: Partial<AdminPost>): Promise<AdminPost> {
    const response = await fetch(`${BASE_URL}/posts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.statusText}`);
    }

    return response.json();
  },

  async deletePost(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.statusText}`);
    }
  },

  async seedPosts(): Promise<void> {
    await fetch(`${BASE_URL}/posts/seed`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });
  }
};