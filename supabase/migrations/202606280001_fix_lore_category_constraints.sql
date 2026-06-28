-- Migration: Add 'lore' category support across story_bible_items, continuity_facts, and bible_item_versions

ALTER TABLE public.story_bible_items 
  DROP CONSTRAINT IF EXISTS story_bible_items_category_check;

ALTER TABLE public.story_bible_items 
  ADD CONSTRAINT story_bible_items_category_check 
  CHECK (category IN ('characters', 'locations', 'factions', 'lore', 'powerSystems', 'magic'));

ALTER TABLE public.continuity_facts 
  DROP CONSTRAINT IF EXISTS continuity_facts_entity_type_check;

ALTER TABLE public.continuity_facts 
  ADD CONSTRAINT continuity_facts_entity_type_check 
  CHECK (entity_type IN ('character', 'location', 'faction', 'lore', 'powerSystem', 'object', 'timeline', 'relationship'));

ALTER TABLE public.bible_item_versions 
  DROP CONSTRAINT IF EXISTS bible_item_versions_category_check;

ALTER TABLE public.bible_item_versions 
  ADD CONSTRAINT bible_item_versions_category_check 
  CHECK (category IN ('characters', 'locations', 'factions', 'lore', 'powerSystems'));
