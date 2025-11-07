-- Migration: add_word_count_sync_triggers
-- Created at: 1762482523
-- Description: Add triggers to automatically sync word_collections.word_count with actual word count in words table

-- Create function to update word count for a collection
CREATE OR REPLACE FUNCTION update_collection_word_count()
RETURNS TRIGGER AS $$
DECLARE
  target_collection_id UUID;
  new_count INTEGER;
BEGIN
  -- Determine which collection_id to update based on the operation
  IF TG_OP = 'DELETE' THEN
    -- For DELETE operations, use the old record's collection_id
    target_collection_id := OLD.collection_id;
  ELSE
    -- For INSERT and UPDATE operations, use the new record's collection_id
    target_collection_id := NEW.collection_id;
  END IF;

  -- Calculate the current word count for this collection
  SELECT COUNT(*) INTO new_count
  FROM words
  WHERE collection_id = target_collection_id;

  -- Update the word_count in word_collections table
  UPDATE word_collections
  SET word_count = new_count,
      updated_at = NOW()
  WHERE id = target_collection_id;

  -- Return the appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS sync_word_count_on_insert ON words;
CREATE TRIGGER sync_word_count_on_insert
  AFTER INSERT ON words
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_word_count();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS sync_word_count_on_update ON words;
CREATE TRIGGER sync_word_count_on_update
  AFTER UPDATE ON words
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_word_count();

-- Create trigger for DELETE operations
DROP TRIGGER IF EXISTS sync_word_count_on_delete ON words;
CREATE TRIGGER sync_word_count_on_delete
  AFTER DELETE ON words
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_word_count();

-- Also create a function to recalculate word counts for all collections
-- This can be useful for data migration or fixing inconsistencies
CREATE OR REPLACE FUNCTION recalculate_all_word_counts()
RETURNS void AS $$
BEGIN
  UPDATE word_collections
  SET word_count = (
    SELECT COUNT(*)
    FROM words
    WHERE words.collection_id = word_collections.id
  ),
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
