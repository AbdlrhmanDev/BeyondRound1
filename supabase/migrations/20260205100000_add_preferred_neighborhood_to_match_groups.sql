-- Add preferred_neighborhood to match_groups so group members can choose where to meet
ALTER TABLE public.match_groups 
  ADD COLUMN IF NOT EXISTS preferred_neighborhood TEXT;

COMMENT ON COLUMN public.match_groups.preferred_neighborhood IS 'Neighborhood/area chosen by the group for their meetup (e.g. Mitte, Kreuzberg)';

-- Allow group members to update preferred_neighborhood (for choosing meetup place together)
DROP POLICY IF EXISTS "Group members can update preferred neighborhood" ON public.match_groups;
CREATE POLICY "Group members can update preferred neighborhood" ON public.match_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = match_groups.id
        AND group_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = match_groups.id
        AND group_members.user_id = auth.uid()
    )
  );
