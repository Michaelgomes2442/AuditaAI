# Deprecated CRIES modules archive

This folder contains an archive placeholder for the removed `backend/src/cries/` modules.

Action performed on 2025-11-12:

- `backend/src/cries/` was removed from the active source tree as part of the migration to FORGE.
- The domain classifier required for runtime was migrated into `backend/src/forge/classifier.js` and imports updated.

If you need to restore any of the CRIES source files, retrieve them from Git history or your backup before this operation.

Note: other parts of the repository (tests, docs, rosetta tools, frontend) may still reference CRIES artifacts. Update them to use FORGE equivalents if needed.
