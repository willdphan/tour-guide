import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

async function saveFlowchart(flowchartData: any, name: string) {
    // get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
//   if no user is found, throw an error
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('flowcharts')
    //  insert or update
    .upsert({
      user_id: user.id,
      name: name,
      data: flowchartData,
      updated_at: new Date().toISOString(),
    }, {
        // if user exists, update the flowchart
      onConflict: 'user_id,name',
    })
    .select();

  if (error) {
    console.error('Error saving flowchart:', error);
    throw error;
  }

  return data;
}


export async function loadFlowchart(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
  
    const { data, error } = await supabase
      .from('flowcharts')
      .select('data')
      .eq('user_id', user.id)
      .eq('name', name)
      .single();
  
    if (error) {
      console.error('Error loading flowchart:', error);
      throw error;
    }
  
    return data?.data;
  }

  export async function listFlowcharts() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
  
    const { data, error } = await supabase
      .from('flowcharts')
      .select('name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error listing flowcharts:', error);
      throw error;
    }
  
    return data;
  }

  export async function deleteFlowchart(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
  
    const { error } = await supabase
      .from('flowcharts')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name);
  
    if (error) {
      console.error('Error deleting flowchart:', error);
      throw error;
    }
  }