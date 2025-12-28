import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    console.log('[v0] Setup started...');
    
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[v0] Checking for existing users...');
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('[v0] List users error:', listError);
      throw listError;
    }

    const ownerExists = users?.some(u => u.email === 'owner@test.com');
    const labourExists = users?.some(u => u.email === 'labour@test.com');

    console.log('[v0] Owner exists:', ownerExists, 'Labour exists:', labourExists);

    let ownerUserId: string | undefined;
    let labourUserId: string | undefined;

    // Create owner if doesn't exist
    if (!ownerExists) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'owner@test.com',
        password: 'Test@12345',
        email_confirm: true,
      });

      if (error) {
        console.error('[v0] Owner creation error:', error);
        throw error;
      }
      ownerUserId = data?.user?.id;
      console.log('[v0] Owner created:', ownerUserId);
    } else {
      ownerUserId = users?.find(u => u.email === 'owner@test.com')?.id;
      console.log('[v0] Owner already exists:', ownerUserId);
    }

    // Create labour if doesn't exist
    if (!labourExists) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'labour@test.com',
        password: 'Test@12345',
        email_confirm: true,
      });

      if (error) {
        console.error('[v0] Labour creation error:', error);
        throw error;
      }
      labourUserId = data?.user?.id;
      console.log('[v0] Labour created:', labourUserId);
    } else {
      labourUserId = users?.find(u => u.email === 'labour@test.com')?.id;
      console.log('[v0] Labour already exists:', labourUserId);
    }

    if (!ownerUserId || !labourUserId) {
      throw new Error('Failed to get user IDs');
    }

    const { error: ownerProfileError } = await supabase
      .from('users')
      .upsert(
        {
          id: ownerUserId,
          email: 'owner@test.com',
          full_name: 'Test Owner',
          role: 'owner',
          is_active: true,
        },
        { onConflict: 'id' }
      );

    if (ownerProfileError) {
      console.error('[v0] Owner profile error:', ownerProfileError);
      throw ownerProfileError;
    }

    const { error: labourProfileError } = await supabase
      .from('users')
      .upsert(
        {
          id: labourUserId,
          email: 'labour@test.com',
          full_name: 'Test Labour',
          role: 'labour',
          is_active: true,
        },
        { onConflict: 'id' }
      );

    if (labourProfileError) {
      console.error('[v0] Labour profile error:', labourProfileError);
      throw labourProfileError;
    }

    console.log('[v0] Setup completed successfully');

    return Response.json({
      success: true,
      message: 'Test users created successfully!',
      details: {
        owner: { email: 'owner@test.com', password: 'Test@12345' },
        labour: { email: 'labour@test.com', password: 'Test@12345' },
      },
    });
  } catch (error: any) {
    console.error('[v0] Setup error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to setup test users',
      },
      { status: 500 }
    );
  }
}
