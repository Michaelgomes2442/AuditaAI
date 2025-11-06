/**
 * Production Health Check System
 * Validates governance system integrity and readiness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getModelTier } from './governance-selector.js';
import { loadRosettaPrompt, getGovernanceMetadata } from './governance-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run comprehensive governance system health check
 * @returns {Object} Health check results
 */
export async function runGovernanceHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    status: 'HEALTHY',
    checks: [],
    warnings: [],
    errors: []
  };

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🏥 GOVERNANCE SYSTEM HEALTH CHECK - vΩ-Enterprise');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Check 1: Governance files exist
  try {
    const frontierPath = path.join(__dirname, '../governance/rosetta-frontier.txt');
    const litePath = path.join(__dirname, '../governance/rosetta-lite.txt');
    
    if (fs.existsSync(frontierPath)) {
      const frontierContent = fs.readFileSync(frontierPath, 'utf-8');
      results.checks.push({
        name: 'Frontier Governance File',
        status: 'PASS',
        size: frontierContent.length,
        path: frontierPath
      });
      console.log('✅ Frontier governance file exists:', frontierContent.length, 'chars');
      
      // Validate content
      if (!frontierContent.includes('vΩ-Enterprise')) {
        results.warnings.push('Frontier file missing vΩ-Enterprise version marker');
        console.log('⚠️  WARNING: Frontier file missing version marker');
      }
    } else {
      results.errors.push('Frontier governance file not found');
      console.log('❌ ERROR: Frontier governance file not found');
      results.status = 'UNHEALTHY';
    }
    
    if (fs.existsSync(litePath)) {
      const liteContent = fs.readFileSync(litePath, 'utf-8');
      results.checks.push({
        name: 'Lite Governance File',
        status: 'PASS',
        size: liteContent.length,
        path: litePath
      });
      console.log('✅ Lite governance file exists:', liteContent.length, 'chars');
      
      // Validate content
      if (!liteContent.includes('vΩ-Enterprise')) {
        results.warnings.push('Lite file missing vΩ-Enterprise version marker');
        console.log('⚠️  WARNING: Lite file missing version marker');
      }
    } else {
      results.errors.push('Lite governance file not found');
      console.log('❌ ERROR: Lite governance file not found');
      results.status = 'UNHEALTHY';
    }
  } catch (error) {
    results.errors.push(`File system check failed: ${error.message}`);
    console.log('❌ ERROR: File system check failed:', error.message);
    results.status = 'UNHEALTHY';
  }

  // Check 2: Tier detection works for known models
  console.log('\n🔍 Testing tier detection...');
  const testModels = [
    { id: 'claude-opus-4-1-20250805', expectedTier: 'frontier' },
    { id: 'gpt-5-preview', expectedTier: 'frontier' },
    { id: 'claude-3-5-haiku-20241022', expectedTier: 'lite' },
    { id: 'gpt-4o-mini', expectedTier: 'lite' },
    { id: 'claude-3-5-sonnet-20241022', expectedTier: 'lite' }
  ];
  
  for (const { id, expectedTier } of testModels) {
    const detectedTier = getModelTier(id);
    if (detectedTier === expectedTier) {
      console.log(`✅ ${id} → ${detectedTier} (correct)`);
      results.checks.push({
        name: `Tier Detection: ${id}`,
        status: 'PASS',
        detected: detectedTier,
        expected: expectedTier
      });
    } else {
      console.log(`❌ ${id} → ${detectedTier} (expected ${expectedTier})`);
      results.errors.push(`Tier detection failed for ${id}: got ${detectedTier}, expected ${expectedTier}`);
      results.status = 'UNHEALTHY';
    }
  }

  // Check 3: Prompt loading works
  console.log('\n📥 Testing prompt loading...');
  try {
    const frontierPrompt = await loadRosettaPrompt('frontier');
    if (frontierPrompt && frontierPrompt.length > 1000) {
      console.log(`✅ Frontier prompt loaded: ${frontierPrompt.length} chars`);
      results.checks.push({
        name: 'Frontier Prompt Loading',
        status: 'PASS',
        size: frontierPrompt.length
      });
    } else {
      results.errors.push('Frontier prompt too short or empty');
      console.log('❌ ERROR: Frontier prompt too short or empty');
      results.status = 'UNHEALTHY';
    }
    
    const litePrompt = await loadRosettaPrompt('lite');
    if (litePrompt && litePrompt.length > 1000) {
      console.log(`✅ Lite prompt loaded: ${litePrompt.length} chars`);
      results.checks.push({
        name: 'Lite Prompt Loading',
        status: 'PASS',
        size: litePrompt.length
      });
    } else {
      results.errors.push('Lite prompt too short or empty');
      console.log('❌ ERROR: Lite prompt too short or empty');
      results.status = 'UNHEALTHY';
    }
  } catch (error) {
    results.errors.push(`Prompt loading failed: ${error.message}`);
    console.log('❌ ERROR: Prompt loading failed:', error.message);
    results.status = 'UNHEALTHY';
  }

  // Check 4: Metadata generation works
  console.log('\n📊 Testing metadata generation...');
  try {
    const testPrompt = 'Test governance prompt for metadata validation';
    const frontierMeta = getGovernanceMetadata('frontier', testPrompt);
    const liteMeta = getGovernanceMetadata('lite', testPrompt);
    
    if (frontierMeta.governance_version === 'vΩ-Enterprise') {
      console.log('✅ Frontier metadata includes vΩ-Enterprise version');
      results.checks.push({
        name: 'Frontier Metadata Generation',
        status: 'PASS',
        version: frontierMeta.governance_version
      });
    } else {
      results.warnings.push('Frontier metadata missing vΩ-Enterprise version');
      console.log('⚠️  WARNING: Frontier metadata missing enterprise version');
    }
    
    if (liteMeta.governance_version === 'vΩ-Enterprise') {
      console.log('✅ Lite metadata includes vΩ-Enterprise version');
      results.checks.push({
        name: 'Lite Metadata Generation',
        status: 'PASS',
        version: liteMeta.governance_version
      });
    } else {
      results.warnings.push('Lite metadata missing vΩ-Enterprise version');
      console.log('⚠️  WARNING: Lite metadata missing enterprise version');
    }
    
    // Check for enterprise fields
    if (frontierMeta.compliance_level === 'production-ready') {
      console.log('✅ Compliance level: production-ready');
    } else {
      results.warnings.push('Missing compliance_level field');
      console.log('⚠️  WARNING: Missing compliance_level field');
    }
    
    if (frontierMeta.expected_cries_improvement) {
      console.log('✅ CRIES improvement target:', frontierMeta.expected_cries_improvement);
    } else {
      results.warnings.push('Missing CRIES improvement target');
      console.log('⚠️  WARNING: Missing CRIES improvement target');
    }
    
    if (frontierMeta.prompt_hash) {
      console.log('✅ Prompt hash generation working');
    } else {
      results.warnings.push('Prompt hash generation failed');
      console.log('⚠️  WARNING: Prompt hash generation failed');
    }
  } catch (error) {
    results.errors.push(`Metadata generation failed: ${error.message}`);
    console.log('❌ ERROR: Metadata generation failed:', error.message);
    results.status = 'UNHEALTHY';
  }

  // Check 5: Deprecated Speechcraft layer warnings
  console.log('\n⚠️  Checking deprecated systems...');
  const speechcraftPaths = [
    path.join(__dirname, '../rosetta/mcp/kernel/speechcraft.ts'),
    path.join(__dirname, './kernel/speechcraft.js')
  ];
  
  let deprecatedFound = false;
  for (const scPath of speechcraftPaths) {
    if (fs.existsSync(scPath)) {
      const content = fs.readFileSync(scPath, 'utf-8');
      if (content.includes('DEPRECATED - DO NOT USE FOR FRONTIER MODELS')) {
        console.log('✅ Speechcraft deprecation warning present:', path.basename(scPath));
        deprecatedFound = true;
      } else {
        results.warnings.push(`Speechcraft file missing deprecation warning: ${path.basename(scPath)}`);
        console.log('⚠️  WARNING: Speechcraft missing deprecation warning:', path.basename(scPath));
      }
    }
  }
  
  if (deprecatedFound) {
    results.checks.push({
      name: 'Deprecated Systems Marked',
      status: 'PASS',
      note: 'Speechcraft properly deprecated'
    });
  }

  // Final summary
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`🏁 HEALTH CHECK COMPLETE - Status: ${results.status}`);
  console.log(`   Total Checks: ${results.checks.length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  console.log(`   Errors: ${results.errors.length}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(w => console.log('   •', w));
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('❌ ERRORS:');
    results.errors.forEach(e => console.log('   •', e));
    console.log('');
  }

  return results;
}

/**
 * Quick validation that governance system is ready
 * @returns {boolean} True if system is healthy
 */
export async function validateGovernanceReady() {
  const results = await runGovernanceHealthCheck();
  return results.status === 'HEALTHY';
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  runGovernanceHealthCheck().then(results => {
    process.exit(results.status === 'HEALTHY' ? 0 : 1);
  });
}
