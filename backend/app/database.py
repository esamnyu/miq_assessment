from app.db.supabase_client import get_supabase

# This function is maintained for compatibility
def get_session():
    supabase = get_supabase()
    yield supabase

# This function can be called during startup
def create_db_and_tables():
    # With Supabase, tables are created in the SQL editor
    # This function is kept for compatibility
    pass
