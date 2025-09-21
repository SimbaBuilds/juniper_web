Let's pivot.  Instead of attempting to fetch the
  actualy files, let's just allow export directly from
  the content filed of the record_pages table. Specs:

  - The exported file should still be a pdf. 
  - The pdf should include metadata about the parent medical record from medical_records table
  - The individual page content does not need to be on separate pages in the pdf, but the original page number from the page_number field of record_pages should be indicated 

  Use existing pdf generation infrastructure used by the repository page.

  Please create an implementation plan.

  DB Schemas:

  create table public.medical_records (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  original_file_type text not null,
  original_filename text null,
  file_size_bytes integer null,
  num_pages integer not null,
  status text not null default 'processing'::text,
  upload_url text null,
  summary text null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint medical_records_pkey primary key (id),
  constraint medical_records_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint medical_records_status_check check (
    (
      status = any (
        array[
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_medical_records_user_id on public.medical_records using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_medical_records_status on public.medical_records using btree (status) TABLESPACE pg_default;

create trigger update_medical_records_updated_at BEFORE
update on medical_records for EACH row
execute FUNCTION update_updated_at_column ();
---------------
create table public.record_pages (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  medical_record_id uuid not null,
  page_number integer not null,
  summary text null,
  content text not null,
  embedding public.vector null,
  processed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint record_pages_pkey primary key (id),
  constraint record_pages_medical_record_id_page_number_key unique (medical_record_id, page_number),
  constraint record_pages_medical_record_id_fkey foreign KEY (medical_record_id) references medical_records (id) on delete CASCADE,
  constraint record_pages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_record_pages_user_id on public.record_pages using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_record_pages_medical_record_id on public.record_pages using btree (medical_record_id) TABLESPACE pg_default;

create trigger update_record_pages_updated_at BEFORE
update on record_pages for EACH row
execute FUNCTION update_updated_at_column ();