import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[v0] Profile fetch error:', error);
      return Response.json({ error: error.message }, { status: 400 })
    }

    if (!profile) {
      console.log('[v0] Profile not found, returning default for user:', user.id);
      const role = user.email?.includes('owner') ? 'owner' : 'labour';
      return Response.json({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return Response.json(profile)
  } catch (error: any) {
    console.error('[v0] Route error:', error);
    return Response.json({ error: error.message }, { status: 500 })
  }
}
