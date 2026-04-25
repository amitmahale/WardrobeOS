export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          climate_region: string | null;
          default_dress_level: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          climate_region?: string | null;
          default_dress_level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      closets: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          slug: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          slug?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["closets"]["Insert"]>;
        Relationships: [];
      };
      closet_members: {
        Row: {
          id: string;
          closet_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          created_at: string;
        };
        Insert: {
          id?: string;
          closet_id: string;
          user_id: string;
          role?: "owner" | "editor" | "viewer";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["closet_members"]["Insert"]>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          closet_id: string;
          wearer_profile_id: string | null;
          name: string;
          category: string;
          subcategory: string | null;
          primary_color: string;
          secondary_color: string | null;
          pattern: string | null;
          material: string | null;
          warmth: number;
          formality: number;
          seasons: string[];
          occasions: string[];
          fit_notes: string | null;
          brand: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          currency: string | null;
          wear_count: number;
          last_worn_at: string | null;
          status: "active" | "stored" | "donated" | "archived";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          closet_id: string;
          wearer_profile_id?: string | null;
          name: string;
          category: string;
          subcategory?: string | null;
          primary_color: string;
          secondary_color?: string | null;
          pattern?: string | null;
          material?: string | null;
          warmth?: number;
          formality?: number;
          seasons?: string[];
          occasions?: string[];
          fit_notes?: string | null;
          brand?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          currency?: string | null;
          wear_count?: number;
          last_worn_at?: string | null;
          status?: "active" | "stored" | "donated" | "archived";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [];
      };
      item_images: {
        Row: {
          id: string;
          item_id: string;
          original_path: string;
          display_path: string | null;
          thumb_path: string | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          size_bytes: number | null;
          checksum: string | null;
          processing_status: "pending" | "processing" | "ready" | "failed";
          processing_error: string | null;
          ai_suggestion_status: "not_requested" | "pending" | "ready" | "failed";
          average_color_hex: string | null;
          ai_suggestions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          original_path: string;
          display_path?: string | null;
          thumb_path?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          checksum?: string | null;
          processing_status?: "pending" | "processing" | "ready" | "failed";
          processing_error?: string | null;
          ai_suggestion_status?: "not_requested" | "pending" | "ready" | "failed";
          average_color_hex?: string | null;
          ai_suggestions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["item_images"]["Insert"]>;
        Relationships: [];
      };
      saved_outfits: {
        Row: {
          id: string;
          closet_id: string;
          name: string | null;
          source: "manual" | "recommendation";
          occasion: string | null;
          season: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          closet_id: string;
          name?: string | null;
          source?: "manual" | "recommendation";
          occasion?: string | null;
          season?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_outfits"]["Insert"]>;
        Relationships: [];
      };
      saved_outfit_items: {
        Row: {
          id: string;
          outfit_id: string;
          item_id: string;
          slot: string;
        };
        Insert: {
          id?: string;
          outfit_id: string;
          item_id: string;
          slot: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_outfit_items"]["Insert"]>;
        Relationships: [];
      };
      recommendation_feedback: {
        Row: {
          id: string;
          closet_id: string;
          target_type: "outfit_recommendation" | "purchase_recommendation";
          target_key: string;
          feedback: "thumbs_up" | "thumbs_down" | "saved" | "wore" | "dismissed";
          note: string | null;
          context: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          closet_id: string;
          target_type: "outfit_recommendation" | "purchase_recommendation";
          target_key: string;
          feedback: "thumbs_up" | "thumbs_down" | "saved" | "wore" | "dismissed";
          note?: string | null;
          context?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendation_feedback"]["Insert"]>;
        Relationships: [];
      };
      purchase_candidate_library: {
        Row: {
          key: string;
          name: string;
          category: string;
          subcategory: string | null;
          default_color: string | null;
          default_pattern: string | null;
          default_material: string | null;
          seasons: string[];
          occasions: string[];
          formality: number;
          warmth: number;
          price_band: string | null;
          metadata: Json;
        };
        Insert: never;
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
