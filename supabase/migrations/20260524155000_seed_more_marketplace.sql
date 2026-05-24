DO $$
DECLARE
  v_doniyor_id UUID;
  v_musayev_id UUID;
  v_sherzod_id UUID;
BEGIN
  -- Find profiles by username
  SELECT id INTO v_doniyor_id FROM public.profiles WHERE username = 'doniyor';
  SELECT id INTO v_musayev_id FROM public.profiles WHERE username = 'musayev-doniyor';
  SELECT id INTO v_sherzod_id FROM public.profiles WHERE username = 'sherzod-bobojonov1';

  -- Fallbacks if usernames don't match, search by full_name or id
  IF v_doniyor_id IS NULL THEN
    SELECT id INTO v_doniyor_id FROM public.profiles WHERE id = '60000b65-9781-4628-870f-2b5283200876';
  END IF;
  IF v_musayev_id IS NULL THEN
    SELECT id INTO v_musayev_id FROM public.profiles WHERE id = '6afc4349-a040-464f-9e1e-c9987c7e5495';
  END IF;
  IF v_sherzod_id IS NULL THEN
    SELECT id INTO v_sherzod_id FROM public.profiles WHERE id = 'cd61482f-ad0b-4af2-af5b-596d3468e7ba';
  END IF;

  -- Ensure they are set to 'gu' type so they can create listings
  IF v_doniyor_id IS NOT NULL THEN
    UPDATE public.profiles SET user_type = 'gu' WHERE id = v_doniyor_id;
  END IF;
  IF v_musayev_id IS NOT NULL THEN
    UPDATE public.profiles SET user_type = 'gu' WHERE id = v_musayev_id;
  END IF;
  IF v_sherzod_id IS NOT NULL THEN
    UPDATE public.profiles SET user_type = 'gu' WHERE id = v_sherzod_id;
  END IF;

  -- Listings for Doniyor (SAT 1600, IELTS 8.05)
  IF v_doniyor_id IS NOT NULL THEN
    -- Listing 1: Stanford CS & AI Full Application Package
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_doniyor_id AND title = 'Stanford CS & AI Full Application Package (SAT 1600, IELTS 8.0)') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_doniyor_id,
        'Stanford CS & AI Full Application Package (SAT 1600, IELTS 8.0)',
        'Complete application package for Stanford CS. Includes the main Common App essay on overcoming recursion errors, short answers, transcripts, and extracurricular list.',
        'full_package',
        49.99,
        false,
        'Stanford Short Essay: What matters most to you and why? For me, it is the quiet recursion. The process of breaking down a large, overwhelming problem into smaller, solvable pieces...',
        ARRAY['stanford', 'computer-science', 'essay', 'ivy-league'],
        '• Main Common App Essay' || CHR(10) || '• 11 Stanford short prompts' || CHR(10) || '• Extracurricular descriptions' || CHR(10) || '• SAT & IELTS strategy notes',
        'Instant',
        true
      );
    END IF;

    -- Listing 2: 1:1 SAT Math & Reading 800 Prep Coaching Session
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_doniyor_id AND title = '1:1 SAT Math & Reading 800 Prep Coaching Session') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_doniyor_id,
        '1:1 SAT Math & Reading 800 Prep Coaching Session',
        'A 45-minute live consultation session to review your SAT preparation strategy. We will go over key tips to score a perfect 800 on Math and Reading.',
        'chat_call',
        35.00,
        false,
        'During this session, we will break down advanced SAT question types, analyze your weak spots, and create a targeted study plan. I will show you how to pacing yourself...',
        ARRAY['sat-prep', 'coaching', '1-on-1', 'tutoring'],
        '• 45-minute video call' || CHR(10) || '• Custom study schedule' || CHR(10) || '• Exclusive practice questions list',
        '3 days',
        true
      );
    END IF;
  END IF;

  -- Listings for Musayev Doniyor (SAT 1580, IELTS 8.0)
  IF v_musayev_id IS NOT NULL THEN
    -- Listing 3: Harvard Supplemental Essays - Tips & Annotated Samples
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_musayev_id AND title = 'Harvard Supplemental Essays - Tips & Annotated Samples') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_musayev_id,
        'Harvard Supplemental Essays - Tips & Annotated Samples',
        'A collection of my successful Harvard supplemental essays, annotated with specific commentary on why they worked and advice on how to structure your answers.',
        'essay',
        19.99,
        false,
        'Harvard Prompt: Briefly elaborate on one of your extracurricular activities. My answer focused on co-building Uniin. It wasn''t just about coding; it was about community...',
        ARRAY['harvard', 'essay-review', 'admissions', 'ivy-league'],
        '• 3 annotated supplement essays' || CHR(10) || '• Writing guidelines checklist' || CHR(10) || '• Dos and Don''ts for Harvard',
        'Instant',
        true
      );
    END IF;

    -- Listing 4: 1:1 College List & Extracurricular Strategy Call
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_musayev_id AND title = '1:1 College List & Extracurricular Strategy Call') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_musayev_id,
        '1:1 College List & Extracurricular Strategy Call',
        'A live 1-on-1 session to build your perfect college list (safety, target, reach) and structure your extracurricular portfolio for maximum impact.',
        'chat_call',
        29.99,
        false,
        'We will map out your profile against major universities, determine where you have the highest chance of receiving full scholarships, and design a standout project idea...',
        ARRAY['college-list', 'mentorship', 'extracurriculars', 'scholarship'],
        '• 45-minute live call' || CHR(10) || '• Custom college list document' || CHR(10) || '• Extracurricular roadmap',
        '3 days',
        true
      );
    END IF;
  END IF;

  -- Listings for Sherzod Bobojonov (GPA 4.7, IELTS 7.5)
  IF v_sherzod_id IS NOT NULL THEN
    -- Listing 5: Stipendium Hungaricum Scholarship Admitted Essay Package
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_sherzod_id AND title = 'Stipendium Hungaricum Scholarship Admitted Essay Package') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_sherzod_id,
        'Stipendium Hungaricum Scholarship Admitted Essay Package',
        'The exact motivational letter and study plan submitted for the Stipendium Hungaricum Scholarship (Hungary). Admitted to study Computer Science.',
        'essay',
        24.99,
        false,
        'Motivation Letter Excerpt: My desire to study in Hungary stems from its rich history of scientific innovation. From the Rubik''s cube to advanced computing, Hungary has always...',
        ARRAY['hungary', 'stipendium-hungaricum', 'scholarship', 'europe'],
        '• Admitted Motivational Letter' || CHR(10) || '• Study plan template' || CHR(10) || '• Document preparation guide',
        'Instant',
        true
      );
    END IF;

    -- Listing 6: National University of Singapore (NUS) Admission Strategy Portfolio
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_sherzod_id AND title = 'National University of Singapore (NUS) Admission Strategy Portfolio') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_sherzod_id,
        'National University of Singapore (NUS) Admission Strategy Portfolio',
        'Comprehensive strategy portfolio outlining the admission requirements, successful profile statistics, and academic roadmap for the National University of Singapore.',
        'portfolio',
        39.99,
        false,
        'NUS Admissions Guide: Unlike US colleges, Singaporean universities heavily prioritize academic rigour and standardized tests. Here is how I structured my GPA and SAT score...',
        ARRAY['nus', 'singapore', 'portfolio', 'admissions-strategy'],
        '• NUS Admission roadmap guide' || CHR(10) || '• Admitted student profile samples' || CHR(10) || '• Interview prep template',
        'Instant',
        true
      );
    END IF;

    -- Listing 7: 1:1 Singapore & Hungary University Admissions Mentorship Call
    IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id = v_sherzod_id AND title = '1:1 Singapore & Hungary University Admissions Mentorship Call') THEN
      INSERT INTO public.marketplace_listings (
        seller_id, title, description, listing_type, price_usd, is_free, 
        preview_content, tags, what_included, delivery_time, escrow_enabled
      ) VALUES (
        v_sherzod_id,
        '1:1 Singapore & Hungary University Admissions Mentorship Call',
        'A 30-minute consultation call focusing on how to apply for scholarships in Hungary (Stipendium Hungaricum) and get admitted to top universities in Singapore.',
        'chat_call',
        15.00,
        false,
        'We will cover the document checklist, interview process, and visa requirements for studying in Budapest or Singapore. I will share my personal tips on winning...',
        ARRAY['hungary', 'singapore', 'mentorship', 'scholarships'],
        '• 30-minute Zoom call' || CHR(10) || '• Application checklist PDF' || CHR(10) || '• Recommended list of universities',
        '1 day',
        true
      );
    END IF;
  END IF;

END $$;
