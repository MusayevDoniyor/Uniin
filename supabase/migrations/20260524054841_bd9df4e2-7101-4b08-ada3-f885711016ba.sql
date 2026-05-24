
-- 1. Add username to profiles (LinkedIn-style handle)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Helper: slugify text -> lowercase, alphanumeric + dash
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(regexp_replace(regexp_replace(coalesce(input,''), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));
$$;

-- Generate a unique username from a base text
CREATE OR REPLACE FUNCTION public.generate_unique_username(base text)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  s text := public.slugify(base);
  candidate text;
  i int := 0;
BEGIN
  IF s IS NULL OR length(s) < 3 THEN s := 'user' || substr(md5(random()::text),1,6); END IF;
  candidate := s;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    i := i + 1;
    candidate := s || i::text;
    IF i > 50 THEN candidate := s || substr(md5(random()::text),1,5); EXIT; END IF;
  END LOOP;
  RETURN candidate;
END $$;

-- Backfill usernames for existing profiles
UPDATE public.profiles SET username = public.generate_unique_username(coalesce(full_name, 'user'))
WHERE username IS NULL;

-- Trigger to auto-generate username on insert/update if missing
CREATE OR REPLACE FUNCTION public.ensure_profile_username()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.username IS NULL OR length(trim(NEW.username)) = 0 THEN
    NEW.username := public.generate_unique_username(coalesce(NEW.full_name, 'user'));
  ELSE
    NEW.username := public.slugify(NEW.username);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_profile_username ON public.profiles;
CREATE TRIGGER trg_ensure_profile_username
BEFORE INSERT OR UPDATE OF username, full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_username();

-- 2. Add slug to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS slug text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups(slug);

CREATE OR REPLACE FUNCTION public.generate_unique_group_slug(base text)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  s text := public.slugify(base);
  candidate text;
  i int := 0;
BEGIN
  IF s IS NULL OR length(s) < 2 THEN s := 'group-' || substr(md5(random()::text),1,6); END IF;
  candidate := s;
  WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = candidate) LOOP
    i := i + 1;
    candidate := s || '-' || i::text;
    IF i > 50 THEN candidate := s || '-' || substr(md5(random()::text),1,5); EXIT; END IF;
  END LOOP;
  RETURN candidate;
END $$;

UPDATE public.groups SET slug = public.generate_unique_group_slug(name) WHERE slug IS NULL;

CREATE OR REPLACE FUNCTION public.ensure_group_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.generate_unique_group_slug(NEW.name);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_group_slug ON public.groups;
CREATE TRIGGER trg_ensure_group_slug
BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.ensure_group_slug();

-- 3. Comment replies (LinkedIn-style nested)
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_id);

-- 4. Group posts: link posts to groups already exists via group_id. Add helpful index.
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts(group_id);
