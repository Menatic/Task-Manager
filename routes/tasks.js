const express = require('express');
const router = express.Router();
const { Task, User, Team } = require('../models');
const { Op } = require('sequelize');

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all tasks with pagination
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, search } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows: tasks } = await Task.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'username', 'email']
      },
      {
        model: Team,
        as: 'team',
        attributes: ['id', 'name']
      }
    ],
    order: [
      ['priority', 'DESC'],
      ['due_date', 'ASC']
    ],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    tasks
  });
}));

// Create new task
router.post('/', asyncHandler(async (req, res) => {
  const { title, description, priority, due_date, team_id, assignee_id } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const task = await Task.create({
    title,
    description: description || null,
    priority: priority || 'Medium',
    due_date: due_date || null,
    status: 'Pending',
    progress: 0,
    team_id: team_id || null,
    assignee_id: assignee_id || null
  });

  const createdTask = await Task.findByPk(task.id, {
    include: [
      { model: User, as: 'assignee' },
      { model: Team, as: 'team' }
    ]
  });

  res.status(201).json(createdTask);
}));

// Update task
router.patch('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id, {
    include: [
      { model: User, as: 'assignee' },
      { model: Team, as: 'team' }
    ]
  });
  
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { progress, status, title, description, priority, due_date, assignee_id } = req.body;
  
  if (progress !== undefined) {
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: "Progress must be between 0-100" });
    }
    task.progress = progress;
    if (progress === 100) task.status = 'Completed';
  }

  if (status) task.status = status;
  if (title) task.title = title;
  if (description) task.description = description;
  if (priority) task.priority = priority;
  if (due_date) task.due_date = due_date;
  if (assignee_id) task.assignee_id = assignee_id;
  
  await task.save();
  res.json(task);
}));

// Delete task
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  await task.destroy();
  res.status(204).end();
}));

// New status update endpoint
router.patch('/:id/status', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee' },
        { model: Team, as: 'team' }
      ]
    });
    
    if (!task) return res.status(404).json({ error: "Task not found" });

    const { status } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update status and auto-set progress
    task.status = status;
    task.progress = status === 'Completed' ? 100 : 
                   status === 'In Progress' ? 50 : 0;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Updated stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const totalTasks = await Task.count();
    const completedTasks = await Task.count({ where: { status: 'Completed' } });
    const inProgressTasks = await Task.count({ where: { status: 'In Progress' } });
    const pendingTasks = await Task.count({ where: { status: 'Pending' } });
    const highPriorityTasks = await Task.count({ where: { priority: 'High' } });

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      highPriorityTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      inProgressRate: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Get task statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const totalTasks = await Task.count();
  const completedTasks = await Task.count({ where: { status: 'Completed' } });
  const inProgressTasks = await Task.count({ where: { status: 'In Progress' } });
  const highPriorityTasks = await Task.count({ where: { priority: 'High' } });
  const overdueTasks = await Task.count({
    where: {
      status: { [Op.not]: 'Completed' },
      due_date: { [Op.lt]: new Date() }
    }
  });
  
  res.json({
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    inProgressTasks,
    highPriorityTasks,
    overdueTasks
  });
}));

module.exports = router;