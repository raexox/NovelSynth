# Worldbuilding & Continuity Command Center

## Overview
The **Worldbuilding & Continuity Command Center** transforms the Reference Library experience in NovelSynth. Instead of restricting world building management, canon fact ledgers, and character dossiers to a narrow ~280px sidebar, this module introduces an expansive dual-mode system.

## Components & Structure
- `ReferenceLibraryModal.tsx`: Expansive multi-pane modal container (90vh x 1400px) providing ample room for complex worldbuilding.
- `ReferenceLibrary.tsx` (Sidebar): Serves as both a quick-lookup panel while writing and an entry point to launch the full Command Center.
- `src/styles/reference-modal.css`: High-contrast dark theme styles and glassmorphism overlays tailored for long writing sessions.

## Architecture & Data Flow
1. Global state fields (`isReferenceModalOpen`, `openReferenceModal`, `closeReferenceModal`) managed in `src/store/index.tsx`.
2. Bi-directional entity relationships: Selecting an entity in the master list updates the main detail form while dynamically cross-referencing connected continuity facts and manuscript scene appearances in the right inspector pane.
3. Scene Navigation: Clicking a connected manuscript scene in the relational inspector directly selects that scene and closes the modal so authors can immediately jump into editing.
