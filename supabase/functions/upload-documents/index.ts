
import { serve } from "https://deno.land/std@0.199.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents } = await req.json();
    
    if (!documents || !Array.isArray(documents)) {
      throw new Error("Invalid request: documents array is required");
    }
    
    console.log(`Processing ${documents.length} documents for upload`);
    
    // In a real app, we would store these in a database
    // For this example, we'll just acknowledge receipt and return success
    
    const processedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      // Store only metadata, not full content in the response
    }));
    
    console.log("Documents processed successfully");
    
    return new Response(JSON.stringify({
      status: "success",
      message: "Documents uploaded successfully",
      documents: processedDocuments
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in upload-documents function:', error);
    return new Response(JSON.stringify({ 
      status: "error",
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
