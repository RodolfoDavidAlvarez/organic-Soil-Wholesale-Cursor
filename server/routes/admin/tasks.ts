/**
 * Operations Task Board API
 * CRUD operations for Kanban-style task management
 */

import { Router } from "express";
import { supabase } from "../../supabaseClient.js";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth.js";

const router = Router();
router.use(adminAuthMiddleware);

// Team members and projects (used for validation/defaults)
const TEAM_MEMBERS = ["Kerry", "Simon", "Sabrina", "Jonathan", "Luis", "Gabriela"];
const PROJECTS = ["Waste Diversion", "Pistachio Farmer", "Potting Soil Blending", "General"];
const STATUSES = ["todo", "in_progress", "done"];

/**
 * GET /api/admin/operations/tasks
 * List all tasks, optionally filtered
 */
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { assignee, project, status } = req.query;

    let query = supabase
      .from("ops_tasks")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (assignee) query = query.eq("assignee", assignee);
    if (project) query = query.eq("project", project);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: error.message || "Failed to fetch tasks" });
  }
});

/**
 * GET /api/admin/operations/tasks/meta
 * Return available team members and projects
 */
router.get("/meta", async (_req: AdminRequest, res) => {
  try {
    const { data: projects } = await supabase
      .from("ops_projects")
      .select("*")
      .order("name");
    res.json({ teamMembers: TEAM_MEMBERS, projects: (projects || []).map((p: any) => p.name), statuses: STATUSES });
  } catch {
    res.json({ teamMembers: TEAM_MEMBERS, projects: PROJECTS, statuses: STATUSES });
  }
});

// =====================================================================
// Projects CRUD
// =====================================================================

/**
 * GET /api/admin/operations/tasks/projects
 * List all projects
 */
router.get("/projects", async (_req: AdminRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("ops_projects")
      .select("*")
      .order("name");
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: error.message || "Failed to fetch projects" });
  }
});

/**
 * POST /api/admin/operations/tasks/projects
 * Create a new project
 */
router.post("/projects", async (req: AdminRequest, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const { data, error } = await supabase
      .from("ops_projects")
      .insert({ name, color: color || "gray" })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: error.message || "Failed to create project" });
  }
});

/**
 * PATCH /api/admin/operations/tasks/projects/:id
 * Rename a project (also updates all tasks with that project)
 */
router.patch("/projects/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    // Get old project name first
    const { data: existing } = await supabase
      .from("ops_projects")
      .select("name")
      .eq("id", id)
      .single();

    const updates: any = {};
    if (name) updates.name = name;
    if (color) updates.color = color;

    const { data, error } = await supabase
      .from("ops_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If renamed, update all tasks with the old name
    if (name && existing && existing.name !== name) {
      await supabase
        .from("ops_tasks")
        .update({ project: name, updated_at: new Date().toISOString() })
        .eq("project", existing.name);
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: error.message || "Failed to update project" });
  }
});

/**
 * DELETE /api/admin/operations/tasks/projects/:id
 * Delete a project (nullifies project on tasks)
 */
router.delete("/projects/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    // Get project name first
    const { data: existing } = await supabase
      .from("ops_projects")
      .select("name")
      .eq("id", id)
      .single();

    // Nullify project on tasks
    if (existing) {
      await supabase
        .from("ops_tasks")
        .update({ project: null, updated_at: new Date().toISOString() })
        .eq("project", existing.name);
    }

    const { error } = await supabase
      .from("ops_projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: error.message || "Failed to delete project" });
  }
});

/**
 * POST /api/admin/operations/tasks
 * Create a new task
 */
router.post("/", async (req: AdminRequest, res) => {
  try {
    const { title, description, status, assignee, project, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Get next position for the status column
    const { data: maxPos } = await supabase
      .from("ops_tasks")
      .select("position")
      .eq("status", status || "todo")
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = (maxPos && maxPos.length > 0) ? maxPos[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("ops_tasks")
      .insert({
        title,
        description: description || null,
        status: status || "todo",
        assignee: assignee || null,
        project: project || null,
        priority: priority || "medium",
        due_date: due_date || null,
        position: nextPosition,
        created_by: req.admin?.email || "system",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: error.message || "Failed to create task" });
  }
});

/**
 * PATCH /api/admin/operations/tasks/:id
 * Update a task (title, description, status, assignee, etc.)
 */
router.patch("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const updates: any = { updated_at: new Date().toISOString() };

    const allowedFields = ["title", "description", "status", "assignee", "project", "priority", "due_date", "position"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const { data, error } = await supabase
      .from("ops_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: error.message || "Failed to update task" });
  }
});

/**
 * PATCH /api/admin/operations/tasks/:id/move
 * Move a task to a new status column with position update
 */
router.patch("/:id/move", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const { data, error } = await supabase
      .from("ops_tasks")
      .update({
        status,
        position: position ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error("Error moving task:", error);
    res.status(500).json({ message: error.message || "Failed to move task" });
  }
});

/**
 * DELETE /api/admin/operations/tasks/:id
 * Delete a task
 */
router.delete("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("ops_tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.message || "Failed to delete task" });
  }
});

export default router;
