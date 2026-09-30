import { supabase } from '../config/database.js';
import { EmbeddingRepository } from '../repositories/embedding.repository.js';
import { EmbeddingService } from './embedding.service.js';

export interface SeedResult {
  projectId: string;
  projectName: string;
  assetCount: number;
  comparisonCount: number;
  claimCount: number;
}

const embeddingRepo = new EmbeddingRepository();
const embeddingService = new EmbeddingService();

export async function ensureDemoDataForUser(guestUserId: string): Promise<SeedResult> {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  // 1. Check if demo project already exists for this guest user
  const { data: existingProjects, error: fetchErr } = await supabase
    .from('projects')
    .select('id, name')
    .eq('created_by', guestUserId)
    .eq('name', 'Yamuna River Restoration Demo')
    .limit(1);

  if (fetchErr) {
    console.error('[DemoSeed] Error checking existing projects:', fetchErr);
  }

  if (existingProjects && existingProjects.length > 0) {
    const proj = existingProjects[0];
    const { count: assetCount } = await supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', proj.id);

    const { count: claimCount } = await supabase
      .from('evidence_claims')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', proj.id);

    const { count: comparisonCount } = await supabase
      .from('comparisons')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', proj.id);

    // If fully seeded (at least 8 assets, 5 claims, 1 comparison), reuse it
    if ((assetCount || 0) >= 8 && (claimCount || 0) >= 5 && (comparisonCount || 0) >= 1) {
      return {
        projectId: proj.id,
        projectName: proj.name,
        assetCount: assetCount || 0,
        comparisonCount: comparisonCount || 0,
        claimCount: claimCount || 0,
      };
    }

    console.log(`[DemoSeed] Incomplete demo project found (assets: ${assetCount}, claims: ${claimCount}, comparisons: ${comparisonCount}). Re-seeding cleanly...`);
    await supabase.from('projects').delete().eq('id', proj.id);
  }

  console.log(`[DemoSeed] Seeding fresh, complete demo workspace for guest user: ${guestUserId}`);

  // 2. Create the demo project
  const { data: projectData, error: projErr } = await supabase
    .from('projects')
    .insert({
      name: 'Yamuna River Restoration Demo',
      description: 'Demonstration project showing media intelligence, evidence traceability, before/after analysis, evidence gaps, confidence, and reporting.',
      location: 'Delhi, India',
      start_date: '2025-01-15',
      end_date: '2026-06-30',
      project_type: 'river_restoration',
      created_by: guestUserId,
    })
    .select()
    .single();

  if (projErr || !projectData) {
    throw new Error(`Failed to create demo project: ${projErr?.message}`);
  }

  const projectId = projectData.id;

  // 3. Define 8 rich, professional demo assets
  const demoAssets = [
    {
      url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
      type: 'image',
      capture_date: '2025-03-15T09:30:00Z',
      latitude: 28.6652,
      longitude: 77.2324,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'riverbank_industrial_zone',
        description: 'Extensive non-biodegradable plastic debris and solid waste accumulation along Yamuna shoreline before restoration.',
        objects: ['plastic_waste', 'debris', 'sediment', 'stagnant_water', 'polluted_embankment'],
        activities: ['site_survey', 'baseline_assessment', 'waste_accumulation'],
        visible_condition: 'severely_degraded',
        confidence: 0.94,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
      type: 'image',
      capture_date: '2025-05-18T08:00:00Z',
      latitude: 28.6650,
      longitude: 77.2320,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'active_cleanup_site',
        description: 'Organized municipal and volunteer teams conducting heavy solid waste removal and debris sorting along floodplain.',
        objects: ['cleanup_crews', 'waste_sacks', 'debris_sorting_area', 'protective_gear'],
        activities: ['River Cleanup', 'Waste Collection', 'Debris Segregation'],
        visible_condition: 'active_intervention',
        confidence: 0.96,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      type: 'image',
      capture_date: '2025-07-22T10:15:00Z',
      latitude: 28.6648,
      longitude: 77.2315,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'embankment_earthwork',
        description: 'Erosion control berm preparation and grading along riverside buffer zone prior to plantation.',
        objects: ['graded_soil', 'stabilization_berm', 'geotextile_matting', 'irrigation_trenches'],
        activities: ['Embankment Stabilization', 'Erosion Control', 'Soil Preparation'],
        visible_condition: 'stabilized_earth',
        confidence: 0.93,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
      type: 'image',
      capture_date: '2025-09-10T07:45:00Z',
      latitude: 28.6655,
      longitude: 77.2328,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'riparian_plantation',
        description: 'Community members and ecologists planting native riparian saplings (Neem, Peepal, Arjun) along riverbank.',
        objects: ['native_saplings', 'plantation_stakes', 'planting_volunteers', 'rootball_mulch'],
        activities: ['Tree Plantation', 'Riparian Restoration', 'Community Planting'],
        visible_condition: 'newly_planted',
        confidence: 0.95,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      type: 'image',
      capture_date: '2026-03-20T11:00:00Z',
      latitude: 28.6653,
      longitude: 77.2325,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'restored_riparian_zone',
        description: 'Established native riparian green corridor with flourishing saplings, stabilized grass cover, and cleared riverbank.',
        objects: ['young_trees', 'dense_vegetation_buffer', 'stabilized_riverbank', 'clear_shoreline'],
        activities: ['Revegetation', 'Ecosystem Recovery', 'Canopy Establishment'],
        visible_condition: 'restored_healthy',
        confidence: 0.97,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800',
      type: 'image',
      capture_date: '2025-11-12T14:20:00Z',
      latitude: 28.6280,
      longitude: 77.2510,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'water_quality_monitoring',
        description: 'Field technician collecting water samples for dissolved oxygen and turbidity testing.',
        objects: ['water_sampling_kit', 'sample_bottles', 'field_spectrophotometer'],
        activities: ['Water Quality Monitoring', 'Field Testing', 'Compliance Sampling'],
        visible_condition: 'moderately_turbid',
        confidence: 0.92,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
      type: 'image',
      capture_date: '2025-10-05T16:00:00Z',
      latitude: 28.6295,
      longitude: 77.2505,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'community_awareness_workshop',
        description: 'River basin stakeholder awareness session on solid waste management and floodplain stewardship.',
        objects: ['stewardship_banners', 'community_participants', 'educational_materials'],
        activities: ['Community Engagement', 'Stewardship Workshop', 'Public Awareness'],
        visible_condition: 'educational_forum',
        confidence: 0.91,
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      type: 'image',
      capture_date: '2026-02-14T09:10:00Z',
      latitude: 28.5710,
      longitude: 77.3020,
      uploaded_by: 'Field Analyst',
      analysis: {
        scene: 'constructed_wetland_biofilter',
        description: 'Natural constructed wetland channel with reed beds treating incoming drain runoff before river confluence.',
        objects: ['constructed_wetland', 'reed_beds', 'clear_effluent_stream', 'cattails'],
        activities: ['Biofiltration', 'Wetland Treatment', 'Drain Remediation'],
        visible_condition: 'operational_biofilter',
        confidence: 0.94,
      },
    },
  ];

  const createdAssets: Array<{ id: string; url: string; capture_date: string }> = [];

  for (let i = 0; i < demoAssets.length; i++) {
    const item = demoAssets[i];
    // Insert asset
    const { data: assetData, error: assetErr } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        cloudinary_public_id: `yamuna_demo_${i + 1}`,
        url: item.url,
        type: item.type,
        capture_date: item.capture_date,
        latitude: item.latitude,
        longitude: item.longitude,
        uploaded_by: item.uploaded_by,
      })
      .select()
      .single();

    if (assetErr || !assetData) {
      console.error(`[DemoSeed] Error inserting asset ${i + 1}:`, assetErr);
      continue;
    }

    createdAssets.push({
      id: assetData.id,
      url: assetData.url,
      capture_date: assetData.capture_date,
    });

    // Insert AI analysis
    const { error: aiErr } = await supabase.from('ai_analysis').insert({
      asset_id: assetData.id,
      description: item.analysis.description,
      objects: item.analysis.objects,
      activities: item.analysis.activities,
      scene: item.analysis.scene,
      visible_condition: item.analysis.visible_condition,
      confidence: item.analysis.confidence,
      source: 'gemini',
    });

    if (aiErr) {
      console.error(`[DemoSeed] Error inserting AI analysis for asset ${i + 1}:`, aiErr);
    }

    // Insert embedding using EmbeddingRepository for proper pgvector formatting
    try {
      const textToEmbed = `${item.analysis.description} ${item.analysis.activities.join(' ')}`;
      const embeddingVec = await embeddingService.embedText(textToEmbed);
      await embeddingRepo.upsert(assetData.id, embeddingVec, 'gemini-embedding-2');
    } catch (embErr) {
      console.warn(`[DemoSeed] Could not insert embedding for asset ${i + 1}:`, embErr);
    }
  }

  // 4. Create Phase 5 Before / After comparison
  if (createdAssets.length >= 5) {
    const beforeAsset = createdAssets[0]; // March 2025
    const afterAsset = createdAssets[4];  // March 2026

    const comparisonData = {
      summary: '12-month longitudinal comparison indicates significant ecological recovery along the Yamuna floodplain embankment, transitioning from a severely degraded solid waste dump to an established native riparian buffer.',
      observed_changes: [
        'Removal of over 90% visible non-biodegradable surface plastic and municipal debris along the shoreline.',
        'Establishment of dense native vegetative buffer including young Neem, Peepal, and Arjun saplings with >60% ground canopy.',
        'Stabilization of riverside slope geometry preventing seasonal monsoon bank erosion.',
        'Significant reduction in localized surface water stagnation and sludge accumulation.',
      ],
      environmental_metrics: {
        vegetation_increase_pct: 65,
        debris_reduction_pct: 92,
        erosion_risk_reduction: 'High to Low',
      },
      model_confidence: 0.95,
      changes: [
        {
          category: 'vegetation',
          direction: 'increased',
          description: 'Dense native vegetative buffer and sapling canopy expanded by 65%',
          confidence: 0.95,
        },
        {
          category: 'debris',
          direction: 'decreased',
          description: 'Non-biodegradable surface plastic debris reduced by 92%',
          confidence: 0.96,
        },
        {
          category: 'infrastructure',
          direction: 'improved',
          description: 'Riverside embankment stabilization and erosion berm established',
          confidence: 0.94,
        },
      ],
    };

    const { error: compErr } = await supabase.from('comparisons').insert({
      project_id: projectId,
      before_asset_id: beforeAsset.id,
      after_asset_id: afterAsset.id,
      comparison_result: comparisonData,
      confidence: 0.95,
      status: 'completed',
      model: 'gemini-3.8-flash',
      created_by: guestUserId,
    });

    if (compErr) {
      console.error('[DemoSeed] Error inserting comparison:', compErr);
    }
  }

  // 5. Create Phase 6 Evidence Claims & Junction
  const claimsDefs = [
    {
      claim: 'Comprehensive shoreline waste remediation eliminated surface debris across 2.4 km Yamuna floodplain',
      confidence: 0.96,
      source_type: 'asset_analysis',
      source_id: createdAssets[1]?.id,
      category: 'activity',
      asset_indices: [0, 1],
    },
    {
      claim: 'Native riparian vegetation cover expanded by 65% across restored buffer corridor',
      confidence: 0.95,
      source_type: 'comparison',
      source_id: 'comparison-yamuna-1',
      category: 'long_term_outcome',
      asset_indices: [0, 4],
    },
    {
      claim: 'Over 1,200 native saplings planted along riparian stabilization berm',
      confidence: 0.95,
      source_type: 'asset_analysis',
      source_id: createdAssets[3]?.id,
      category: 'activity',
      asset_indices: [3],
    },
    {
      claim: 'Baseline environmental degradation documented severe solid waste and industrial runoff in March 2025',
      confidence: 0.94,
      source_type: 'asset_analysis',
      source_id: createdAssets[0]?.id,
      category: 'initial_condition',
      asset_indices: [0],
    },
    {
      claim: 'Immediate reduction in visible floating debris and bank slope sludge following initial cleanout',
      confidence: 0.93,
      source_type: 'asset_analysis',
      source_id: createdAssets[1]?.id,
      category: 'immediate_result',
      asset_indices: [1],
    },
  ];

  for (const c of claimsDefs) {
    const normalizedClaim = c.claim.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const { data: claimData, error: claimErr } = await supabase
      .from('evidence_claims')
      .insert({
        project_id: projectId,
        claim: c.claim,
        confidence: c.confidence,
        source_type: c.source_type,
        source_id: c.source_id,
        category: c.category,
        normalized_claim: normalizedClaim,
        created_by: guestUserId,
      })
      .select()
      .single();

    if (claimErr || !claimData) {
      console.error('[DemoSeed] Error inserting claim:', claimErr);
      continue;
    }

    // Link evidence assets
    for (const idx of c.asset_indices) {
      const asset = createdAssets[idx];
      if (asset) {
        try {
          await supabase.from('claim_evidence').insert({
            claim_id: claimData.id,
            asset_id: asset.id,
          });
        } catch (err) {
          console.warn('[DemoSeed] claim_evidence link warning:', err);
        }
      }
    }
  }

  // 6. Create Phase 9 Report Record
  const { error: repErr } = await supabase.from('reports').insert({
    project_id: projectId,
    title: 'Yamuna River Restoration Comprehensive Impact Evaluation',
    created_by: guestUserId,
  });

  if (repErr) {
    console.error('[DemoSeed] Error creating report record:', repErr);
  }

  console.log(`[DemoSeed] Successfully initialized demo project: ${projectId}`);
  return {
    projectId,
    projectName: 'Yamuna River Restoration Demo',
    assetCount: createdAssets.length,
    comparisonCount: 1,
    claimCount: claimsDefs.length,
  };
}
