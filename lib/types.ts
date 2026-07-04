export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithTags extends Post {
  tags: string[];
}

export interface SettingKey {
  default_visibility: 'public' | 'private';
  theme: Theme;
  typography: Typography;
  site_title: string;
  new_post_button_text: string;
}

export type Theme = 'system' | 'light' | 'dark' | 'midnight' | 'evergreen' | 'warm' | 'modern';

export type Typography = 'system' | 'editorial' | 'modern' | 'mono' | 'classic';

export type PostViewMode = 'grid' | 'column' | 'list';

export type PostSortMode = 'newest' | 'oldest' | 'title' | 'updated';
