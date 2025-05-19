from supabase import create_client
from app.config.settings import settings

supabase = create_client(settings.supabase_url, settings.supabase_key)

def get_supabase():
    return supabase
