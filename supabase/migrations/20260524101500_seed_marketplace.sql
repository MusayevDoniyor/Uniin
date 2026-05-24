DO $$
DECLARE
  v_seller_id UUID;
  v_user_id UUID := 'e8ea2103-6e3e-4d43-9828-d1cfd21f8a84';
BEGIN
  -- 1. If no profiles exist, insert a mock auth user
  IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    INSERT INTO auth.users (
      id, 
      instance_id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      is_super_admin, 
      role,
      aud
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'seller.gu@example.com',
      '$2a$10$abcdefghijklmnopqrstuv', -- mock hash
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"G.U. Seller Mock"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 2. Select the seller profile ID
  -- First try the profile that has id '6afc4349-a040-464f-9e1e-c9987c7e5495'
  SELECT id INTO v_seller_id FROM public.profiles WHERE id = '6afc4349-a040-464f-9e1e-c9987c7e5495';
  
  -- If not found, try the first profile where user_type = 'gu'
  IF v_seller_id IS NULL THEN
    SELECT id INTO v_seller_id FROM public.profiles WHERE user_type = 'gu' LIMIT 1;
  END IF;
  
  -- If not found, get any profile
  IF v_seller_id IS NULL THEN
    SELECT id INTO v_seller_id FROM public.profiles LIMIT 1;
  END IF;

  -- 3. Ensure the seller profile has user_type = 'gu' so it shows up correctly in the UI
  UPDATE public.profiles SET user_type = 'gu' WHERE id = v_seller_id;

  -- 4. Insert seed listings if they don't exist yet
  -- Listing 1: Harvard Admitted Essay Package
  IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'Harvard Admitted Essay Package (Common App + Supplements)') THEN
    INSERT INTO public.marketplace_listings (
      seller_id, title, description, listing_type, price_usd, is_free, 
      preview_content, tags, what_included, delivery_time, escrow_enabled
    ) VALUES (
      v_seller_id,
      'Harvard Admitted Essay Package (Common App + Supplements)',
      'Complete application essays for Harvard College, admitted class of 2028. Includes the main Common App personal statement (on overcoming adversity in coding) and 3 supplement essays. Annotated with feedback from admissions consultants.',
      'essay',
      24.90,
      false,
      'Growing up, I believed computers were deterministic. You write code, it runs, it produces an output. But as I sat in the dim light of my bedroom, watching a recursion error crash my system for the tenth time, I realized...',
      ARRAY['harvard', 'ivy-league', 'essay', 'computer-science', 'scholarship'],
      '• Main Common App Essay' || CHR(10) || '• 3 Supplement Essays' || CHR(10) || '• Advisor feedback comments' || CHR(10) || '• Brainstorming notes',
      'Instant',
      true
    );
  END IF;

  -- Listing 2: MIT CS Maker Portfolio
  IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'MIT Admitted CS Maker Portfolio (Admitted 2024)') THEN
    INSERT INTO public.marketplace_listings (
      seller_id, title, description, listing_type, price_usd, is_free, 
      preview_content, tags, what_included, delivery_time, escrow_enabled
    ) VALUES (
      v_seller_id,
      'MIT Admitted CS Maker Portfolio (Admitted 2024)',
      'The exact research and maker portfolio submitted to MIT for CS. Includes project documentation, abstract of the machine learning research paper, and link to the submission video template.',
      'portfolio',
      29.90,
      false,
      'Project 1: Neuro-Assist. An EEG-based assistive keyboard interface. Built using Python, TensorFlow, and custom hardware. In this slide, I document the neural network architecture used to classify motor imagery...',
      ARRAY['mit', 'portfolio', 'maker', 'computer-science', 'research'],
      '• Research paper abstract' || CHR(10) || '• Maker portfolio PDF (12 slides)' || CHR(10) || '• Project source code link' || CHR(10) || '• Video presentation script',
      'Instant',
      true
    );
  END IF;

  -- Listing 3: 1:1 Ivy League Admissions Coaching Session
  IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = '1:1 Ivy League Admissions & Essay Review Call') THEN
    INSERT INTO public.marketplace_listings (
      seller_id, title, description, listing_type, price_usd, is_free, 
      preview_content, tags, what_included, delivery_time, escrow_enabled
    ) VALUES (
      v_seller_id,
      '1:1 Ivy League Admissions & Essay Review Call',
      'A 45-minute live video call with an Ivy League student. We will review your application profile, brainstorm essay topics, and plan your extracurricular roadmap. Followed by a written feedback report.',
      'chat_call',
      45.00,
      false,
      'During this call, we will analyze your current high school profile and map it against target universities. You will receive direct, actionable feedback on how to stand out in the crowded applicant pool...',
      ARRAY['mentorship', 'coaching', 'essay-review', 'consultation'],
      '• 45-minute 1:1 Zoom/Google Meet call' || CHR(10) || '• Profile review (GPA, SAT, ECs)' || CHR(10) || '• Essay topic brainstorming' || CHR(10) || '• Written action plan document',
      '3 days',
      true
    );
  END IF;

  -- Listing 4: Stanford Admissions Full Package
  IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'Stanford Complete Application Package (CS Major)') THEN
    INSERT INTO public.marketplace_listings (
      seller_id, title, description, listing_type, price_usd, is_free, 
      preview_content, tags, what_included, delivery_time, escrow_enabled
    ) VALUES (
      v_seller_id,
      'Stanford Complete Application Package (CS Major)',
      'The complete, unabridged application package submitted to Stanford University. Includes transcripts, SAT/IELTS scores, full extracurricular listing with descriptions, and all Stanford short questions + essays.',
      'full_package',
      49.90,
      false,
      'Stanford Short Essay: What matters most to you and why? For me, the answer lies in the empty spaces between lines of code. It is the silence that follows a compiled script...',
      ARRAY['stanford', 'full-package', 'ivy-league', 'admitted', 'computer-science'],
      '• Main Common App essay' || CHR(10) || '• 11 Stanford short questions/essays' || CHR(10) || '• Full extracurricular activity list' || CHR(10) || '• SAT/IELTS score breakdown',
      'Instant',
      true
    );
  END IF;

  -- Listing 5: IELTS 8.5 Speaking & Writing Strategy Guide
  IF NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'IELTS 8.5 Speaking & Writing Strategy Guide') THEN
    INSERT INTO public.marketplace_listings (
      seller_id, title, description, listing_type, price_usd, is_free, 
      preview_content, tags, what_included, delivery_time, escrow_enabled
    ) VALUES (
      v_seller_id,
      'IELTS 8.5 Speaking & Writing Strategy Guide',
      'A self-study prep guide designed for students aiming for band 7.5 to 8.5. Contains sample speaking responses for parts 1-3, high-scoring essay structures for task 1 and task 2, and advanced vocabulary lists.',
      'full_package',
      14.90,
      false,
      'IELTS Writing Task 2 Structure: Introduction (Paraphrase prompt + thesis statement), Body Paragraph 1 (Topic sentence + explanation + example), Body Paragraph 2...',
      ARRAY['ielts', 'test-prep', 'english', 'study-guide', 'scholarship'],
      '• IELTS Writing task 1+2 templates' || CHR(10) || '• Band 9 speaking answer transcripts' || CHR(10) || '• Topic-specific vocabulary sheet' || CHR(10) || '• Error correction checklist',
      'Instant',
      true
    );
  END IF;

END $$;
