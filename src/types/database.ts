export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          status: 'pending' | 'approved';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          status?: 'pending' | 'approved';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          status?: 'pending' | 'approved';
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
          definition_epidemiology_json: Json;
          definition_epidemiology_html: string;
          clinical_json: Json;
          clinical_html: string;
          diagnosis_criteria_json: Json;
          diagnosis_criteria_html: string;
          treatment_management_json: Json;
          treatment_management_html: string;
          differential_diagnosis_json: Json;
          differential_diagnosis_html: string;
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
          definition_epidemiology_json?: Json;
          definition_epidemiology_html?: string;
          clinical_json?: Json;
          clinical_html?: string;
          diagnosis_criteria_json?: Json;
          diagnosis_criteria_html?: string;
          treatment_management_json?: Json;
          treatment_management_html?: string;
          differential_diagnosis_json?: Json;
          differential_diagnosis_html?: string;
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
          definition_epidemiology_json?: Json;
          definition_epidemiology_html?: string;
          clinical_json?: Json;
          clinical_html?: string;
          diagnosis_criteria_json?: Json;
          diagnosis_criteria_html?: string;
          treatment_management_json?: Json;
          treatment_management_html?: string;
          differential_diagnosis_json?: Json;
          differential_diagnosis_html?: string;
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
      topic_relations: {
        Row: {
          id: string;
          user_id: string;
          source_topic_id: string;
          target_topic_id: string;
          relation_type: 'related' | 'differential_diagnosis' | 'complication' | 'cause' | 'treatment' | 'pharmacology' | 'procedure' | 'other';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_topic_id: string;
          target_topic_id: string;
          relation_type?: 'related' | 'differential_diagnosis' | 'complication' | 'cause' | 'treatment' | 'pharmacology' | 'procedure' | 'other';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source_topic_id?: string;
          target_topic_id?: string;
          relation_type?: 'related' | 'differential_diagnosis' | 'complication' | 'cause' | 'treatment' | 'pharmacology' | 'procedure' | 'other';
          updated_at?: string;
        };
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
      medications: {
        Row: {
          id: string;
          user_id: string;
          generic_name: string | null;
          pharmacologic_group: string | null;
          pharmacologic_subgroup: string | null;
          short_description: string | null;
          status: 'draft' | 'complete';
          is_favorite: boolean;
          mechanism_of_action: Json;
          therapeutic_targets: Json;
          pharmacologic_effects: Json;
          indications: Json;
          clinical_application: Json;
          adult_dose: Json;
          pediatric_dose: Json;
          dose_and_dilution: Json;
          administration: Json;
          onset_time: Json;
          transport: Json;
          metabolism: Json;
          elimination: Json;
          adverse_effects: Json;
          contraindications: Json;
          antidote: Json;
          personal_notes: Json;
          bibliography: Json;
          classification_mechanism_json: Json;
          classification_mechanism_html: string;
          clinical_uses_json: Json;
          clinical_uses_html: string;
          dosing_administration_json: Json;
          dosing_administration_html: string;
          safety_json: Json;
          safety_html: string;
          search_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          generic_name?: string | null;
          pharmacologic_group?: string | null;
          pharmacologic_subgroup?: string | null;
          short_description?: string | null;
          status?: 'draft' | 'complete';
          is_favorite?: boolean;
          mechanism_of_action?: Json;
          therapeutic_targets?: Json;
          pharmacologic_effects?: Json;
          indications?: Json;
          clinical_application?: Json;
          adult_dose?: Json;
          pediatric_dose?: Json;
          dose_and_dilution?: Json;
          administration?: Json;
          onset_time?: Json;
          transport?: Json;
          metabolism?: Json;
          elimination?: Json;
          adverse_effects?: Json;
          contraindications?: Json;
          antidote?: Json;
          personal_notes?: Json;
          bibliography?: Json;
          classification_mechanism_json?: Json;
          classification_mechanism_html?: string;
          clinical_uses_json?: Json;
          clinical_uses_html?: string;
          dosing_administration_json?: Json;
          dosing_administration_html?: string;
          safety_json?: Json;
          safety_html?: string;
          search_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          generic_name?: string | null;
          pharmacologic_group?: string | null;
          pharmacologic_subgroup?: string | null;
          short_description?: string | null;
          status?: 'draft' | 'complete';
          is_favorite?: boolean;
          mechanism_of_action?: Json;
          therapeutic_targets?: Json;
          pharmacologic_effects?: Json;
          indications?: Json;
          clinical_application?: Json;
          adult_dose?: Json;
          pediatric_dose?: Json;
          dose_and_dilution?: Json;
          administration?: Json;
          onset_time?: Json;
          transport?: Json;
          metabolism?: Json;
          elimination?: Json;
          adverse_effects?: Json;
          contraindications?: Json;
          antidote?: Json;
          personal_notes?: Json;
          bibliography?: Json;
          classification_mechanism_json?: Json;
          classification_mechanism_html?: string;
          clinical_uses_json?: Json;
          clinical_uses_html?: string;
          dosing_administration_json?: Json;
          dosing_administration_html?: string;
          safety_json?: Json;
          safety_html?: string;
          search_text?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medication_tags: {
        Row: {
          medication_id: string;
          tag_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          medication_id: string;
          tag_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      medication_attachments: {
        Row: {
          id: string;
          user_id: string;
          medication_id: string;
          attachment_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          medication_id: string;
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
