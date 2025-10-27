// vercel-log-fetcher.js
// Fetches logs from Vercel for frontend and backend projects
// Usage: node vercel-log-fetcher.js


import fetch from 'node-fetch';
import fs from 'fs';


const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'zwk5CexKzbTbYw72W7K7ZhoL';
const PROJECTS = [
  { id: 'prj_PQeuLNwIczrPCL6oKzcbFPlk5BhD', label: 'frontend' },
  { id: 'prj_nGizD46Z1Qt0jr7AXBX2cLWC27Rl', label: 'backend' }
];
const TEAM_ID = 'team_gxUeZQrspyOzJc9ZEbMO74Ar';
const LOG_LIMIT = 100; // Number of log entries to fetch per project


async function fetchLatestDeploymentId(project) {
  // Try fetching all deployments for the team, then filter in code
  const url = `https://api.vercel.com/v6/deployments?teamId=${TEAM_ID}&limit=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Vercel API error response: ${errorText}`);
    throw new Error(`Failed to fetch deployments for team: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.deployments || data.deployments.length === 0) {
    throw new Error(`No deployments found for team`);
  }
  // Find the latest deployment for the project
  const deployment = data.deployments.find(dep => dep.projectId === project.id);
  if (!deployment) {
    throw new Error(`No deployments found for project ${project.label}`);
  }
  return deployment.uid;
}


// Fetch function logs for a deployment
async function fetchFunctionLogs(deploymentId, functionName) {
  const url = `https://api.vercel.com/v2/deployments/${deploymentId}/functions/${functionName}/logs?teamId=${TEAM_ID}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Vercel API function log error: ${errorText}`);
    throw new Error(`Failed to fetch function logs for ${functionName} in deployment ${deploymentId}: ${res.statusText}`);
  }
  const data = await res.json();
  return data.logs || [];
}


async function main() {
  for (const project of PROJECTS) {
    try {
      const deploymentId = await fetchLatestDeploymentId(project);
      // For demonstration, try common function names. In production, list functions via API or config.
      const functionNames = ['index', 'api', 'server', 'main'];
      for (const fn of functionNames) {
        try {
          const logs = await fetchFunctionLogs(deploymentId, fn);
          const logFile = `vercel-function-logs-${project.label}-${fn}.json`;
          fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
          console.log(`Fetched function logs for ${project.label} (${fn}) → ${logFile}`);
        } catch (err) {
          // Log and continue to next function name
          console.error(err.message);
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  }
}

main();
