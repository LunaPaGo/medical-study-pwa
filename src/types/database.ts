export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sync_metadata: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          last_pulled_at: string | null;
          last_pushed_at: string | null;
          pending_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          last_pulled_at?: string | null;
          last_pushed_at?: string | null;
          pending_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          device_id?: string;
          last_pulled_at?: string | null;
          last_pushed_at?: string | null;
          pending_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subtitle: string | null;
          content_json: Json;
          content_html: string;
          folder_id: string | null;
          category_id: string | null;
          specialty: string | null;
          status: 'draft' | 'complete';
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subtitle?: string | null;
          content_json?: Json;
          content_html: string;
          folder_id?: string | null;
          category_id?: string | null;
          specialty?: string | null;
          status?: 'draft' | 'complete';
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          content_json?: Json;
          content_html?: string;
          folder_id?: string | null;
          category_id?: string | null;
          specialty?: string | null;
          status?: 'draft' | 'complete';
          is_favorite?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      topic_tags: {
        Row: {
          topic_id: string;
          tag_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          topic_id: string;
          tag_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          original_filename: string;
          mime_type: string;
          size: number;
          width: number | null;
          height: number | null;
          storage_path: string;
          thumbnail_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          original_filename: string;
          mime_type: string;
          size: number;
          width?: number | null;
          height?: number | null;
          storage_path: string;
          thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          filename?: string;
          original_filename?: string;
          mime_type?: string;
          size?: number;
          width?: number | null;
          height?: number | null;
          storage_path?: string;
          thumbnail_path?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      attachment_links: {
        Row: {
          id: string;
          user_id: string;
          attachment_id: string;
          owner_type: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          attachment_id: string;
          owner_type: string;
          owner_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      topic_attachments: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          attachment_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          attachment_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
