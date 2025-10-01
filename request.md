To the wellness page, please add a form below that allows users to view and edit content from the following record fields.  Please put it as its own section above the Health and Wellness Resources section.  Please use the CRUD operation and form display logic from the repo screen as a template.

- [x]  Add mutable form to Wellness page
    - goals
    - status_progress
    - fav_activities
    - misc_info (<2000 chars)


    db schema:

    create table public.user_wellness (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  goals text null,
  status_progress text null,
  fav_activities text null,
  misc_info text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_wellness_pkey primary key (id),
  constraint user_wellness_user_id_key unique (user_id),
  constraint user_wellness_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_wellness_user_id on public.user_wellness using btree (user_id) TABLESPACE pg_default;

create trigger trigger_update_user_wellness_updated_at BEFORE
update on user_wellness for EACH row
execute FUNCTION update_user_wellness_updated_at ();