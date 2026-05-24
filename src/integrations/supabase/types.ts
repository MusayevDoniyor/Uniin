export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json | null
          mode: Database["public"]["Enums"]["ai_mode"]
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          mode: Database["public"]["Enums"]["ai_mode"]
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          mode?: Database["public"]["Enums"]["ai_mode"]
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          participant_ids: string[]
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_ids: string[]
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_ids?: string[]
        }
        Relationships: []
      }
      deadline_reminders: {
        Row: {
          created_at: string
          deadline_at: string
          id: string
          notes: string | null
          reminder_days: number[]
          university_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline_at: string
          id?: string
          notes?: string | null
          reminder_days?: number[]
          university_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline_at?: string
          id?: string
          notes?: string | null
          reminder_days?: number[]
          university_name?: string
          user_id?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount_usd: number
          buyer_id: string
          created_at: string
          deadline_at: string
          id: string
          listing_id: string
          platform_fee_usd: number
          resolved_at: string | null
          seller_id: string
          seller_payout_usd: number
          status: Database["public"]["Enums"]["escrow_status"]
        }
        Insert: {
          amount_usd: number
          buyer_id: string
          created_at?: string
          deadline_at?: string
          id?: string
          listing_id: string
          platform_fee_usd?: number
          resolved_at?: string | null
          seller_id: string
          seller_payout_usd: number
          status?: Database["public"]["Enums"]["escrow_status"]
        }
        Update: {
          amount_usd?: number
          buyer_id?: string
          created_at?: string
          deadline_at?: string
          id?: string
          listing_id?: string
          platform_fee_usd?: number
          resolved_at?: string | null
          seller_id?: string
          seller_payout_usd?: number
          status?: Database["public"]["Enums"]["escrow_status"]
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          attendee_count: number
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          max_attendees: number | null
          room_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          attendee_count?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id: string
          id?: string
          max_attendees?: number | null
          room_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          attendee_count?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          max_attendees?: number | null
          room_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["group_role"] | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"] | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      gu_status_requests: {
        Row: {
          created_at: string | null
          id: string
          proof_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proof_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proof_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gu_universities: {
        Row: {
          country: string | null
          created_at: string | null
          degree_type: string | null
          id: string
          is_primary: boolean | null
          major: string | null
          profile_id: string
          qs_rank: number | null
          university_name: string
          year_admitted: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          degree_type?: string | null
          id?: string
          is_primary?: boolean | null
          major?: string | null
          profile_id: string
          qs_rank?: number | null
          university_name: string
          year_admitted?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          degree_type?: string | null
          id?: string
          is_primary?: boolean | null
          major?: string | null
          profile_id?: string
          qs_rank?: number | null
          university_name?: string
          year_admitted?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gu_universities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_purchases: {
        Row: {
          amount_usd: number | null
          buyer_id: string
          created_at: string | null
          id: string
          listing_id: string
          status: Database["public"]["Enums"]["purchase_status"] | null
        }
        Insert: {
          amount_usd?: number | null
          buyer_id: string
          created_at?: string | null
          id?: string
          listing_id: string
          status?: Database["public"]["Enums"]["purchase_status"] | null
        }
        Update: {
          amount_usd?: number | null
          buyer_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          status?: Database["public"]["Enums"]["purchase_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          delivery_time: string | null
          description: string | null
          escrow_enabled: boolean
          full_content_url: string | null
          id: string
          is_free: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          preview_content: string | null
          preview_percentage: number | null
          price_usd: number | null
          purchases_count: number | null
          screenshot_protected: boolean | null
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"] | null
          tags: string[]
          title: string
          what_included: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          delivery_time?: string | null
          description?: string | null
          escrow_enabled?: boolean
          full_content_url?: string | null
          id?: string
          is_free?: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          preview_content?: string | null
          preview_percentage?: number | null
          price_usd?: number | null
          purchases_count?: number | null
          screenshot_protected?: boolean | null
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          tags?: string[]
          title: string
          what_included?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          delivery_time?: string | null
          description?: string | null
          escrow_enabled?: boolean
          full_content_url?: string | null
          id?: string
          is_free?: boolean | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          preview_content?: string | null
          preview_percentage?: number | null
          price_usd?: number | null
          purchases_count?: number | null
          screenshot_protected?: boolean | null
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          tags?: string[]
          title?: string
          what_included?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          comments_count: number | null
          content: string
          created_at: string | null
          group_id: string | null
          id: string
          impressions_count: number
          likes_count: number | null
          media_urls: string[] | null
          poll_options: Json | null
          post_type: Database["public"]["Enums"]["post_type"] | null
          title: string | null
        }
        Insert: {
          author_id: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          impressions_count?: number
          likes_count?: number | null
          media_urls?: string[] | null
          poll_options?: Json | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          title?: string | null
        }
        Update: {
          author_id?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          impressions_count?: number
          likes_count?: number | null
          media_urls?: string[] | null
          poll_options?: Json | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          viewed_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          viewed_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          viewed_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certificates: string[] | null
          certifications: Json
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          custom_stats: Json
          date_of_birth: string | null
          dream_universities: string[] | null
          extracurricular_items: Json
          extracurriculars: string[] | null
          full_name: string | null
          gender: string | null
          gpa: number | null
          gpa_scale: number | null
          grade: string | null
          id: string
          ielts: number | null
          intended_major: string | null
          interests: string[] | null
          is_open_to_mentoring: boolean
          is_premium: boolean
          is_verified_gu: boolean | null
          onboarding_complete: boolean | null
          phone: string | null
          rank_score: number | null
          sat: number | null
          school_name: string | null
          target_countries: string[] | null
          target_year: number | null
          theme_preference: string
          toefl: number | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certificates?: string[] | null
          certifications?: Json
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_stats?: Json
          date_of_birth?: string | null
          dream_universities?: string[] | null
          extracurricular_items?: Json
          extracurriculars?: string[] | null
          full_name?: string | null
          gender?: string | null
          gpa?: number | null
          gpa_scale?: number | null
          grade?: string | null
          id?: string
          ielts?: number | null
          intended_major?: string | null
          interests?: string[] | null
          is_open_to_mentoring?: boolean
          is_premium?: boolean
          is_verified_gu?: boolean | null
          onboarding_complete?: boolean | null
          phone?: string | null
          rank_score?: number | null
          sat?: number | null
          school_name?: string | null
          target_countries?: string[] | null
          target_year?: number | null
          theme_preference?: string
          toefl?: number | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certificates?: string[] | null
          certifications?: Json
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_stats?: Json
          date_of_birth?: string | null
          dream_universities?: string[] | null
          extracurricular_items?: Json
          extracurriculars?: string[] | null
          full_name?: string | null
          gender?: string | null
          gpa?: number | null
          gpa_scale?: number | null
          grade?: string | null
          id?: string
          ielts?: number | null
          intended_major?: string | null
          interests?: string[] | null
          is_open_to_mentoring?: boolean
          is_premium?: boolean
          is_verified_gu?: boolean | null
          onboarding_complete?: boolean | null
          phone?: string | null
          rank_score?: number | null
          sat?: number | null
          school_name?: string | null
          target_countries?: string[] | null
          target_year?: number | null
          theme_preference?: string
          toefl?: number | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          guest_id: string
          host_id: string
          id: string
          listing_id: string | null
          notes: string | null
          recording_url: string | null
          room_url: string | null
          scheduled_at: string
          session_type: Database["public"]["Enums"]["session_type"] | null
          status: Database["public"]["Enums"]["session_status"] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          guest_id: string
          host_id: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          recording_url?: string | null
          room_url?: string | null
          scheduled_at: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          guest_id?: string
          host_id?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          recording_url?: string | null
          room_url?: string | null
          scheduled_at?: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_endorsements: {
        Row: {
          created_at: string
          endorsed_id: string
          endorser_id: string
          id: string
          skill: string
        }
        Insert: {
          created_at?: string
          endorsed_id: string
          endorser_id: string
          id?: string
          skill: string
        }
        Update: {
          created_at?: string
          endorsed_id?: string
          endorser_id?: string
          id?: string
          skill?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_topups: {
        Row: {
          amount_usd: number
          created_at: string
          id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["topup_status"]
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          id?: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["topup_status"]
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["topup_status"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_usd: number
          created_at: string
          id: string
          pending_usd: number
          total_earned_usd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_usd?: number
          created_at?: string
          id?: string
          pending_usd?: number
          total_earned_usd?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_usd?: number
          created_at?: string
          id?: string
          pending_usd?: number
          total_earned_usd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount_usd: number
          created_at: string
          id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          id?: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_mode: "university_match" | "profile_analyzer" | "essay_coach"
      badge_type:
        | "first_post"
        | "early_adopter"
        | "top_mentor"
        | "hundred_followers"
        | "verified_gu"
        | "marketplace_star"
        | "top_contributor"
      escrow_status: "held" | "released" | "refunded" | "disputed"
      event_status: "upcoming" | "live" | "completed" | "cancelled"
      group_role: "admin" | "member"
      listing_status: "active" | "paused" | "sold"
      listing_type: "full_package" | "essay" | "portfolio" | "chat_call"
      payment_provider: "stripe" | "uzum"
      post_type:
        | "update"
        | "question"
        | "resource"
        | "win"
        | "essay_tip"
        | "article"
        | "poll"
      purchase_status: "pending" | "completed"
      reaction_type: "like" | "insightful" | "congrats" | "support" | "curious"
      session_status: "scheduled" | "live" | "completed" | "cancelled"
      session_type: "video" | "audio" | "chat"
      subscription_plan: "free" | "premium"
      subscription_status: "active" | "cancelled" | "pending"
      topup_status: "pending" | "completed" | "failed"
      user_type: "gu" | "prep"
      withdrawal_status: "pending" | "paid" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_mode: ["university_match", "profile_analyzer", "essay_coach"],
      badge_type: [
        "first_post",
        "early_adopter",
        "top_mentor",
        "hundred_followers",
        "verified_gu",
        "marketplace_star",
        "top_contributor",
      ],
      escrow_status: ["held", "released", "refunded", "disputed"],
      event_status: ["upcoming", "live", "completed", "cancelled"],
      group_role: ["admin", "member"],
      listing_status: ["active", "paused", "sold"],
      listing_type: ["full_package", "essay", "portfolio", "chat_call"],
      payment_provider: ["stripe", "uzum"],
      post_type: [
        "update",
        "question",
        "resource",
        "win",
        "essay_tip",
        "article",
        "poll",
      ],
      purchase_status: ["pending", "completed"],
      reaction_type: ["like", "insightful", "congrats", "support", "curious"],
      session_status: ["scheduled", "live", "completed", "cancelled"],
      session_type: ["video", "audio", "chat"],
      subscription_plan: ["free", "premium"],
      subscription_status: ["active", "cancelled", "pending"],
      topup_status: ["pending", "completed", "failed"],
      user_type: ["gu", "prep"],
      withdrawal_status: ["pending", "paid", "failed"],
    },
  },
} as const
