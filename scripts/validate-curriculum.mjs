#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const LESSONS_DIR = path.join(ROOT, "src", "lessons");
const CURRICULUM_PATH = path.join(ROOT, "curriculum.json");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function listLessonFiles(dir) {
  const result = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!d) continue;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name === "lesson.md") result.push(full);
    }
  }
  return result;
}

function inferIdFromPath(p) {
  // src/lessons/<...>/lesson.md -> <...> with slashes replaced by dashes
  const rel = path.relative(path.join(ROOT, "src", "lessons"), p);
  return rel
    .replace(/\/lesson\.md$/, "")
    .replace(/\\/g, "/")
    .replace(/\//g, "-");
}

function loadLessons() {
  const files = listLessonFiles(LESSONS_DIR);
  const lessons = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf-8");
    const fm = matter(raw);
    const data = fm.data || {};
    const id = data.id || inferIdFromPath(file);
    lessons.push({ id, file, meta: data });
  }
  return lessons;
}

function validate() {
  const problems = { errors: [], warnings: [], notes: [] };
  if (!fs.existsSync(CURRICULUM_PATH)) {
    problems.errors.push(`Missing curriculum.json at repo root`);
    return problems;
  }
  const curriculum = readJSON(CURRICULUM_PATH);
  const conceptsRegistry = new Map(curriculum.concepts.map((c) => [c.id, c]));
  const conceptCanonicalFromRegistry = new Map(
    curriculum.concepts
      .filter((c) => c.canonical_lesson)
      .map((c) => [c.id, c.canonical_lesson])
  );

  const lessons = loadLessons();

  // Build owner and reuse maps
  const conceptOwnersFromLessons = new Map(); // conceptId -> Set<lessonId>
  const conceptReuseCount = new Map(); // conceptId -> number of lessons that reuse it

  for (const { id: lessonId, meta } of lessons) {
    const introduced = Array.isArray(meta.concepts_introduced)
      ? meta.concepts_introduced
      : [];
    const explicitCanon = Array.isArray(meta.canonical_for)
      ? meta.canonical_for
      : [];
    const reused = Array.isArray(meta.concepts_reused)
      ? meta.concepts_reused
      : [];

    // Unknown concepts check
    for (const cid of [...introduced, ...explicitCanon, ...reused]) {
      if (!conceptsRegistry.has(cid)) {
        problems.errors.push(
          `Unknown concept '${cid}' referenced in lesson '${lessonId}'`
        );
      }
    }

    // Owners from introduced + canonical_for
    const ownerCandidates = new Set([...introduced, ...explicitCanon]);
    for (const cid of ownerCandidates) {
      if (!conceptOwnersFromLessons.has(cid))
        conceptOwnersFromLessons.set(cid, new Set());
      conceptOwnersFromLessons.get(cid).add(lessonId);
    }

    // Reuse counts
    for (const cid of reused) {
      conceptReuseCount.set(cid, (conceptReuseCount.get(cid) || 0) + 1);
    }
  }

  // Overlap check: >1 canonical owner in lessons
  for (const [cid, owners] of conceptOwnersFromLessons.entries()) {
    if (owners.size > 1) {
      problems.errors.push(
        `Concept '${cid}' has multiple canonical owners: ${Array.from(
          owners
        ).join(", ")}`
      );
    }
  }

  // Registry mismatch warnings
  for (const [cid, regCanonical] of conceptCanonicalFromRegistry.entries()) {
    const owners = conceptOwnersFromLessons.get(cid) || new Set();
    if (owners.size === 1) {
      const [owner] = Array.from(owners);
      if (regCanonical && regCanonical !== owner) {
        problems.warnings.push(
          `Concept '${cid}': registry canonical '${regCanonical}' differs from lesson-declared owner '${owner}'`
        );
      }
    }
  }

  // Build dependency graph edges: prereqs + reused concept -> canonical lesson
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const edges = new Map(); // from -> Set<to>
  for (const { id: lessonId, meta } of lessons) {
    const tos = new Set();

    const prereqs = Array.isArray(meta.prereqs) ? meta.prereqs : [];
    for (const to of prereqs) tos.add(to);

    const reused = Array.isArray(meta.concepts_reused)
      ? meta.concepts_reused
      : [];
    for (const cid of reused) {
      const to = conceptCanonicalFromRegistry.get(cid);
      if (to && to !== lessonId) tos.add(to);
    }

    edges.set(lessonId, tos);
  }

  // Cycle detection (warn)
  const visited = new Set();
  const inStack = new Set();
  function dfs(node) {
    if (inStack.has(node)) return [true, [node]];
    if (visited.has(node)) return [false, []];
    visited.add(node);
    inStack.add(node);
    const tos = edges.get(node) || new Set();
    for (const n of tos) {
      const [hasCycle, path] = dfs(n);
      if (hasCycle) return [true, [node, ...path]];
    }
    inStack.delete(node);
    return [false, []];
  }
  for (const id of edges.keys()) {
    const [hasCycle, path] = dfs(id);
    if (hasCycle) {
      problems.warnings.push(
        `Dependency cycle detected: ${path.join(" -> ")} (truncated)`
      );
      break;
    }
  }

  // Coverage: concepts with no canonical owner in lessons
  for (const c of curriculum.concepts) {
    const owners = conceptOwnersFromLessons.get(c.id) || new Set();
    if (owners.size === 0) {
      problems.warnings.push(
        `Coverage: concept '${c.id}' has no canonical owner in lessons`
      );
    }
  }

  // Coverage: canonical lessons that are never reused
  for (const c of curriculum.concepts) {
    const canonical = conceptCanonicalFromRegistry.get(c.id);
    if (canonical) {
      const reusedCount = conceptReuseCount.get(c.id) || 0;
      if (reusedCount === 0) {
        problems.notes.push(
          `Coverage: concept '${c.id}' (owner '${canonical}') is not reused in any lesson`
        );
      }
    }
  }

  return problems;
}

const result = validate();
function printSection(title, items) {
  if (!items.length) return;
  console.log(`\n=== ${title} ===`);
  for (const msg of items) console.log(`- ${msg}`);
}

printSection("Errors", result.errors);
printSection("Warnings", result.warnings);
printSection("Notes", result.notes);

if (result.errors.length > 0) {
  console.error(
    `\nCurriculum validation failed with ${result.errors.length} error(s).`
  );
  process.exit(1);
} else {
  console.log(`\nCurriculum validation completed.`);
}
